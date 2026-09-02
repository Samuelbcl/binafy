import { formatEUR, formatPercent } from '../money';
import type { CalcResult } from '../tax/types';

/**
 * Taux d'épargne (doc 07 § 5).
 *
 * ```
 * taux_epargne = (revenus − dépenses) / revenus
 * ```
 *
 * Deux modes obligatoires, et le second n'est pas un confort : en Belgique, le
 * pécule de vacances et la prime de fin d'année créent deux mois aberrants. Un taux
 * d'épargne mensuel brut n'a aucun sens en mai ou en décembre — d'où la vue lissée
 * sur 12 mois, qui est la seule comparable d'une période à l'autre.
 */

export type MoisBudget = {
  /** Mois au format `AAAA-MM`. */
  mois: string;
  revenusCents: number;
  depensesCents: number;
  /** Part dirigée vers des actifs de rendement. Sous-ensemble de ce qui n'est pas dépensé. */
  investiCents: number;
};

export type TauxEpargneResult = {
  revenusCents: number;
  depensesCents: number;
  /** Ce qui n'est pas dépensé : épargné plus investi. */
  nonDepenseCents: number;
  investiCents: number;
  /** Reste sur un compte, sans être investi. */
  epargneLiquideCents: number;
  tauxEpargne: number;
  tauxInvestissement: number;
  /** Nombre de mois pris en compte. */
  moisComptes: number;
};

function agreger(mois: readonly MoisBudget[]): {
  revenus: number;
  depenses: number;
  investi: number;
} {
  let revenus = 0;
  let depenses = 0;
  let investi = 0;
  for (const m of mois) {
    revenus += Math.max(0, m.revenusCents);
    depenses += Math.max(0, m.depensesCents);
    investi += Math.max(0, m.investiCents);
  }
  return { revenus, depenses, investi };
}

function construireResultat(mois: readonly MoisBudget[]): TauxEpargneResult {
  const { revenus, depenses, investi } = agreger(mois);
  const nonDepense = revenus - depenses;
  return {
    revenusCents: revenus,
    depensesCents: depenses,
    nonDepenseCents: nonDepense,
    investiCents: investi,
    epargneLiquideCents: nonDepense - investi,
    tauxEpargne: revenus > 0 ? nonDepense / revenus : 0,
    tauxInvestissement: revenus > 0 ? investi / revenus : 0,
    moisComptes: mois.length,
  };
}

/** Taux d'épargne d'une période donnée, telle quelle. */
export function calculerTauxEpargne(mois: readonly MoisBudget[]): CalcResult<TauxEpargneResult> {
  const r = construireResultat(mois);

  return {
    result: r,
    breakdown: [
      { libelle: 'Revenus', valeur: r.revenusCents, unite: 'eur' },
      { libelle: 'Dépenses', valeur: -r.depensesCents, unite: 'eur' },
      {
        libelle: 'Investi',
        valeur: r.investiCents,
        unite: 'eur',
        precision: 'Dirigé vers des actifs de rendement',
      },
      {
        libelle: 'Épargné sans être investi',
        valeur: r.epargneLiquideCents,
        unite: 'eur',
        precision: 'Reste disponible sur un compte',
      },
      {
        libelle: 'Taux d’épargne',
        valeur: r.tauxEpargne * 100,
        unite: 'pourcent',
        precision: `${formatEUR(r.nonDepenseCents)} non dépensés sur ${formatEUR(r.revenusCents)} de revenus`,
        total: true,
      },
    ],
    sources: [],
    hypotheses: [
      'Les transferts entre tes propres comptes ne sont ni des revenus ni des dépenses : ils doivent être exclus du calcul.',
    ],
  };
}

export type TauxEpargneCompareResult = {
  /** Le mois demandé, brut. */
  mensuel: TauxEpargneResult;
  /** Les 12 derniers mois, la seule vue comparable. */
  lisse12Mois: TauxEpargneResult;
  /** Écart entre les deux taux, en points. */
  ecartPoints: number;
  /** Vrai si le mois est atypique — pécule de vacances, prime de fin d'année. */
  moisAtypique: boolean;
};

/**
 * Compare le taux d'épargne du dernier mois et le taux lissé sur 12 mois.
 *
 * Un mois s'écarte de plus de 40 % de la moyenne des revenus est signalé comme
 * atypique : c'est presque toujours le pécule de vacances ou la prime de fin d'année.
 */
export function calculerTauxEpargneCompare(
  historique: readonly MoisBudget[],
): CalcResult<TauxEpargneCompareResult> {
  if (historique.length === 0) {
    const vide = construireResultat([]);
    return {
      result: { mensuel: vide, lisse12Mois: vide, ecartPoints: 0, moisAtypique: false },
      breakdown: [],
      sources: [],
      hypotheses: ['Aucune donnée sur la période.'],
    };
  }

  const tries = [...historique].sort((a, b) => a.mois.localeCompare(b.mois));
  const dernier = tries[tries.length - 1];
  const douzeDerniers = tries.slice(-12);

  const mensuel = construireResultat(dernier ? [dernier] : []);
  const lisse12Mois = construireResultat(douzeDerniers);

  const revenuMoyen =
    douzeDerniers.length > 0 ? lisse12Mois.revenusCents / douzeDerniers.length : 0;
  const moisAtypique =
    revenuMoyen > 0 && Math.abs(mensuel.revenusCents - revenuMoyen) / revenuMoyen > 0.4;

  const ecartPoints = (mensuel.tauxEpargne - lisse12Mois.tauxEpargne) * 100;

  return {
    result: { mensuel, lisse12Mois, ecartPoints, moisAtypique },
    breakdown: [
      {
        libelle: `Taux d'épargne du mois (${dernier?.mois ?? '—'})`,
        valeur: mensuel.tauxEpargne * 100,
        unite: 'pourcent',
      },
      {
        libelle: `Taux d'épargne lissé sur ${douzeDerniers.length} mois`,
        valeur: lisse12Mois.tauxEpargne * 100,
        unite: 'pourcent',
        precision: 'La seule vue comparable d’une période à l’autre',
        total: true,
      },
      {
        libelle: 'Écart',
        valeur: ecartPoints,
        unite: 'pourcent',
        precision: moisAtypique
          ? 'Ce mois est atypique — probablement le pécule de vacances ou la prime de fin d’année. Fie-toi au taux lissé.'
          : 'Le mois est représentatif',
      },
    ],
    sources: [],
    hypotheses: [
      'En Belgique, le pécule de vacances et la prime de fin d’année rendent deux mois par an non représentatifs.',
      'Un mois dont les revenus s’écartent de plus de 40 % de la moyenne est signalé comme atypique.',
    ],
  };
}

/**
 * Cible d'épargne de précaution, calculée depuis les charges fixes constatées.
 * C'est la mécanique de l'objectif spécial « Épargne de précaution » (doc 02 § 5) :
 * la cible se calcule, elle ne se déclare pas.
 */
export function calculerEpargnePrecaution(input: {
  /** Charges fixes mensuelles détectées dans le budget, en centimes. */
  chargesFixesMensuellesCents: number;
  /** Nombre de mois de couverture souhaité, de 3 à 6. */
  moisDeCouverture: number;
  /** Épargne liquide déjà constituée, en centimes. */
  dejaEpargneCents?: number;
  /** Capacité d'épargne mensuelle constatée, en centimes. */
  capaciteEpargneMensuelleCents?: number;
}): CalcResult<{
  cibleCents: number;
  resteAConstituerCents: number;
  progression: number;
  moisRestants: number | null;
}> {
  const charges = Math.max(0, input.chargesFixesMensuellesCents);
  const mois = Math.max(1, input.moisDeCouverture);
  const deja = Math.max(0, input.dejaEpargneCents ?? 0);
  const capacite = Math.max(0, input.capaciteEpargneMensuelleCents ?? 0);

  const cibleCents = charges * mois;
  const resteAConstituerCents = Math.max(0, cibleCents - deja);
  const moisRestants =
    resteAConstituerCents === 0 ? 0 : capacite > 0 ? Math.ceil(resteAConstituerCents / capacite) : null;

  return {
    result: {
      cibleCents,
      resteAConstituerCents,
      progression: cibleCents > 0 ? Math.min(1, deja / cibleCents) : 0,
      moisRestants,
    },
    breakdown: [
      { libelle: 'Charges fixes mensuelles', valeur: charges, unite: 'eur' },
      { libelle: 'Mois de couverture souhaités', valeur: mois, unite: 'coefficient' },
      {
        libelle: 'Cible',
        valeur: cibleCents,
        unite: 'eur',
        precision: `${formatEUR(charges)} × ${mois} mois`,
        total: true,
      },
      { libelle: 'Déjà constitué', valeur: deja, unite: 'eur' },
      {
        libelle: 'Reste à constituer',
        valeur: resteAConstituerCents,
        unite: 'eur',
        precision:
          moisRestants === null
            ? 'Renseigne ta capacité d’épargne pour estimer une date'
            : moisRestants === 0
              ? 'Objectif atteint'
              : `Environ ${moisRestants} mois au rythme actuel`,
        total: true,
      },
      {
        libelle: 'Progression',
        valeur: cibleCents > 0 ? Math.min(1, deja / cibleCents) * 100 : 0,
        unite: 'pourcent',
        precision: formatPercent(cibleCents > 0 ? Math.min(1, deja / cibleCents) : 0),
      },
    ],
    sources: [],
    hypotheses: [
      'La cible se calcule sur les charges fixes constatées dans le budget, pas sur un montant déclaré.',
      'La date d’atteinte est projetée au rythme d’épargne réel des derniers mois, pas au rythme espéré.',
    ],
  };
}
