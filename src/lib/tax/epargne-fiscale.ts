import { formatEUR, formatTaux } from '../money';
import {
  getCents,
  getParam,
  getRate,
  mergeSources,
  toSource,
  type BreakdownLine,
  type CalcResult,
  type TaxParamSet,
} from './types';

/**
 * Enveloppes d'épargne fiscale belges (doc 06 § 5).
 *
 * Deux dispositifs distincts que tout le monde confond :
 *
 *  - **L'épargne-pension** a son propre plafond, avec un choix entre deux
 *    niveaux dont l'un n'est pas toujours le meilleur — c'est le piège.
 *  - **L'épargne à long terme** partage un « panier fiscal » avec les
 *    réductions liées au crédit hypothécaire : ce que le crédit consomme,
 *    l'épargne ne peut plus l'utiliser.
 *
 * Nestor chiffre les deux options et laisse décider. Recommander un montant
 * serait du conseil en investissement (doc 01 § cadre réglementaire).
 */

export type EpargnePensionInput = {
  /** Montant que la personne envisage de verser sur l'année, en centimes. */
  versementCents: number;
};

export type EpargnePensionResult = {
  versementRetenuCents: number;
  /** Plafond effectivement appliqué. */
  plafondAppliqueCents: number;
  tauxReduction: number;
  reductionCents: number;
  /** Le versement dépasse le plafond haut : l'excédent ne donne aucun avantage. */
  excedentCents: number;
  /** Ce que donnerait chacun des deux plafonds, pour comparaison. */
  comparaison: {
    plafondBas: { versementCents: number; reductionCents: number };
    plafondHaut: { versementCents: number; reductionCents: number };
  };
};

/**
 * Épargne-pension.
 *
 * Deux plafonds coexistent, avec deux taux de réduction différents. Le plafond
 * haut n'est pas mécaniquement meilleur : verser 1 350 € à 25 % rapporte moins
 * qu'un montant plus faible à 30 % jusqu'à un certain point. On expose les deux
 * calculs plutôt que d'en désigner un.
 */
export function calculerEpargnePension(
  input: EpargnePensionInput,
  params: TaxParamSet,
): CalcResult<EpargnePensionResult> {
  const versement = Math.max(0, input.versementCents);

  const pPlafondBas = getParam(params, 'epargne_pension.plafond_bas');
  const pTauxBas = getParam(params, 'epargne_pension.reduction_bas');
  const pPlafondHaut = getParam(params, 'epargne_pension.plafond_haut');
  const pTauxHaut = getParam(params, 'epargne_pension.reduction_haut');

  const plafondBasCents = getCents(params, 'epargne_pension.plafond_bas');
  const tauxBas = getRate(params, 'epargne_pension.reduction_bas');
  const plafondHautCents = getCents(params, 'epargne_pension.plafond_haut');
  const tauxHaut = getRate(params, 'epargne_pension.reduction_haut');

  // Le régime dépend du montant versé : jusqu'au plafond bas, le taux avantageux
  // s'applique ; au-delà, c'est le taux réduit qui frappe la totalité.
  const dansLePlafondBas = versement <= plafondBasCents;
  const plafondAppliqueCents = dansLePlafondBas ? plafondBasCents : plafondHautCents;
  const tauxReduction = dansLePlafondBas ? tauxBas : tauxHaut;

  const versementRetenuCents = Math.min(versement, plafondAppliqueCents);
  const reductionCents = Math.round(versementRetenuCents * tauxReduction);
  const excedentCents = Math.max(0, versement - plafondHautCents);

  const comparaison = {
    plafondBas: {
      versementCents: plafondBasCents,
      reductionCents: Math.round(plafondBasCents * tauxBas),
    },
    plafondHaut: {
      versementCents: plafondHautCents,
      reductionCents: Math.round(plafondHautCents * tauxHaut),
    },
  };

  const breakdown: BreakdownLine[] = [
    { libelle: 'Versement envisagé', valeur: versement, unite: 'eur' },
    {
      libelle: 'Plafond applicable',
      valeur: plafondAppliqueCents,
      unite: 'eur',
      precision: dansLePlafondBas
        ? `Réduction de ${formatTaux(pTauxBas.valeur, 0)} jusqu'à ${formatEUR(plafondBasCents, { decimals: 0 })}`
        : `Au-delà de ${formatEUR(plafondBasCents, { decimals: 0 })}, la réduction tombe à ${formatTaux(pTauxHaut.valeur, 0)} sur la totalité`,
    },
    { libelle: 'Montant retenu', valeur: versementRetenuCents, unite: 'eur' },
    {
      libelle: 'Réduction d’impôt',
      valeur: reductionCents,
      unite: 'eur',
      precision: `${formatEUR(versementRetenuCents)} × ${formatTaux(tauxReduction * 100, 0)}`,
      total: true,
    },
  ];

  if (excedentCents > 0) {
    breakdown.push({
      libelle: 'Versement sans avantage fiscal',
      valeur: excedentCents,
      unite: 'eur',
      precision: 'Au-delà du plafond haut, plus aucune réduction n’est accordée',
    });
  }

  breakdown.push(
    {
      libelle: `Au plafond bas (${formatEUR(plafondBasCents, { decimals: 0 })})`,
      valeur: comparaison.plafondBas.reductionCents,
      unite: 'eur',
      precision: 'Réduction obtenue',
    },
    {
      libelle: `Au plafond haut (${formatEUR(plafondHautCents, { decimals: 0 })})`,
      valeur: comparaison.plafondHaut.reductionCents,
      unite: 'eur',
      precision: `Réduction obtenue, pour ${formatEUR(plafondHautCents - plafondBasCents, { decimals: 0 })} versés en plus`,
    },
  );

  return {
    result: {
      versementRetenuCents,
      plafondAppliqueCents,
      tauxReduction,
      reductionCents,
      excedentCents,
      comparaison,
    },
    breakdown,
    sources: mergeSources([
      toSource(pPlafondBas),
      toSource(pTauxBas),
      toSource(pPlafondHaut),
      toSource(pTauxHaut),
    ]),
    hypotheses: [
      'Le plafond haut n’est pas mécaniquement plus avantageux : au-delà du plafond bas, le taux réduit s’applique à la totalité du versement, pas au seul dépassement.',
      'Une taxe anticipative est prélevée à 60 ans sur le capital constitué.',
      'Nestor chiffre les deux options et n’en recommande aucune : le choix dépend de ta situation.',
    ],
  };
}

export type EpargneLongTermeInput = {
  /** Revenu net imposable annuel, en centimes. */
  revenuNetImposableCents: number;
  /** Versement envisagé, en centimes. */
  versementCents: number;
  /**
   * Part du panier fiscal déjà consommée par un crédit hypothécaire ou une
   * assurance solde restant dû, en centimes.
   *
   * En Wallonie, les crédits conclus depuis 2025 n'ouvrent plus droit à
   * réduction pour l'habitation propre, et à Bruxelles depuis 2017 : le panier
   * est alors entièrement disponible.
   */
  panierDejaConsommeCents?: number;
};

export type EpargneLongTermeResult = {
  /** Plafond issu du barème sur les revenus, avant plafond absolu. */
  plafondSelonRevenusCents: number;
  /** Plafond retenu : le plus petit des deux, moins ce que le crédit consomme. */
  plafondDisponibleCents: number;
  versementRetenuCents: number;
  reductionCents: number;
  /** Versement qui ne donne droit à rien. */
  excedentCents: number;
};

/**
 * Épargne à long terme.
 *
 * Le plafond se calcule sur les revenus nets imposables selon un barème
 * dégressif, puis est borné par un maximum absolu. Il est ensuite **partagé**
 * avec les réductions liées au crédit hypothécaire : c'est l'interaction que
 * doc 06 signale, et que la plupart des simulateurs ignorent.
 */
export function calculerEpargneLongTerme(
  input: EpargneLongTermeInput,
  params: TaxParamSet,
): CalcResult<EpargneLongTermeResult> {
  const revenu = Math.max(0, input.revenuNetImposableCents);
  const versement = Math.max(0, input.versementCents);
  const dejaConsomme = Math.max(0, input.panierDejaConsommeCents ?? 0);

  const pSeuil = getParam(params, 'epargne_long_terme.seuil_bareme');
  const pTauxBas = getParam(params, 'epargne_long_terme.taux_premiere_tranche');
  const pTauxHaut = getParam(params, 'epargne_long_terme.taux_tranche_superieure');
  const pPlafond = getParam(params, 'epargne_long_terme.plafond_absolu');
  const pReduction = getParam(params, 'epargne_long_terme.reduction');

  const seuilCents = getCents(params, 'epargne_long_terme.seuil_bareme');
  const tauxPremiere = getRate(params, 'epargne_long_terme.taux_premiere_tranche');
  const tauxSuperieure = getRate(params, 'epargne_long_terme.taux_tranche_superieure');
  const plafondAbsoluCents = getCents(params, 'epargne_long_terme.plafond_absolu');
  const tauxReduction = getRate(params, 'epargne_long_terme.reduction');

  // Barème dégressif : un taux élevé sur la première tranche de revenus, un
  // taux faible au-delà.
  const premiereTranche = Math.min(revenu, seuilCents);
  const trancheSuperieure = Math.max(0, revenu - seuilCents);
  const plafondSelonRevenusCents = Math.round(
    premiereTranche * tauxPremiere + trancheSuperieure * tauxSuperieure,
  );

  const plafondAvantPanier = Math.min(plafondSelonRevenusCents, plafondAbsoluCents);
  const plafondDisponibleCents = Math.max(0, plafondAvantPanier - dejaConsomme);

  const versementRetenuCents = Math.min(versement, plafondDisponibleCents);
  const reductionCents = Math.round(versementRetenuCents * tauxReduction);
  const excedentCents = Math.max(0, versement - plafondDisponibleCents);

  const breakdown: BreakdownLine[] = [
    { libelle: 'Revenu net imposable', valeur: revenu, unite: 'eur' },
    {
      libelle: 'Plafond selon tes revenus',
      valeur: plafondSelonRevenusCents,
      unite: 'eur',
      precision: `${formatTaux(pTauxBas.valeur, 0)} jusqu'à ${formatEUR(seuilCents, { decimals: 0 })}, puis ${formatTaux(pTauxHaut.valeur, 0)}`,
    },
    {
      libelle: 'Plafond absolu',
      valeur: plafondAbsoluCents,
      unite: 'eur',
      precision: 'Maximum légal, quel que soit le revenu',
    },
  ];

  if (dejaConsomme > 0) {
    breakdown.push({
      libelle: 'Déjà consommé par le crédit',
      valeur: -dejaConsomme,
      unite: 'eur',
      precision: 'Le panier fiscal est partagé avec les réductions du crédit hypothécaire',
    });
  }

  breakdown.push(
    {
      libelle: 'Plafond disponible',
      valeur: plafondDisponibleCents,
      unite: 'eur',
      total: true,
    },
    { libelle: 'Versement retenu', valeur: versementRetenuCents, unite: 'eur' },
    {
      libelle: 'Réduction d’impôt',
      valeur: reductionCents,
      unite: 'eur',
      precision: `${formatEUR(versementRetenuCents)} × ${formatTaux(pReduction.valeur, 0)}`,
      total: true,
    },
  );

  if (excedentCents > 0) {
    breakdown.push({
      libelle: 'Versement sans avantage fiscal',
      valeur: excedentCents,
      unite: 'eur',
      precision: 'Au-delà du plafond disponible, la réduction ne s’applique plus',
    });
  }

  return {
    result: {
      plafondSelonRevenusCents,
      plafondDisponibleCents,
      versementRetenuCents,
      reductionCents,
      excedentCents,
    },
    breakdown,
    sources: mergeSources([
      toSource(pSeuil),
      toSource(pTauxBas),
      toSource(pTauxHaut),
      toSource(pPlafond),
      toSource(pReduction),
    ]),
    hypotheses: [
      'Le plafond est partagé avec les réductions liées au crédit hypothécaire et à l’assurance solde restant dû : le crédit le consomme en priorité.',
      'En Wallonie, les crédits conclus depuis 2025 n’ouvrent plus droit à réduction pour l’habitation propre ; à Bruxelles, depuis 2017. Le panier est alors entièrement disponible.',
      'Le barème de calcul du plafond selon les revenus n’a pas été confirmé à une source officielle : il est signalé comme tel sous le résultat.',
      'Le capital est taxé à la sortie, à 60 ans.',
    ],
  };
}
