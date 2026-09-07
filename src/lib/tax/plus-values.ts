import { formatEUR, formatTaux } from '../money';
import { calculerTOB, type SupportTOB } from './tob';
import {
  getCents,
  getParam,
  getRate,
  mergeSources,
  toSource,
  type CalcResult,
  type SourceRef,
  type TaxParamSet,
} from './types';

/**
 * Taxe sur les plus-values sur actifs financiers, en vigueur depuis 2026 (doc 06 § 1),
 * et calcul de l'**impôt latent** (doc 07 § 6).
 *
 * L'impôt latent est le différenciateur du produit : partout ailleurs, un patrimoine
 * s'affiche brut. Nestor affiche aussi ce qu'il resterait après liquidation.
 */

/** Date pivot du régime : seule la plus-value construite après compte. */
export const DATE_REFERENCE_PLUS_VALUES = '2025-12-31';

/**
 * Base de référence d'une position, au sens du régime de 2026.
 *
 * Pour un actif détenu avant l'entrée en vigueur, le point de départ n'est pas le
 * prix d'achat mais la **valeur au 31/12/2025** : la plus-value antérieure échappe
 * à la taxe. Confondre les deux surestime massivement l'impôt.
 */
export function baseDeReference(position: {
  prixAcquisitionCents?: number | null;
  valeurReference2025Cents?: number | null;
  dateAcquisition?: string | null;
}): { baseCents: number | null; origine: 'valeur_2025' | 'prix_acquisition' | 'inconnue' } {
  const acquisAvant2026 =
    position.dateAcquisition != null && position.dateAcquisition <= DATE_REFERENCE_PLUS_VALUES;

  if (acquisAvant2026 || position.prixAcquisitionCents == null) {
    if (position.valeurReference2025Cents != null) {
      return { baseCents: position.valeurReference2025Cents, origine: 'valeur_2025' };
    }
  }
  if (position.prixAcquisitionCents != null) {
    return { baseCents: position.prixAcquisitionCents, origine: 'prix_acquisition' };
  }
  return { baseCents: null, origine: 'inconnue' };
}

export type TaxePlusValuesInput = {
  /** Plus-value réalisée sur l'opération ou la période, en centimes. */
  plusValueCents: number;
  /** Part de l'exonération annuelle déjà consommée, en centimes. */
  exonerationDejaUtiliseeCents?: number;
  /**
   * Exonération non utilisée les années précédentes et reportée sur celle-ci,
   * en centimes. La loi la plafonne ; le calculateur applique le plafond.
   * Zéro par défaut : c'est l'hypothèse la plus défavorable, jamais la plus
   * flatteuse.
   */
  exonerationReporteeCents?: number;
};

export type TaxePlusValuesResult = {
  taxeCents: number;
  exonereCents: number;
  taxableCents: number;
  exonerationRestanteCents: number;
  /** Part du report effectivement retenue, après plafonnement. */
  reportRetenuCents: number;
};

export function calculerTaxePlusValues(
  input: TaxePlusValuesInput,
  params: TaxParamSet,
): CalcResult<TaxePlusValuesResult> {
  const plusValue = Math.max(0, input.plusValueCents);
  const dejaUtilisee = Math.max(0, input.exonerationDejaUtiliseeCents ?? 0);
  const reportee = Math.max(0, input.exonerationReporteeCents ?? 0);

  const pTaux = getParam(params, 'plus_values.taux');
  const pExo = getParam(params, 'plus_values.exoneration_annuelle');
  const pReportPlafond = getParam(params, 'plus_values.report_plafond');
  const taux = getRate(params, 'plus_values.taux');
  const plafondExoCents = getCents(params, 'plus_values.exoneration_annuelle');
  const plafondReportCents = getCents(params, 'plus_values.report_plafond');

  // L'exonération non consommée les années précédentes se reporte, dans la
  // limite d'un plafond cumulé (art. 96/2 CIR 92). On ne la devine pas : elle
  // arrive en entrée, et vaut zéro tant que rien ne la documente.
  const reportRetenuCents = Math.min(reportee, plafondReportCents);
  const disponible = Math.max(0, plafondExoCents + reportRetenuCents - dejaUtilisee);
  const exonereCents = Math.min(plusValue, disponible);
  const taxableCents = plusValue - exonereCents;
  const taxeCents = Math.round(taxableCents * taux);

  return {
    result: {
      taxeCents,
      exonereCents,
      taxableCents,
      exonerationRestanteCents: Math.max(0, disponible - exonereCents),
      reportRetenuCents,
    },
    breakdown: [
      { libelle: 'Plus-value réalisée', valeur: plusValue, unite: 'eur' },
      ...(reportRetenuCents > 0
        ? [
            {
              libelle: 'Exonération reportée des années précédentes',
              valeur: reportRetenuCents,
              unite: 'eur' as const,
              precision:
                reportee > plafondReportCents
                  ? `Plafonnée à ${formatEUR(plafondReportCents)} de report cumulé`
                  : 'Part non consommée les années précédentes, à justifier dans la déclaration',
            },
          ]
        : []),
      {
        libelle: 'Exonération appliquée',
        valeur: exonereCents,
        unite: 'eur',
        precision: `Exonération de ${formatEUR(plafondExoCents)} par personne et par an${reportRetenuCents > 0 ? `, majorée de ${formatEUR(reportRetenuCents)} de report` : ''}, dont ${formatEUR(dejaUtilisee)} déjà consommés`,
      },
      { libelle: 'Base taxable', valeur: taxableCents, unite: 'eur' },
      {
        libelle: 'Taxe sur les plus-values',
        valeur: taxeCents,
        unite: 'eur',
        precision: `${formatEUR(taxableCents)} × ${formatTaux(pTaux.valeur)}`,
        total: true,
      },
    ],
    sources: [toSource(pTaux), toSource(pExo), toSource(pReportPlafond)],
    hypotheses: [
      `Seule la plus-value construite à partir du ${DATE_REFERENCE_PLUS_VALUES} entre dans la base.`,
      "La compensation des moins-values et le report de pertes ne sont pas modélisés : modalités à confirmer auprès du SPF Finances.",
      "L'exonération s'apprécie par personne, tous actifs financiers confondus. Sa part non utilisée une année se reporte sur les suivantes, dans la limite d'un plafond cumulé — ce calcul suppose un report nul tant que tu ne l'as pas renseigné.",
      "Rien n'est automatique : le précompte est retenu à la source au taux plein, et l'exonération comme son report se réclament dans la déclaration, pièces justificatives à l'appui.",
    ],
  };
}

export type PositionLatente = {
  id: string;
  nom: string;
  /** Valeur de marché actuelle de la position, en centimes. */
  valeurActuelleCents: number;
  prixAcquisitionCents?: number | null;
  valeurReference2025Cents?: number | null;
  dateAcquisition?: string | null;
  /** Support TOB, pour estimer le coût de sortie. `null` = pas de TOB (crypto, immobilier). */
  supportTOB?: SupportTOB | null;
};

export type LigneImpotLatent = {
  id: string;
  nom: string;
  valeurActuelleCents: number;
  baseReferenceCents: number | null;
  origineBase: 'valeur_2025' | 'prix_acquisition' | 'inconnue';
  plusValueLatenteCents: number;
  tobSortieCents: number;
};

export type ImpotLatentResult = {
  /** Total de l'impôt qui serait dû en cas de liquidation complète aujourd'hui. */
  impotLatentCents: number;
  /** Détail : taxe sur les plus-values seule. */
  taxePlusValuesCents: number;
  /** Détail : TOB estimée à la sortie. */
  tobSortieCents: number;
  plusValueLatenteTotaleCents: number;
  exonerationRestanteCents: number;
  valeurBruteCents: number;
  /** Valeur nette d'impôt latent — le KPI du dashboard. */
  valeurNetteCents: number;
  lignes: LigneImpotLatent[];
  /** Positions dont la base de référence est inconnue : le calcul les ignore. */
  positionsSansBase: string[];
};

/**
 * Impôt latent sur un portefeuille (doc 07 § 6).
 *
 * ```
 * impôt_latent = Σ max(0, valeur_actuelle − base_de_référence) × taux_plus_values
 *              + TOB estimée à la vente
 * ```
 * L'exonération annuelle restante est déduite du total, pas position par position.
 */
export function calculerImpotLatent(
  input: {
    positions: readonly PositionLatente[];
    exonerationDejaUtiliseeCents?: number;
  },
  params: TaxParamSet,
): CalcResult<ImpotLatentResult> {
  const lignes: LigneImpotLatent[] = [];
  const positionsSansBase: string[] = [];
  const sourcesTOB: SourceRef[][] = [];

  let plusValueLatenteTotale = 0;
  let tobSortieTotale = 0;
  let valeurBrute = 0;

  for (const position of input.positions) {
    valeurBrute += position.valeurActuelleCents;
    const { baseCents, origine } = baseDeReference(position);

    let tobSortieCents = 0;
    if (position.supportTOB) {
      const tob = calculerTOB(
        { montantCents: position.valeurActuelleCents, support: position.supportTOB },
        params,
      );
      tobSortieCents = tob.result;
      sourcesTOB.push(tob.sources);
      tobSortieTotale += tobSortieCents;
    }

    if (baseCents == null) {
      positionsSansBase.push(position.nom);
      lignes.push({
        id: position.id,
        nom: position.nom,
        valeurActuelleCents: position.valeurActuelleCents,
        baseReferenceCents: null,
        origineBase: origine,
        plusValueLatenteCents: 0,
        tobSortieCents,
      });
      continue;
    }

    const plusValue = Math.max(0, position.valeurActuelleCents - baseCents);
    plusValueLatenteTotale += plusValue;

    lignes.push({
      id: position.id,
      nom: position.nom,
      valeurActuelleCents: position.valeurActuelleCents,
      baseReferenceCents: baseCents,
      origineBase: origine,
      plusValueLatenteCents: plusValue,
      tobSortieCents,
    });
  }

  const taxe = calculerTaxePlusValues(
    {
      plusValueCents: plusValueLatenteTotale,
      exonerationDejaUtiliseeCents: input.exonerationDejaUtiliseeCents,
    },
    params,
  );

  const impotLatentCents = taxe.result.taxeCents + tobSortieTotale;

  const breakdown = [
    { libelle: 'Valeur brute du portefeuille', valeur: valeurBrute, unite: 'eur' as const },
    {
      libelle: 'Plus-value latente totale',
      valeur: plusValueLatenteTotale,
      unite: 'eur' as const,
      precision: 'Somme des gains non réalisés, par rapport à la base de référence de chaque position',
    },
    {
      libelle: 'Exonération annuelle restante',
      valeur: taxe.result.exonereCents,
      unite: 'eur' as const,
    },
    { libelle: 'Taxe sur les plus-values', valeur: taxe.result.taxeCents, unite: 'eur' as const },
    {
      libelle: 'TOB estimée à la vente',
      valeur: tobSortieTotale,
      unite: 'eur' as const,
      precision: 'La sortie est elle aussi taxée, on l’intègre',
    },
    { libelle: 'Impôt latent total', valeur: impotLatentCents, unite: 'eur' as const, total: true },
    {
      libelle: 'Patrimoine net d’impôt latent',
      valeur: valeurBrute - impotLatentCents,
      unite: 'eur' as const,
      total: true,
    },
  ];

  const hypotheses = [
    'Simulation d’une liquidation intégrale au prix du jour : dans les faits, on ne vend pas tout d’un coup.',
    ...taxe.hypotheses,
  ];
  if (positionsSansBase.length > 0) {
    hypotheses.push(
      `${positionsSansBase.length} position(s) sans base de référence connue sont exclues du calcul de plus-value : ${positionsSansBase.join(', ')}. Renseigne le prix d’acquisition ou la valeur au ${DATE_REFERENCE_PLUS_VALUES}.`,
    );
  }

  return {
    result: {
      impotLatentCents,
      taxePlusValuesCents: taxe.result.taxeCents,
      tobSortieCents: tobSortieTotale,
      plusValueLatenteTotaleCents: plusValueLatenteTotale,
      exonerationRestanteCents: taxe.result.exonerationRestanteCents,
      valeurBruteCents: valeurBrute,
      valeurNetteCents: valeurBrute - impotLatentCents,
      lignes,
      positionsSansBase,
    },
    breakdown,
    sources: mergeSources(taxe.sources, ...sourcesTOB),
    hypotheses,
  };
}

/**
 * Taxe Reynders : prélèvement sur la composante d'intérêts lors de la vente
 * d'un fonds dont la part obligataire dépasse le seuil légal.
 */
export function calculerTaxeReynders(
  input: {
    /** Part obligataire du fonds, en pourcentage (12.5 pour 12,5 %). */
    partObligatoirePourcent: number;
    /** Plus-value réalisée sur le fonds, en centimes. */
    plusValueCents: number;
  },
  params: TaxParamSet,
): CalcResult<{ taxeCents: number; applicable: boolean; composanteInteretsCents: number }> {
  const pSeuil = getParam(params, 'reynders.seuil_part_obligataire');
  const pTaux = getParam(params, 'reynders.taux');
  const seuil = pSeuil.valeur;
  const taux = getRate(params, 'reynders.taux');

  const applicable = input.partObligatoirePourcent > seuil;
  const plusValue = Math.max(0, input.plusValueCents);
  // La composante taxable est la part de la plus-value imputable aux obligations.
  const composanteInteretsCents = applicable
    ? Math.round(plusValue * (input.partObligatoirePourcent / 100))
    : 0;
  const taxeCents = Math.round(composanteInteretsCents * taux);

  return {
    result: { taxeCents, applicable, composanteInteretsCents },
    breakdown: [
      {
        libelle: 'Part obligataire du fonds',
        valeur: input.partObligatoirePourcent,
        unite: 'pourcent',
        precision: `Seuil de déclenchement : ${formatTaux(seuil, 0)}`,
      },
      {
        libelle: applicable ? 'Taxe Reynders applicable' : 'Taxe Reynders non applicable',
        valeur: applicable ? 1 : 0,
        unite: 'texte',
      },
      { libelle: 'Composante intérêts', valeur: composanteInteretsCents, unite: 'eur' },
      { libelle: 'Taxe due', valeur: taxeCents, unite: 'eur', total: true },
    ],
    sources: [toSource(pSeuil), toSource(pTaux)],
    hypotheses: [
      'La composante d’intérêts est estimée au prorata de la part obligataire déclarée du fonds. Le calcul officiel se fonde sur les données publiées par la société de gestion.',
    ],
  };
}
