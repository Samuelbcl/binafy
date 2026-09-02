import { formatEUR, formatPercent } from '../money';
import { calculerTaxePlusValues } from '../tax/plus-values';
import type { CalcResult, TaxParamSet } from '../tax/types';

/**
 * Intérêts composés (doc 07 § 1).
 *
 * ```
 * V = C₀ × (1+r)ⁿ + M × [((1+r)ⁿ − 1) / r] × (1+r)
 * ```
 * avec `r` le taux périodique, `n` le nombre de périodes, `M` le versement en
 * début de période.
 *
 * Un calculateur d'intérêts composés brut, tout le monde en a un. Le différenciateur,
 * c'est la version nette de fiscalité belge.
 */

export type Periodicite = 'mensuelle' | 'trimestrielle' | 'annuelle';

export const PERIODES_PAR_AN: Record<Periodicite, number> = {
  mensuelle: 12,
  trimestrielle: 4,
  annuelle: 1,
};

export type InteretsComposesInput = {
  /** Capital initial, en centimes. */
  capitalInitialCents: number;
  /** Versement récurrent, en centimes. */
  versementCents: number;
  periodicite?: Periodicite;
  /** Durée en années. */
  horizonAnnees: number;
  /** Taux de rendement annuel, en pourcentage (5 pour 5 %). */
  tauxAnnuelPourcent: number;
  /** Inflation annuelle en pourcentage, pour la courbe en euros constants. */
  inflationPourcent?: number;
};

export type PointAnnuel = {
  annee: number;
  /** Cumul des sommes réellement versées. */
  verseCents: number;
  /** Plus-values accumulées. */
  plusValuesCents: number;
  /** Valeur totale nominale. */
  valeurCents: number;
  /** Valeur en euros d'aujourd'hui. */
  valeurReelleCents: number;
};

export type InteretsComposesResult = {
  valeurFinaleCents: number;
  totalVerseCents: number;
  plusValuesCents: number;
  valeurFinaleReelleCents: number;
  /** Multiple du capital investi. */
  multiple: number;
  courbe: PointAnnuel[];
};

/**
 * Valeur future d'une série de versements en début de période.
 * Traite le cas `r = 0` séparément : la formule générale y divise par zéro.
 */
function valeurFutureVersements(versement: number, tauxPeriodique: number, periodes: number): number {
  if (periodes <= 0) return 0;
  if (tauxPeriodique === 0) return versement * periodes;
  return (
    versement * ((Math.pow(1 + tauxPeriodique, periodes) - 1) / tauxPeriodique) * (1 + tauxPeriodique)
  );
}

export function calculerInteretsComposes(
  input: InteretsComposesInput,
): CalcResult<InteretsComposesResult> {
  const capitalInitial = Math.max(0, input.capitalInitialCents);
  const versement = Math.max(0, input.versementCents);
  const periodicite = input.periodicite ?? 'mensuelle';
  const parAn = PERIODES_PAR_AN[periodicite];
  const horizon = Math.max(0, Math.floor(input.horizonAnnees));
  const tauxAnnuel = input.tauxAnnuelPourcent / 100;
  const inflation = (input.inflationPourcent ?? 0) / 100;

  // Taux périodique équivalent : (1+r)^(1/p) − 1, pas r/p. La différence est
  // visible sur 20 ans et fausserait la comparaison avec un rendement annualisé.
  const tauxPeriodique = parAn === 1 ? tauxAnnuel : Math.pow(1 + tauxAnnuel, 1 / parAn) - 1;

  const courbe: PointAnnuel[] = [];

  for (let annee = 0; annee <= horizon; annee++) {
    const periodes = annee * parAn;
    const valeur =
      capitalInitial * Math.pow(1 + tauxPeriodique, periodes) +
      valeurFutureVersements(versement, tauxPeriodique, periodes);
    const verse = capitalInitial + versement * periodes;
    const valeurReelle = inflation > 0 ? valeur / Math.pow(1 + inflation, annee) : valeur;

    courbe.push({
      annee,
      verseCents: Math.round(verse),
      plusValuesCents: Math.round(valeur - verse),
      valeurCents: Math.round(valeur),
      valeurReelleCents: Math.round(valeurReelle),
    });
  }

  const dernier = courbe[courbe.length - 1];
  const valeurFinaleCents = dernier?.valeurCents ?? capitalInitial;
  const totalVerseCents = dernier?.verseCents ?? capitalInitial;
  const plusValuesCents = valeurFinaleCents - totalVerseCents;

  return {
    result: {
      valeurFinaleCents,
      totalVerseCents,
      plusValuesCents,
      valeurFinaleReelleCents: dernier?.valeurReelleCents ?? capitalInitial,
      multiple: totalVerseCents > 0 ? valeurFinaleCents / totalVerseCents : 0,
      courbe,
    },
    breakdown: [
      { libelle: 'Capital initial', valeur: capitalInitial, unite: 'eur' },
      {
        libelle: 'Versements',
        valeur: versement,
        unite: 'eur',
        precision: `${periodicite}, pendant ${horizon} an${horizon > 1 ? 's' : ''}`,
      },
      { libelle: 'Total versé sur la période', valeur: totalVerseCents, unite: 'eur' },
      {
        libelle: 'Plus-values',
        valeur: plusValuesCents,
        unite: 'eur',
        precision: `Rendement annuel de ${formatPercent(tauxAnnuel)}`,
      },
      { libelle: 'Valeur finale', valeur: valeurFinaleCents, unite: 'eur', total: true },
      ...(inflation > 0
        ? [
            {
              libelle: 'Valeur finale en euros d’aujourd’hui',
              valeur: dernier?.valeurReelleCents ?? 0,
              unite: 'eur' as const,
              precision: `Corrigée d'une inflation de ${formatPercent(inflation)} par an`,
              total: true,
            },
          ]
        : []),
    ],
    sources: [],
    hypotheses: [
      'Rendement supposé constant sur toute la période — dans la réalité il varie fortement d’une année à l’autre.',
      'Les versements sont supposés effectués en début de période.',
      'Les frais de courtage et de gestion ne sont pas déduits.',
    ],
  };
}

export type InteretsComposesNetsResult = InteretsComposesResult & {
  /** Taxe sur les plus-values due si tout est vendu à l'échéance. */
  taxePlusValuesCents: number;
  valeurFinaleNetteCents: number;
  valeurFinaleNetteReelleCents: number;
};

/**
 * Même calcul, mais net de fiscalité belge à la sortie.
 *
 * C'est le différenciateur du calculateur (doc 07 § 1) : on montre ce qui reste
 * réellement après la taxe sur les plus-values, exonération annuelle déduite.
 */
export function calculerInteretsComposesNets(
  input: InteretsComposesInput & { exonerationDejaUtiliseeCents?: number },
  params: TaxParamSet,
): CalcResult<InteretsComposesNetsResult> {
  const brut = calculerInteretsComposes(input);
  const taxe = calculerTaxePlusValues(
    {
      plusValueCents: brut.result.plusValuesCents,
      exonerationDejaUtiliseeCents: input.exonerationDejaUtiliseeCents,
    },
    params,
  );

  const valeurFinaleNetteCents = brut.result.valeurFinaleCents - taxe.result.taxeCents;
  const inflation = (input.inflationPourcent ?? 0) / 100;
  const horizon = Math.max(0, Math.floor(input.horizonAnnees));
  const valeurFinaleNetteReelleCents =
    inflation > 0
      ? Math.round(valeurFinaleNetteCents / Math.pow(1 + inflation, horizon))
      : valeurFinaleNetteCents;

  return {
    result: {
      ...brut.result,
      taxePlusValuesCents: taxe.result.taxeCents,
      valeurFinaleNetteCents,
      valeurFinaleNetteReelleCents,
    },
    breakdown: [
      ...brut.breakdown.filter((l) => !l.total),
      { libelle: 'Valeur finale brute', valeur: brut.result.valeurFinaleCents, unite: 'eur' },
      {
        libelle: 'Exonération annuelle appliquée',
        valeur: taxe.result.exonereCents,
        unite: 'eur',
      },
      {
        libelle: 'Taxe sur les plus-values',
        valeur: -taxe.result.taxeCents,
        unite: 'eur',
        precision: `Sur ${formatEUR(taxe.result.taxableCents)} de plus-value taxable`,
      },
      {
        libelle: 'Valeur finale nette d’impôt',
        valeur: valeurFinaleNetteCents,
        unite: 'eur',
        total: true,
      },
    ],
    sources: taxe.sources,
    hypotheses: [
      ...brut.hypotheses,
      ...taxe.hypotheses,
      'La taxe est calculée comme si tout était vendu la même année : étaler les ventes permet d’utiliser l’exonération plusieurs fois.',
    ],
  };
}
