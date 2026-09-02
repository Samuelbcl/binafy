import { formatEUR, formatTaux } from '../money';
import {
  type BreakdownLine,
  getCents,
  getParam,
  getRate,
  toSource,
  type CalcResult,
  type TaxParamSet,
} from './types';

/**
 * Taxe sur les opérations de bourse (doc 06 § 1).
 *
 * Due à chaque achat **et** à chaque vente, avec un plafond par opération.
 * Le taux dépend du caractère capitalisant ou distribuant et du lieu
 * d'inscription du fonds — d'où les champs `capitalisant` et `isin` sur `assets`.
 */

export type SupportTOB = 'actions_etrangeres' | 'distribuant_belge' | 'capitalisant_belge';

export const LIBELLE_SUPPORT_TOB: Record<SupportTOB, string> = {
  actions_etrangeres: 'Actions et ETF cotés hors registre belge',
  distribuant_belge: 'Actions et ETF distribuants inscrits en Belgique',
  capitalisant_belge: 'Fonds capitalisants inscrits en Belgique',
};

/**
 * Détermine le support applicable à partir des attributs de l'actif.
 *
 * L'inscription « en Belgique » se lit sur la liste officielle des fonds inscrits
 * à la FSMA, pas sur l'ISIN : un ISIN luxembourgeois (LU…) peut parfaitement être
 * inscrit à la distribution en Belgique. On retient donc l'information explicite
 * quand on l'a, et on retombe sur le taux le plus bas sinon, en le signalant.
 */
export function determinerSupportTOB(actif: {
  inscritEnBelgique?: boolean | null;
  capitalisant?: boolean | null;
}): { support: SupportTOB; certain: boolean } {
  if (actif.inscritEnBelgique == null) {
    return { support: 'actions_etrangeres', certain: false };
  }
  if (!actif.inscritEnBelgique) return { support: 'actions_etrangeres', certain: true };
  return {
    support: actif.capitalisant ? 'capitalisant_belge' : 'distribuant_belge',
    certain: actif.capitalisant != null,
  };
}

export type TOBInput = {
  /** Montant de l'opération, en centimes. */
  montantCents: number;
  support: SupportTOB;
  /** Nombre d'opérations. Un aller-retour complet compte 2. */
  operations?: number;
};

/**
 * TOB due sur une opération : `min(montant × taux, plafond)`, par opération.
 * Le plafond s'applique **par opération**, jamais sur le cumul.
 */
export function calculerTOB(input: TOBInput, params: TaxParamSet): CalcResult<number> {
  const { montantCents, support, operations = 1 } = input;

  const pTaux = getParam(params, `tob.taux.${support}`);
  const pPlafond = getParam(params, `tob.plafond.${support}`);
  const taux = getRate(params, `tob.taux.${support}`);
  const plafondCents = getCents(params, `tob.plafond.${support}`);

  const base = Math.max(0, montantCents);
  const brute = Math.round(base * taux);
  const parOperation = Math.min(brute, plafondCents);
  const total = parOperation * Math.max(0, operations);

  const breakdown: BreakdownLine[] = [
    { libelle: 'Montant de l’opération', valeur: base, unite: 'eur' as const },
    {
      libelle: LIBELLE_SUPPORT_TOB[support],
      valeur: pTaux.valeur,
      unite: 'pourcent' as const,
      precision: `Taux applicable au support`,
    },
    {
      libelle: 'TOB calculée',
      valeur: brute,
      unite: 'eur' as const,
      precision: `${formatEUR(base)} × ${formatTaux(pTaux.valeur)}`,
    },
  ];

  if (brute > plafondCents) {
    breakdown.push({
      libelle: 'Plafond par opération appliqué',
      valeur: plafondCents,
      unite: 'eur' as const,
      precision: `La taxe est ramenée de ${formatEUR(brute)} à ${formatEUR(plafondCents)}`,
    });
  }

  if (operations !== 1) {
    breakdown.push({
      libelle: 'Nombre d’opérations',
      valeur: operations,
      unite: 'coefficient' as const,
      precision: 'La TOB est due à l’achat et à la vente',
    });
  }

  breakdown.push({ libelle: 'TOB totale', valeur: total, unite: 'eur' as const, total: true });

  return {
    result: total,
    breakdown,
    sources: [toSource(pTaux), toSource(pPlafond)],
    hypotheses: [
      'La TOB est due à chaque achat et à chaque vente : un aller-retour la fait payer deux fois.',
      'Chez un courtier étranger, la TOB n’est pas toujours retenue à la source : elle est alors à déclarer et payer soi-même.',
    ],
  };
}

/** TOB d'un aller-retour complet (achat puis revente au même montant). */
export function calculerTOBAllerRetour(
  input: { montantAchatCents: number; montantVenteCents: number; support: SupportTOB },
  params: TaxParamSet,
): CalcResult<number> {
  const achat = calculerTOB(
    { montantCents: input.montantAchatCents, support: input.support },
    params,
  );
  const vente = calculerTOB(
    { montantCents: input.montantVenteCents, support: input.support },
    params,
  );
  const total = achat.result + vente.result;

  return {
    result: total,
    breakdown: [
      { libelle: 'TOB à l’achat', valeur: achat.result, unite: 'eur' },
      { libelle: 'TOB à la vente', valeur: vente.result, unite: 'eur' },
      { libelle: 'TOB totale sur l’aller-retour', valeur: total, unite: 'eur', total: true },
    ],
    sources: achat.sources,
    hypotheses: achat.hypotheses,
  };
}
