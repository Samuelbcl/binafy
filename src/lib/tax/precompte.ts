import { formatEUR, formatTaux } from '../money';
import {
  type BreakdownLine,
  getCents,
  getParam,
  getRate,
  mergeSources,
  toSource,
  type CalcResult,
  type TaxParamSet,
} from './types';

/**
 * Précompte mobilier (doc 06 § 1).
 *
 * Deux mécaniques distinctes qu'il ne faut pas mélanger :
 *  - le précompte **retenu à la source** par un intermédiaire belge, libératoire ;
 *  - le précompte **dû mais non retenu** chez un courtier étranger, que le
 *    contribuable doit déclarer lui-même. C'est la source d'erreur la plus
 *    fréquente chez les jeunes investisseurs belges, donc une alerte à forte
 *    valeur dans Nestor.
 */

export type DividendesInput = {
  /** Dividendes bruts perçus sur l'année, en centimes. */
  dividendesBrutsCents: number;
  /** Précompte effectivement retenu à la source, en centimes. */
  precompteRetenuCents?: number;
  /** Part de l'exonération annuelle déjà consommée par ailleurs, en centimes. */
  exonerationDejaUtiliseeCents?: number;
};

export type DividendesResult = {
  /** Précompte théoriquement dû sur la totalité des dividendes. */
  precompteDuCents: number;
  /** Montant récupérable via la déclaration au titre de l'exonération. */
  recuperableCents: number;
  /** Précompte non retenu à la source, donc à déclarer et payer soi-même. */
  aDeclarerCents: number;
  /** Solde de l'exonération annuelle encore disponible. */
  exonerationRestanteCents: number;
  /** Dividendes nets une fois tout réglé. */
  netCents: number;
};

/**
 * Précompte sur dividendes, et surtout : ce que l'utilisateur peut récupérer.
 *
 * L'exonération d'une première tranche de dividendes n'est **jamais** appliquée
 * automatiquement : elle se réclame dans la déclaration fiscale. Beaucoup ne la
 * demandent jamais. C'est le calcul qui rend l'alerte Nestor concrète.
 */
export function calculerPrecompteDividendes(
  input: DividendesInput,
  params: TaxParamSet,
): CalcResult<DividendesResult> {
  const brut = Math.max(0, input.dividendesBrutsCents);
  const retenu = Math.max(0, input.precompteRetenuCents ?? 0);
  const dejaUtilisee = Math.max(0, input.exonerationDejaUtiliseeCents ?? 0);

  const pTaux = getParam(params, 'precompte_mobilier.taux');
  const pExo = getParam(params, 'precompte_mobilier.exoneration_dividendes');
  const taux = getRate(params, 'precompte_mobilier.taux');
  const plafondExoCents = getCents(params, 'precompte_mobilier.exoneration_dividendes');

  const exonerationDisponible = Math.max(0, plafondExoCents - dejaUtilisee);
  /** L'exonération porte sur le *dividende*, pas sur le précompte. */
  const dividendeExonere = Math.min(brut, exonerationDisponible);
  const dividendeTaxable = brut - dividendeExonere;

  const precompteDuCents = Math.round(dividendeTaxable * taux);
  const precompteTheoriqueSansExo = Math.round(brut * taux);

  // Ce qui a été retenu en trop par rapport à ce qui est réellement dû.
  const recuperableCents = Math.max(0, Math.min(retenu, precompteTheoriqueSansExo) - precompteDuCents);
  // Ce qui est dû mais n'a pas été retenu (typiquement : courtier étranger).
  const aDeclarerCents = Math.max(0, precompteDuCents - retenu);

  const netCents = brut - retenu - aDeclarerCents + recuperableCents;

  const breakdown: BreakdownLine[] = [
    { libelle: 'Dividendes bruts perçus', valeur: brut, unite: 'eur' as const },
    {
      libelle: 'Tranche exonérée appliquée',
      valeur: dividendeExonere,
      unite: 'eur' as const,
      precision:
        exonerationDisponible > 0
          ? `Exonération annuelle de ${formatEUR(plafondExoCents)} par personne, à réclamer dans la déclaration`
          : 'Exonération annuelle déjà entièrement consommée',
    },
    { libelle: 'Dividendes taxables', valeur: dividendeTaxable, unite: 'eur' as const },
    {
      libelle: 'Précompte mobilier dû',
      valeur: precompteDuCents,
      unite: 'eur' as const,
      precision: `${formatEUR(dividendeTaxable)} × ${formatTaux(pTaux.valeur)}`,
    },
    { libelle: 'Précompte retenu à la source', valeur: retenu, unite: 'eur' as const },
  ];

  if (recuperableCents > 0) {
    breakdown.push({
      libelle: 'Récupérable via la déclaration',
      valeur: recuperableCents,
      unite: 'eur' as const,
      precision: 'Montant retenu au-delà de ce qui est réellement dû, grâce à l’exonération',
    });
  }
  if (aDeclarerCents > 0) {
    breakdown.push({
      libelle: 'À déclarer et payer soi-même',
      valeur: aDeclarerCents,
      unite: 'eur' as const,
      precision: 'Précompte dû mais non retenu — typique d’un courtier étranger',
    });
  }

  breakdown.push({
    libelle: 'Dividendes nets',
    valeur: netCents,
    unite: 'eur' as const,
    total: true,
  });

  return {
    result: {
      precompteDuCents,
      recuperableCents,
      aDeclarerCents,
      exonerationRestanteCents: Math.max(0, exonerationDisponible - dividendeExonere),
      netCents,
    },
    breakdown,
    sources: [toSource(pTaux), toSource(pExo)],
    hypotheses: [
      "Ce calcul vise les dividendes d'actions et de fonds detenus en tant que particulier, au taux standard. Les dividendes de ta propre societe — VVPRbis, reserve de liquidation — suivent d'autres taux, non modelises ici.",
      "L'exonération de la première tranche de dividendes n'est pas appliquée automatiquement : elle se réclame dans la déclaration fiscale.",
      "Chez un courtier étranger, le précompte n'est pas retenu à la source : les revenus sont à déclarer soi-même.",
    ],
  };
}

export type EpargneReglementeeInput = {
  /** Intérêts au taux de base perçus sur l'année, en centimes. */
  interetsBaseCents: number;
  /** Prime de fidélité acquise sur l'année, en centimes. */
  primeFideliteCents?: number;
  /** Part de l'exonération annuelle déjà consommée sur un autre compte. */
  exonerationDejaUtiliseeCents?: number;
};

export type EpargneReglementeeResult = {
  interetsTotauxCents: number;
  exonereCents: number;
  taxableCents: number;
  precompteCents: number;
  netCents: number;
  exonerationRestanteCents: number;
};

/**
 * Compte d'épargne réglementé : exonération jusqu'à un plafond annuel,
 * puis précompte réduit (distinct du taux standard) sur l'excédent.
 */
export function calculerPrecompteEpargneReglementee(
  input: EpargneReglementeeInput,
  params: TaxParamSet,
): CalcResult<EpargneReglementeeResult> {
  const base = Math.max(0, input.interetsBaseCents);
  const prime = Math.max(0, input.primeFideliteCents ?? 0);
  const dejaUtilisee = Math.max(0, input.exonerationDejaUtiliseeCents ?? 0);
  const total = base + prime;

  const pPlafond = getParam(params, 'epargne_reglementee.exoneration_interets');
  const pTaux = getParam(params, 'epargne_reglementee.taux_precompte_reduit');
  const plafondCents = getCents(params, 'epargne_reglementee.exoneration_interets');
  const taux = getRate(params, 'epargne_reglementee.taux_precompte_reduit');

  const disponible = Math.max(0, plafondCents - dejaUtilisee);
  const exonereCents = Math.min(total, disponible);
  const taxableCents = total - exonereCents;
  const precompteCents = Math.round(taxableCents * taux);

  return {
    result: {
      interetsTotauxCents: total,
      exonereCents,
      taxableCents,
      precompteCents,
      netCents: total - precompteCents,
      exonerationRestanteCents: Math.max(0, disponible - exonereCents),
    },
    breakdown: [
      { libelle: 'Intérêts au taux de base', valeur: base, unite: 'eur' },
      {
        libelle: 'Prime de fidélité',
        valeur: prime,
        unite: 'eur',
        precision: 'Acquise après 12 mois de présence continue des fonds',
      },
      { libelle: 'Intérêts totaux', valeur: total, unite: 'eur' },
      {
        libelle: 'Part exonérée',
        valeur: exonereCents,
        unite: 'eur',
        precision: `Plafond annuel de ${formatEUR(plafondCents)} par contribuable`,
      },
      { libelle: 'Part taxable', valeur: taxableCents, unite: 'eur' },
      {
        libelle: 'Précompte réduit',
        valeur: precompteCents,
        unite: 'eur',
        precision: `${formatEUR(taxableCents)} × ${formatTaux(pTaux.valeur)}`,
      },
      { libelle: 'Intérêts nets', valeur: total - precompteCents, unite: 'eur', total: true },
    ],
    sources: [toSource(pPlafond), toSource(pTaux)],
    hypotheses: [
      'La prime de fidélité n’est acquise qu’après 12 mois de présence continue des fonds : un retrait la fait perdre.',
      'Le plafond d’exonération s’apprécie par contribuable, tous comptes réglementés confondus.',
    ],
  };
}

/** Précompte standard de 30 % sur des intérêts non réglementés (obligations, comptes à terme). */
export function calculerPrecompteInterets(
  input: { interetsCents: number; precompteRetenuCents?: number },
  params: TaxParamSet,
): CalcResult<{ precompteDuCents: number; aDeclarerCents: number; netCents: number }> {
  const brut = Math.max(0, input.interetsCents);
  const retenu = Math.max(0, input.precompteRetenuCents ?? 0);

  const pTaux = getParam(params, 'precompte_mobilier.taux');
  const taux = getRate(params, 'precompte_mobilier.taux');
  const precompteDuCents = Math.round(brut * taux);
  const aDeclarerCents = Math.max(0, precompteDuCents - retenu);

  return {
    result: { precompteDuCents, aDeclarerCents, netCents: brut - precompteDuCents },
    breakdown: [
      { libelle: 'Intérêts bruts', valeur: brut, unite: 'eur' },
      {
        libelle: 'Précompte mobilier',
        valeur: precompteDuCents,
        unite: 'eur',
        precision: `${formatEUR(brut)} × ${formatTaux(pTaux.valeur)}`,
      },
      { libelle: 'Intérêts nets', valeur: brut - precompteDuCents, unite: 'eur', total: true },
    ],
    sources: mergeSources([toSource(pTaux)]),
    hypotheses: [
      'Les intérêts d’un compte d’épargne réglementé suivent un régime distinct, plus favorable.',
    ],
  };
}
