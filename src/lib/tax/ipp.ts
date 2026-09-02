import { formatEUR, formatPercent, formatTaux } from '../money';
import {
  appliquerBaremeProgressif,
  getBareme,
  getCents,
  getParam,
  mergeSources,
  tauxMarginal as calculerTauxMarginal,
  toSource,
  type CalcResult,
  type LigneBareme,
  type TaxParamSet,
} from './types';

/**
 * Impôt des personnes physiques (doc 06 § 3).
 *
 * Ce qui compte pour Nestor, ce n'est pas le montant de l'impôt — l'utilisateur le
 * reçoit par courrier — mais le **taux marginal** : tout euro de revenu complémentaire
 * (activité d'indépendant, loyer professionnel) est taxé à ce taux-là, pas au taux moyen.
 * C'est le chiffre qui change les décisions, donc il est affiché en permanence.
 */

export type IPPInput = {
  /** Revenu net imposable annuel, en centimes. */
  revenuImposableCents: number;
  /**
   * Additionnels communaux en pourcentage. Très variables d'une commune à l'autre ;
   * à défaut, la moyenne nationale du paramètre fiscal est utilisée.
   */
  additionnelsCommunauxPourcent?: number;
  /** Appliquer la quotité exemptée. Défaut `true`. */
  appliquerQuotiteExemptee?: boolean;
};

export type IPPResult = {
  /** Impôt de base issu du barème progressif, avant quotité exemptée. */
  impotBaremeCents: number;
  /** Réduction au titre de la quotité de revenu exemptée. */
  reductionQuotiteCents: number;
  /** Impôt fédéral après quotité exemptée. */
  impotFederalCents: number;
  /** Additionnels communaux. */
  impotCommunalCents: number;
  /** Total dû. */
  totalCents: number;
  /** Revenu net après impôt. */
  netCents: number;
  /** Taux moyen d'imposition, en ratio. */
  tauxMoyen: number;
  /**
   * Taux marginal, en ratio, additionnels communaux inclus.
   * C'est le taux qui frappera l'euro suivant.
   */
  tauxMarginal: number;
  /** Taux marginal fédéral seul, sans les additionnels. */
  tauxMarginalFederal: number;
  detailTranches: LigneBareme[];
};

export function calculerIPP(input: IPPInput, params: TaxParamSet): CalcResult<IPPResult> {
  const revenu = Math.max(0, input.revenuImposableCents);
  const appliquerQuotite = input.appliquerQuotiteExemptee ?? true;

  const { tranches, sources: sourcesBareme } = getBareme(params, 'ipp');
  const pQuotite = getParam(params, 'ipp.quotite_exemptee');
  const pAdditionnels = getParam(params, 'ipp.additionnels_communaux_moyen');

  const quotiteCents = getCents(params, 'ipp.quotite_exemptee');
  const additionnelsPourcent =
    input.additionnelsCommunauxPourcent ?? getParam(params, 'ipp.additionnels_communaux_moyen').valeur;
  const additionnels = additionnelsPourcent / 100;

  const { impotCents: impotBaremeCents, detail } = appliquerBaremeProgressif(revenu, tranches);

  // La quotité exemptée est convertie en réduction d'impôt, valorisée au taux de
  // la première tranche du barème — c'est la mécanique belge.
  const tauxPremiereTranche = tranches[0]?.taux ?? 0;
  const reductionQuotiteCents = appliquerQuotite
    ? Math.min(impotBaremeCents, Math.round(Math.min(quotiteCents, revenu) * tauxPremiereTranche))
    : 0;

  const impotFederalCents = Math.max(0, impotBaremeCents - reductionQuotiteCents);
  const impotCommunalCents = Math.round(impotFederalCents * additionnels);
  const totalCents = impotFederalCents + impotCommunalCents;

  const tauxMarginalFederal = calculerTauxMarginal(revenu, tranches);
  const tauxMarginalTotal = tauxMarginalFederal * (1 + additionnels);
  const tauxMoyen = revenu > 0 ? totalCents / revenu : 0;

  return {
    result: {
      impotBaremeCents,
      reductionQuotiteCents,
      impotFederalCents,
      impotCommunalCents,
      totalCents,
      netCents: revenu - totalCents,
      tauxMoyen,
      tauxMarginal: tauxMarginalTotal,
      tauxMarginalFederal,
      detailTranches: detail,
    },
    breakdown: [
      { libelle: 'Revenu net imposable', valeur: revenu, unite: 'eur' },
      ...detail.map((ligne) => ({
        libelle: `Tranche à ${formatTaux(ligne.taux * 100, 0)}`,
        valeur: ligne.impotCents,
        unite: 'eur' as const,
        precision: `De ${formatEUR(ligne.deCents, { decimals: 0 })} à ${
          Number.isFinite(ligne.aCents) ? formatEUR(ligne.aCents, { decimals: 0 }) : 'au-delà'
        }`,
      })),
      { libelle: 'Impôt selon le barème', valeur: impotBaremeCents, unite: 'eur' },
      {
        libelle: 'Réduction pour quotité exemptée',
        valeur: -reductionQuotiteCents,
        unite: 'eur',
        precision: `Quotité de ${formatEUR(quotiteCents, { decimals: 0 })} valorisée au taux de la première tranche`,
      },
      { libelle: 'Impôt fédéral', valeur: impotFederalCents, unite: 'eur' },
      {
        libelle: 'Additionnels communaux',
        valeur: impotCommunalCents,
        unite: 'eur',
        precision: `${formatTaux(additionnelsPourcent, 1)} de l'impôt fédéral`,
      },
      { libelle: 'Impôt total', valeur: totalCents, unite: 'eur', total: true },
      {
        libelle: 'Taux marginal',
        valeur: tauxMarginalTotal * 100,
        unite: 'pourcent',
        precision: `C'est le taux qui frappera ton prochain euro de revenu. Taux moyen : ${formatPercent(tauxMoyen)}`,
        total: true,
      },
    ],
    sources: mergeSources(sourcesBareme, [toSource(pQuotite), toSource(pAdditionnels)]),
    hypotheses: [
      'Calcul simplifié : ni charge de famille, ni revenus exonérés, ni réductions d’impôt particulières.',
      'Les additionnels communaux varient fortement d’une commune à l’autre — saisis le taux de la tienne pour un résultat exact.',
      'Le résultat est une estimation destinée à situer un ordre de grandeur, pas un calcul de déclaration.',
    ],
  };
}

/**
 * Impôt marginal sur un revenu complémentaire, à revenu principal donné.
 * Répond à : « si je gagne 5 000 € de plus cette année, il m'en reste combien ? »
 */
export function calculerImpotRevenuComplementaire(
  input: {
    revenuPrincipalCents: number;
    revenuComplementaireCents: number;
    additionnelsCommunauxPourcent?: number;
  },
  params: TaxParamSet,
): CalcResult<{
  impotSupplementaireCents: number;
  netRestantCents: number;
  tauxEffectif: number;
}> {
  const sans = calculerIPP(
    {
      revenuImposableCents: input.revenuPrincipalCents,
      additionnelsCommunauxPourcent: input.additionnelsCommunauxPourcent,
    },
    params,
  );
  const avec = calculerIPP(
    {
      revenuImposableCents: input.revenuPrincipalCents + input.revenuComplementaireCents,
      additionnelsCommunauxPourcent: input.additionnelsCommunauxPourcent,
    },
    params,
  );

  const impotSupplementaireCents = avec.result.totalCents - sans.result.totalCents;
  const complementaire = Math.max(0, input.revenuComplementaireCents);
  const netRestantCents = complementaire - impotSupplementaireCents;
  const tauxEffectif = complementaire > 0 ? impotSupplementaireCents / complementaire : 0;

  return {
    result: { impotSupplementaireCents, netRestantCents, tauxEffectif },
    breakdown: [
      { libelle: 'Revenu principal', valeur: input.revenuPrincipalCents, unite: 'eur' },
      { libelle: 'Revenu complémentaire brut', valeur: complementaire, unite: 'eur' },
      { libelle: 'Impôt sans le complément', valeur: sans.result.totalCents, unite: 'eur' },
      { libelle: 'Impôt avec le complément', valeur: avec.result.totalCents, unite: 'eur' },
      {
        libelle: 'Impôt supplémentaire',
        valeur: impotSupplementaireCents,
        unite: 'eur',
        precision: `Soit ${formatPercent(tauxEffectif)} du revenu complémentaire`,
      },
      { libelle: 'Il te reste', valeur: netRestantCents, unite: 'eur', total: true },
    ],
    sources: avec.sources,
    hypotheses: avec.hypotheses,
  };
}

/** Taux marginal seul, sans calculer tout l'impôt. Utilisé par le module immobilier. */
export function tauxMarginalIPP(
  revenuImposableCents: number,
  params: TaxParamSet,
  additionnelsCommunauxPourcent?: number,
): number {
  const { tranches } = getBareme(params, 'ipp');
  const additionnels =
    (additionnelsCommunauxPourcent ?? getParam(params, 'ipp.additionnels_communaux_moyen').valeur) /
    100;
  return calculerTauxMarginal(Math.max(0, revenuImposableCents), tranches) * (1 + additionnels);
}
