import { formatEUR, formatPercent, formatTaux } from '../money';
import {
  getParam,
  getRate,
  getValue,
  mergeSources,
  toSource,
  type CalcResult,
  type TaxParamSet,
} from './types';

/**
 * Revenus immobiliers belges (doc 06 § 2).
 *
 * Le principe belge est très différent du principe français, et c'est la source
 * d'erreur n° 1 des outils étrangers : pour un bien loué à un particulier qui
 * l'occupe à des fins privées, l'imposition ne porte **pas sur les loyers perçus**
 * mais sur le revenu cadastral indexé, majoré de 40 %.
 *
 * ```
 * base imposable = RC × coefficient d'indexation × 1,40
 * ```
 *
 * Si le locataire affecte le bien à un usage professionnel, la base devient le
 * loyer réel net de forfait de charges — nettement plus lourd. D'où `usage_bien`.
 */

export type UsageBien = 'propre' | 'locatif_prive' | 'locatif_pro';

export const LIBELLE_USAGE: Record<UsageBien, string> = {
  propre: 'Habitation propre',
  locatif_prive: 'Loué à un particulier, usage privé',
  locatif_pro: 'Loué à usage professionnel',
};

export type BaseImposableInput = {
  /** Revenu cadastral non indexé, en centimes. */
  revenuCadastralCents: number;
  usage: UsageBien;
  /** Loyer annuel réellement perçu, en centimes. Requis pour `locatif_pro`. */
  loyerAnnuelCents?: number;
  /** Quote-part de détention, en pourcentage. Défaut 100. */
  quotePartPourcent?: number;
};

export type BaseImposableResult = {
  baseImposableCents: number;
  rcIndexeCents: number;
  /** Régime réellement appliqué, pour l'affichage. */
  regime: 'exonere' | 'rc_majore' | 'loyer_reel';
};

export function calculerBaseImposableImmobiliere(
  input: BaseImposableInput,
  params: TaxParamSet,
): CalcResult<BaseImposableResult> {
  const rc = Math.max(0, input.revenuCadastralCents);
  const quotePart = (input.quotePartPourcent ?? 100) / 100;

  const pCoeff = getParam(params, 'rc.coefficient_indexation');
  const pMajoration = getParam(params, 'rc.majoration_locatif');
  const coefficient = getValue(params, 'rc.coefficient_indexation');
  const majoration = getValue(params, 'rc.majoration_locatif');

  const rcIndexeCents = Math.round(rc * coefficient);

  if (input.usage === 'propre') {
    return {
      result: { baseImposableCents: 0, rcIndexeCents, regime: 'exonere' },
      breakdown: [
        { libelle: 'Revenu cadastral', valeur: rc, unite: 'eur' },
        {
          libelle: 'RC indexé',
          valeur: rcIndexeCents,
          unite: 'eur',
          precision: `${formatEUR(rc)} × ${coefficient}`,
        },
        {
          libelle: 'Habitation propre — exonérée à l’IPP',
          valeur: 0,
          unite: 'eur',
          total: true,
        },
      ],
      sources: [toSource(pCoeff)],
      hypotheses: ["L'habitation propre est exonérée de revenu cadastral à l'impôt des personnes physiques."],
    };
  }

  if (input.usage === 'locatif_pro') {
    const loyer = Math.max(0, input.loyerAnnuelCents ?? 0);
    const pForfait = getParam(params, 'immobilier.forfait_charges_professionnel');
    const forfait = getRate(params, 'immobilier.forfait_charges_professionnel');

    // Le forfait de 40 % est **plafonné** : il ne peut dépasser les deux tiers
    // du revenu cadastral non indexé, revalorisé par un coefficient annuel.
    // Sans ce plafond, un loyer élevé sur un bien à faible RC produisait une
    // déduction bien supérieure à ce que la loi permet, donc une base imposable
    // trop basse — l'erreur allait dans le sens qui rassure à tort.
    const pRevalorisation = getParam(params, 'immobilier.coefficient_revalorisation');
    const revalorisation = getValue(params, 'immobilier.coefficient_revalorisation');
    const plafondForfaitCents = Math.round((2 / 3) * rc * revalorisation);

    const forfaitBrutCents = Math.round(loyer * forfait);
    const forfaitCents = Math.min(forfaitBrutCents, plafondForfaitCents);
    const forfaitPlafonne = forfaitBrutCents > plafondForfaitCents;

    // La base ne peut pas descendre sous le RC indexé majoré.
    const planchierCents = Math.round(rcIndexeCents * majoration);
    const netCents = Math.max(loyer - forfaitCents, planchierCents);
    const baseImposableCents = Math.round(netCents * quotePart);

    return {
      result: { baseImposableCents, rcIndexeCents, regime: 'loyer_reel' },
      breakdown: [
        { libelle: 'Loyer annuel perçu', valeur: loyer, unite: 'eur' },
        {
          libelle: 'Forfait légal de charges',
          valeur: -forfaitCents,
          unite: 'eur',
          precision: forfaitPlafonne
            ? `${formatTaux(pForfait.valeur, 0)} du loyer brut, ramenés au plafond légal de ${formatEUR(plafondForfaitCents)} (deux tiers du RC revalorisé)`
            : `${formatTaux(pForfait.valeur, 0)} du loyer brut`,
        },
        {
          libelle: 'Plancher : RC indexé majoré',
          valeur: planchierCents,
          unite: 'eur',
          precision: 'La base ne peut pas être inférieure au RC indexé majoré',
        },
        { libelle: 'Base imposable', valeur: baseImposableCents, unite: 'eur', total: true },
      ],
      sources: mergeSources([
        toSource(pCoeff),
        toSource(pMajoration),
        toSource(pForfait),
        toSource(pRevalorisation),
      ]),
      hypotheses: [
        'Location à usage professionnel : la base est le loyer réel diminué du forfait légal de charges.',
        'Ce forfait est plafonné aux deux tiers du revenu cadastral revalorisé : au-delà, le surplus de loyer reste imposable.',
        'Ce régime est nettement plus lourd que la location à un particulier — c’est la contrepartie d’un bail professionnel.',
      ],
    };
  }

  // Location à un particulier, usage privé : le régime belge classique.
  const baseAvantQuotePart = Math.round(rcIndexeCents * majoration);
  const baseImposableCents = Math.round(baseAvantQuotePart * quotePart);

  return {
    result: { baseImposableCents, rcIndexeCents, regime: 'rc_majore' },
    breakdown: [
      { libelle: 'Revenu cadastral', valeur: rc, unite: 'eur' },
      {
        libelle: 'RC indexé',
        valeur: rcIndexeCents,
        unite: 'eur',
        precision: `${formatEUR(rc)} × ${coefficient} (coefficient d'indexation)`,
      },
      {
        libelle: 'Majoration de 40 %',
        valeur: baseAvantQuotePart,
        unite: 'eur',
        precision: `${formatEUR(rcIndexeCents)} × ${majoration}`,
      },
      { libelle: 'Base imposable', valeur: baseImposableCents, unite: 'eur', total: true },
    ],
    sources: [toSource(pCoeff), toSource(pMajoration)],
    hypotheses: [
      "Tu n'es pas taxé sur les loyers perçus mais sur le revenu cadastral indexé majoré de 40 %.",
      'Ce régime suppose que le locataire est un particulier qui occupe le bien à des fins privées.',
    ],
  };
}

export type ImpotLocatifInput = BaseImposableInput & {
  /** Taux marginal IPP du contribuable, en ratio (0.45 pour 45 %). */
  tauxMarginal: number;
};

export type ImpotLocatifResult = BaseImposableResult & {
  impotAnnuelCents: number;
  impotMensuelCents: number;
  /** Taux d'imposition effectif rapporté au loyer réellement perçu. */
  tauxEffectifSurLoyer: number;
};

/**
 * Impôt annuel sur un bien locatif, au taux marginal du contribuable.
 * Le taux effectif rapporté au loyer est souvent bien plus bas que le taux marginal :
 * c'est l'information qui manque partout ailleurs.
 */
export function calculerImpotRevenusLocatifs(
  input: ImpotLocatifInput,
  params: TaxParamSet,
): CalcResult<ImpotLocatifResult> {
  const base = calculerBaseImposableImmobiliere(input, params);
  const impotAnnuelCents = Math.round(base.result.baseImposableCents * input.tauxMarginal);
  const loyer = Math.max(0, input.loyerAnnuelCents ?? 0);

  return {
    result: {
      ...base.result,
      impotAnnuelCents,
      impotMensuelCents: Math.round(impotAnnuelCents / 12),
      tauxEffectifSurLoyer: loyer > 0 ? impotAnnuelCents / loyer : 0,
    },
    breakdown: [
      ...base.breakdown.filter((l) => !l.total),
      {
        libelle: 'Base imposable',
        valeur: base.result.baseImposableCents,
        unite: 'eur',
      },
      {
        libelle: 'Taux marginal appliqué',
        valeur: input.tauxMarginal * 100,
        unite: 'pourcent',
        precision: 'Les revenus immobiliers s’ajoutent aux revenus globaux',
      },
      { libelle: 'Impôt annuel', valeur: impotAnnuelCents, unite: 'eur', total: true },
      ...(loyer > 0
        ? [
            {
              libelle: 'Taux effectif sur le loyer perçu',
              valeur: (impotAnnuelCents / loyer) * 100,
              unite: 'pourcent' as const,
              precision: `L'impôt représente ${formatPercent(impotAnnuelCents / loyer)} du loyer, pas ${formatPercent(input.tauxMarginal)}`,
            },
          ]
        : []),
    ],
    sources: base.sources,
    hypotheses: base.hypotheses,
  };
}

/**
 * Précompte immobilier : impôt régional annuel assis sur le RC indexé, avec des
 * additionnels provinciaux et communaux très variables. Nestor propose une
 * estimation mais doit permettre la saisie du montant réel de l'avertissement-extrait
 * de rôle — c'est le seul chiffre juste.
 */
export function estimerPrecompteImmobilier(
  input: {
    revenuCadastralCents: number;
    /** Taux global (régional + additionnels), en pourcentage. Très variable. */
    tauxGlobalPourcent: number;
    quotePartPourcent?: number;
  },
  params: TaxParamSet,
): CalcResult<{ precompteAnnuelCents: number; rcIndexeCents: number }> {
  const pCoeff = getParam(params, 'rc.coefficient_indexation');
  const coefficient = getValue(params, 'rc.coefficient_indexation');
  const rcIndexeCents = Math.round(Math.max(0, input.revenuCadastralCents) * coefficient);
  const quotePart = (input.quotePartPourcent ?? 100) / 100;
  const precompteAnnuelCents = Math.round(
    rcIndexeCents * (input.tauxGlobalPourcent / 100) * quotePart,
  );

  return {
    result: { precompteAnnuelCents, rcIndexeCents },
    breakdown: [
      { libelle: 'Revenu cadastral', valeur: input.revenuCadastralCents, unite: 'eur' },
      { libelle: 'RC indexé', valeur: rcIndexeCents, unite: 'eur' },
      {
        libelle: 'Taux global appliqué',
        valeur: input.tauxGlobalPourcent,
        unite: 'pourcent',
        precision: 'Taux régional augmenté des additionnels provinciaux et communaux',
      },
      { libelle: 'Précompte immobilier estimé', valeur: precompteAnnuelCents, unite: 'eur', total: true },
    ],
    sources: [toSource(pCoeff)],
    hypotheses: [
      'Estimation seulement : les additionnels provinciaux et communaux varient fortement.',
      'Saisis le montant de ton avertissement-extrait de rôle pour un suivi exact.',
    ],
  };
}
