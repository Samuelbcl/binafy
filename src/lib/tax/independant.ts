import { formatEUR, formatPercent, formatTaux } from '../money';
import { calculerImpotRevenuComplementaire } from './ipp';
import {
  appliquerBaremeProgressif,
  getBareme,
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
 * Statut d'indépendant belge (doc 06 § 4).
 *
 * C'est le module qui manque totalement chez les concurrents français et qui vise
 * exactement la cible « jeune entrepreneur belge » : un salarié qui démarre une
 * activité complémentaire et qui n'a aucune idée de ce qu'il lui restera.
 */

export type StatutIndependant = 'complementaire' | 'principal';

/**
 * Caisses d'assurances sociales agréées.
 *
 * Le choix n'est pas neutre : les frais de gestion vont de 3,05 % à 4,25 %,
 * soit un tiers d'écart sur cette ligne. Les taux vivent dans `tax_parameters`
 * comme le reste, sous la clé `independant.frais_gestion.<caisse>`.
 */
export type Caisse =
  | 'acerta'
  | 'xerius'
  | 'liantis'
  | 'securex'
  | 'group_s'
  | 'partena'
  | 'ucm'
  | 'cnasti';

export const CAISSES: readonly Caisse[] = [
  'acerta',
  'xerius',
  'liantis',
  'securex',
  'group_s',
  'partena',
  'ucm',
  'cnasti',
];

export const LIBELLE_CAISSE: Record<Caisse, string> = {
  acerta: 'Acerta',
  xerius: 'Xerius',
  liantis: 'Liantis',
  securex: 'Securex',
  group_s: 'Group S',
  partena: 'Partena Professional',
  ucm: 'UCM',
  cnasti: 'Caisse nationale auxiliaire',
};

export type CotisationsInput = {
  /** Revenu net imposable de l'activité (CA moins charges), en centimes. */
  revenuNetImposableCents: number;
  statut: StatutIndependant;
  /** Caisse d'affiliation. À défaut, la médiane du marché est retenue. */
  caisse?: Caisse;
};

export type CotisationsResult = {
  cotisationsCents: number;
  fraisGestionCents: number;
  totalCents: number;
  /** Vrai si le revenu reste sous le seuil d'exemption du statut complémentaire. */
  sousLeSeuil: boolean;
  seuilCents: number;
  /**
   * Vrai quand le titre principal cotise sur le revenu plancher légal plutôt
   * que sur son revenu réel, inférieur. C'est ce qui produit la « cotisation
   * minimale » des tableaux de caisse.
   */
  plancherApplique: boolean;
  /** Ce qu'il reste avant de franchir le seuil. */
  margeAvantSeuilCents: number;
};

/**
 * Cotisations sociales d'indépendant.
 *
 * En complémentaire, aucune cotisation n'est due sous un seuil annuel de revenu net.
 * Franchir ce seuil déclenche les cotisations sur **la totalité** du revenu, pas
 * seulement sur le dépassement : d'où l'alerte Nestor quand on s'en approche.
 */
export function calculerCotisationsSociales(
  input: CotisationsInput,
  params: TaxParamSet,
): CalcResult<CotisationsResult> {
  const revenu = Math.max(0, input.revenuNetImposableCents);

  const pSeuil = getParam(params, 'independant.seuil_cotisations_complementaire');
  // Le taux dépend de la caisse choisie ; sans choix, on prend la médiane.
  const cleFrais = input.caisse
    ? `independant.frais_gestion.${input.caisse}`
    : 'independant.frais_gestion_caisse';
  const pFrais = getParam(params, cleFrais);

  const seuilCents = getCents(params, 'independant.seuil_cotisations_complementaire');
  const tauxFrais = getRate(params, cleFrais);

  // Barème dégressif : 20,5 % sur la première tranche, 14,16 % sur la
  // deuxième, plus rien au-delà. Longtemps simplifié en taux plat — juste pour
  // un complémentaire ordinaire, faux dès qu'on dépasse la première tranche.
  const bareme = getBareme(params, 'independant');

  const sousLeSeuil = input.statut === 'complementaire' && revenu < seuilCents;

  // Le titre principal cotise au moins sur un revenu plancher, même si son
  // revenu réel est inférieur : c'est la « cotisation minimale » des tableaux
  // de caisse. Le complémentaire n'a pas ce plancher — il est dispensé sous son
  // seuil, puis cotise strictement au prorata (INASTI, vérifié le 07/09/2026).
  const pPlancher =
    input.statut === 'principal' ? getParam(params, 'independant.revenu_plancher_principal') : null;
  const plancherCents = pPlancher ? Math.round(pPlancher.valeur * 100) : 0;
  const assietteCents = sousLeSeuil ? 0 : Math.max(revenu, plancherCents);
  const plancherApplique = assietteCents > revenu;

  const { impotCents: cotisationsCents, detail } = appliquerBaremeProgressif(
    assietteCents,
    bareme.tranches,
  );
  const fraisGestionCents = sousLeSeuil ? 0 : Math.round(cotisationsCents * tauxFrais);
  const totalCents = cotisationsCents + fraisGestionCents;

  const breakdown: BreakdownLine[] = [
    { libelle: 'Revenu net imposable de l’activité', valeur: revenu, unite: 'eur' as const },
  ];

  if (input.statut === 'complementaire') {
    breakdown.push({
      libelle: sousLeSeuil ? 'Sous le seuil d’exemption' : 'Seuil d’exemption dépassé',
      valeur: seuilCents,
      unite: 'eur' as const,
      precision: sousLeSeuil
        ? `Aucune cotisation n'est due tant que le revenu net reste sous ${formatEUR(seuilCents)}`
        : `Au-delà de ${formatEUR(seuilCents)}, les cotisations sont dues sur la totalité du revenu, pas sur le seul dépassement`,
    });
  }

  if (!sousLeSeuil) {
    breakdown.push(
      ...(plancherApplique
        ? [
            {
              libelle: 'Revenu plancher du titre principal',
              valeur: assietteCents,
              unite: 'eur' as const,
              precision: `Le titre principal cotise au moins sur ${formatEUR(plancherCents)}, même si son revenu réel est inférieur`,
            },
          ]
        : []),
      // Une ligne par tranche touchée : c'est là qu'on voit que le taux baisse
      // avec le revenu, et qu'il tombe à zéro au-delà du plafond.
      ...detail.map((ligne) =>
        ligne.taux === 0
          ? {
              libelle: `Au-delà de ${formatEUR(ligne.deCents)}`,
              valeur: 0,
              unite: 'eur' as const,
              precision: 'Plus aucune cotisation n’est due sur cette part du revenu',
            }
          : {
              libelle: `Cotisations — tranche à ${formatTaux(ligne.taux * 100, 2)}`,
              valeur: ligne.impotCents,
              unite: 'eur' as const,
              precision: Number.isFinite(ligne.aCents)
                ? `Sur la part de ${formatEUR(ligne.deCents)} à ${formatEUR(ligne.aCents)}`
                : `Sur la part au-delà de ${formatEUR(ligne.deCents)}`,
            },
      ),
      {
        libelle: input.caisse
          ? `Frais de gestion — ${LIBELLE_CAISSE[input.caisse]}`
          : 'Frais de gestion de la caisse',
        valeur: fraisGestionCents,
        unite: 'eur' as const,
        precision: input.caisse
          ? `${formatTaux(pFrais.valeur, 2)} des cotisations`
          : `${formatTaux(pFrais.valeur, 2)} des cotisations — médiane du marché, les caisses vont de 3,05 % à 4,25 %`,
      },
    );
  }

  breakdown.push({
    libelle: 'Total cotisations',
    valeur: totalCents,
    unite: 'eur' as const,
    total: true,
  });

  return {
    result: {
      cotisationsCents,
      fraisGestionCents,
      totalCents,
      sousLeSeuil,
      seuilCents,
      plancherApplique,
      margeAvantSeuilCents: Math.max(0, seuilCents - revenu),
    },
    breakdown,
    sources: mergeSources(
      bareme.sources,
      [toSource(pSeuil), toSource(pFrais)],
      pPlancher ? [toSource(pPlancher)] : [],
    ),
    hypotheses: [
      'Les cotisations sont provisoires la première année puis régularisées sur le revenu réel, avec deux à trois ans de décalage.',
      'Le barème des cotisations, le seuil du complémentaire et le revenu plancher du principal sont légaux et indexés chaque année ; les frais de gestion, eux, sont un tarif commercial propre à chaque caisse.',
      "L'affiliation à une caisse d'assurances sociales est obligatoire avant le début de l'activité.",
    ],
  };
}

export type SimulationIndependantInput = {
  /** Chiffre d'affaires annuel hors TVA, en centimes. */
  chiffreAffairesCents: number;
  /** Charges professionnelles déductibles, en centimes. */
  chargesCents?: number;
  statut: StatutIndependant;
  /** Revenu imposable du salariat, pour déterminer le taux marginal. */
  revenuSalarieCents: number;
  additionnelsCommunauxPourcent?: number;
  caisse?: Caisse;
};

export type SimulationIndependantResult = {
  chiffreAffairesCents: number;
  chargesCents: number;
  revenuNetImposableCents: number;
  cotisationsCents: number;
  /** Base imposable après déduction des cotisations (elles sont déductibles). */
  baseImposableCents: number;
  impotCents: number;
  /** Ce qu'il reste réellement en poche. */
  netEnPocheCents: number;
  /** Part du chiffre d'affaires qui finit en poche. */
  tauxConservation: number;
  /** Provision d'impôt et cotisations à mettre de côté chaque mois. */
  provisionMensuelleCents: number;
  franchiseTVA: {
    applicable: boolean;
    seuilCents: number;
    margeCents: number;
    depassementProche: boolean;
  };
};

/**
 * Simulation complète d'une activité d'indépendant complémentaire.
 *
 * Répond à la seule question qui compte pour la cible : « je facture X, il me reste
 * combien ? » La réponse surprend presque toujours, parce que les revenus s'ajoutent
 * au salaire et sont donc taxés au taux marginal, souvent 45-50 %.
 */
export function simulerIndependant(
  input: SimulationIndependantInput,
  params: TaxParamSet,
): CalcResult<SimulationIndependantResult> {
  const ca = Math.max(0, input.chiffreAffairesCents);
  const charges = Math.max(0, input.chargesCents ?? 0);
  const revenuNetImposableCents = Math.max(0, ca - charges);

  const cotisations = calculerCotisationsSociales(
    { revenuNetImposableCents, statut: input.statut, caisse: input.caisse },
    params,
  );

  // Les cotisations sociales sont déductibles du revenu imposable.
  const baseImposableCents = Math.max(0, revenuNetImposableCents - cotisations.result.totalCents);

  const impot = calculerImpotRevenuComplementaire(
    {
      revenuPrincipalCents: input.revenuSalarieCents,
      revenuComplementaireCents: baseImposableCents,
      additionnelsCommunauxPourcent: input.additionnelsCommunauxPourcent,
    },
    params,
  );

  const netEnPocheCents = baseImposableCents - impot.result.impotSupplementaireCents;
  const aProvisionner = cotisations.result.totalCents + impot.result.impotSupplementaireCents;

  const pSeuilTVA = getParam(params, 'tva.seuil_franchise');
  const seuilTVACents = getCents(params, 'tva.seuil_franchise');
  const margeCents = seuilTVACents - ca;

  return {
    result: {
      chiffreAffairesCents: ca,
      chargesCents: charges,
      revenuNetImposableCents,
      cotisationsCents: cotisations.result.totalCents,
      baseImposableCents,
      impotCents: impot.result.impotSupplementaireCents,
      netEnPocheCents,
      tauxConservation: ca > 0 ? netEnPocheCents / ca : 0,
      provisionMensuelleCents: Math.round(aProvisionner / 12),
      franchiseTVA: {
        applicable: ca <= seuilTVACents,
        seuilCents: seuilTVACents,
        margeCents,
        // On alerte dès 80 % du seuil : il faut du temps pour s'organiser.
        depassementProche: ca > seuilTVACents * 0.8,
      },
    },
    breakdown: [
      { libelle: 'Chiffre d’affaires hors TVA', valeur: ca, unite: 'eur' },
      { libelle: 'Charges professionnelles', valeur: -charges, unite: 'eur' },
      { libelle: 'Revenu net imposable', valeur: revenuNetImposableCents, unite: 'eur' },
      {
        libelle: 'Cotisations sociales',
        valeur: -cotisations.result.totalCents,
        unite: 'eur',
        precision: cotisations.result.sousLeSeuil
          ? `Revenu sous le seuil de ${formatEUR(cotisations.result.seuilCents)} — aucune cotisation due`
          : `Barème dégressif — ${formatTaux(getParam(params, 'independant.tranche_1.taux').valeur, 1)} sur la première tranche —, frais de gestion compris`,
      },
      { libelle: 'Base imposable', valeur: baseImposableCents, unite: 'eur' },
      {
        libelle: 'Impôt supplémentaire',
        valeur: -impot.result.impotSupplementaireCents,
        unite: 'eur',
        precision: `Ces revenus s'ajoutent à ton salaire et sont taxés à ${formatPercent(impot.result.tauxEffectif)}`,
      },
      { libelle: 'Net en poche', valeur: netEnPocheCents, unite: 'eur', total: true },
      {
        libelle: 'À provisionner par mois',
        valeur: Math.round(aProvisionner / 12),
        unite: 'eur',
        precision: 'Cotisations et impôt à mettre de côté dès maintenant : ils arrivent avec un décalage',
        total: true,
      },
    ],
    sources: mergeSources(cotisations.sources, impot.sources, [toSource(pSeuilTVA)]),
    hypotheses: [
      ...cotisations.hypotheses,
      'Le revenu d’indépendant s’ajoute au salaire : il est taxé au taux marginal, pas au taux moyen.',
      'La franchise TVA sous le seuil dispense de facturer la TVA, mais interdit aussi de la déduire.',
      'Facturation électronique structurée obligatoire entre assujettis à la TVA depuis le 01/01/2026.',
    ],
  };
}

/** Coûts fixes de démarrage d'une activité d'indépendant. */
export function calculerCoutDemarrage(
  input: { avecTVA: boolean },
  params: TaxParamSet,
): CalcResult<{ totalCents: number }> {
  const pBce = getParam(params, 'independant.cout_bce');
  const bceCents = getCents(params, 'independant.cout_bce');
  const pTva = getParam(params, 'independant.cout_activation_tva');
  const tvaCents = input.avecTVA ? getCents(params, 'independant.cout_activation_tva') : 0;
  const totalCents = bceCents + tvaCents;

  const breakdown: BreakdownLine[] = [
    {
      libelle: 'Inscription à la BCE',
      valeur: bceCents,
      unite: 'eur' as const,
      precision: 'Via un guichet d’entreprises agréé',
    },
  ];
  if (input.avecTVA) {
    breakdown.push({
      libelle: 'Activation du numéro de TVA',
      valeur: tvaCents,
      unite: 'eur' as const,
      precision: 'TVAC',
    });
  }
  breakdown.push({
    libelle: 'Coût de démarrage',
    valeur: totalCents,
    unite: 'eur' as const,
    total: true,
  });

  return {
    result: { totalCents },
    breakdown,
    sources: mergeSources([toSource(pBce)], input.avecTVA ? [toSource(pTva)] : []),
    hypotheses: [
      "L'affiliation à une caisse d'assurances sociales est elle-même gratuite.",
      'Sous le régime de la franchise TVA, l’activation d’un numéro de TVA reste nécessaire mais aucune déclaration périodique n’est due.',
    ],
  };
}
