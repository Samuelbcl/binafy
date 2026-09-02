import { formatEUR, formatPercent } from '../money';
import { getParam, type CalcResult, type TaxParamSet } from '../tax/types';

/**
 * Simulateur de patrimoine (doc 07 § 2).
 *
 * ```
 * Pour chaque année t :
 *   rendement_brut  = patrimoine_t × rendement_pondéré
 *   rendement_net   = rendement_brut × (1 − fiscalité_pondérée)
 *   patrimoine_t+1  = patrimoine_t + rendement_net + investissement_annuel
 *   patrimoine_réel = patrimoine_t+1 / (1 + inflation)^t
 * ```
 *
 * Les deux courbes, nominale et réelle, sont affichées ensemble : un patrimoine de
 * 500 000 € dans 20 ans avec 3 % d'inflation ne vaut pas 500 000 € d'aujourd'hui,
 * et c'est l'information la plus utile du simulateur.
 */

export type ProjectionInput = {
  /** Patrimoine actuel, en centimes. */
  patrimoineActuelCents: number;
  /** Part investie en actions, en pourcentage du patrimoine actuel. */
  partActionsPourcent: number;
  /** Investissement annuel, en centimes. */
  investissementAnnuelCents: number;
  /** Part de l'investissement annuel dirigée vers les actions, en pourcentage. */
  partInvestissementActionsPourcent?: number;
  /** Horizon en années. */
  horizonAnnees: number;
  /** Rendement annuel des actions, en pourcentage. */
  rendementActionsPourcent: number;
  /** Rendement annuel du reste, en pourcentage. */
  rendementAutresPourcent: number;
  /** Fiscalité sur le rendement actions, en pourcentage (10 % — plus-values). */
  fiscaliteActionsPourcent: number;
  /** Fiscalité sur le rendement du reste, en pourcentage (30 % — précompte). */
  fiscaliteAutresPourcent: number;
  /** Taux de retrait annuel à l'échéance, en pourcentage. */
  tauxRetraitPourcent: number;
  /** Inflation annuelle, en pourcentage. */
  inflationPourcent: number;
  /** Dépenses annuelles actuelles, en centimes. Sert à dater l'indépendance. */
  depensesAnnuellesCents?: number;
};

export type PointProjection = {
  annee: number;
  patrimoineCents: number;
  patrimoineReelCents: number;
  /** Cumul des sommes investies depuis le départ, capital initial compris. */
  investiCents: number;
  /** Cumul des rendements nets encaissés. */
  rendementsCumulesCents: number;
  /** Rente mensuelle que ce patrimoine soutiendrait, en euros d'aujourd'hui. */
  renteMensuelleReelleCents: number;
};

export type ProjectionResult = {
  patrimoineFinalCents: number;
  patrimoineFinalReelCents: number;
  totalInvestiCents: number;
  rendementsCumulesCents: number;
  /** Rente mensuelle soutenable en euros nominaux à l'échéance. */
  renteMensuelleCents: number;
  /** La même, en euros d'aujourd'hui. */
  renteMensuelleReelleCents: number;
  /**
   * Année où la rente soutenable couvre les dépenses actuelles — « l'âge
   * d'indépendance ». `null` si l'horizon ne suffit pas.
   */
  anneeIndependance: number | null;
  courbe: PointProjection[];
};

export function calculerProjectionPatrimoine(
  input: ProjectionInput,
  params?: TaxParamSet,
): CalcResult<ProjectionResult> {
  const horizon = Math.max(0, Math.floor(input.horizonAnnees));
  const inflation = input.inflationPourcent / 100;
  const tauxRetrait = input.tauxRetraitPourcent / 100;
  const depensesAnnuelles = Math.max(0, input.depensesAnnuellesCents ?? 0);

  const partActions = Math.min(1, Math.max(0, input.partActionsPourcent / 100));
  const partInvestActions = Math.min(
    1,
    Math.max(0, (input.partInvestissementActionsPourcent ?? input.partActionsPourcent) / 100),
  );

  const rActions = input.rendementActionsPourcent / 100;
  const rAutres = input.rendementAutresPourcent / 100;
  const fActions = input.fiscaliteActionsPourcent / 100;
  const fAutres = input.fiscaliteAutresPourcent / 100;

  // On suit les deux poches séparément : leur poids relatif dérive au fil du temps,
  // parce qu'elles ne rapportent pas la même chose et ne sont pas taxées pareil.
  let pocheActions = Math.round(input.patrimoineActuelCents * partActions);
  let pocheAutres = input.patrimoineActuelCents - pocheActions;

  const investAnnuel = Math.max(0, input.investissementAnnuelCents);
  const investActions = Math.round(investAnnuel * partInvestActions);
  const investAutres = investAnnuel - investActions;

  let totalInvesti = input.patrimoineActuelCents;
  let rendementsCumules = 0;
  let anneeIndependance: number | null = null;

  const courbe: PointProjection[] = [];

  const pousser = (annee: number) => {
    const patrimoine = pocheActions + pocheAutres;
    const facteurInflation = Math.pow(1 + inflation, annee);
    const patrimoineReel = Math.round(patrimoine / facteurInflation);
    const renteAnnuelleReelle = patrimoineReel * tauxRetrait;
    const renteMensuelleReelleCents = Math.round(renteAnnuelleReelle / 12);

    if (
      anneeIndependance === null &&
      depensesAnnuelles > 0 &&
      renteAnnuelleReelle >= depensesAnnuelles
    ) {
      anneeIndependance = annee;
    }

    courbe.push({
      annee,
      patrimoineCents: patrimoine,
      patrimoineReelCents: patrimoineReel,
      investiCents: totalInvesti,
      rendementsCumulesCents: rendementsCumules,
      renteMensuelleReelleCents,
    });
  };

  pousser(0);

  for (let annee = 1; annee <= horizon; annee++) {
    const rendementActionsNet = pocheActions * rActions * (1 - fActions);
    const rendementAutresNet = pocheAutres * rAutres * (1 - fAutres);

    pocheActions = Math.round(pocheActions + rendementActionsNet + investActions);
    pocheAutres = Math.round(pocheAutres + rendementAutresNet + investAutres);

    rendementsCumules += Math.round(rendementActionsNet + rendementAutresNet);
    totalInvesti += investAnnuel;

    pousser(annee);
  }

  const dernier = courbe[courbe.length - 1];
  const patrimoineFinalCents = dernier?.patrimoineCents ?? 0;
  const patrimoineFinalReelCents = dernier?.patrimoineReelCents ?? 0;
  const renteMensuelleCents = Math.round((patrimoineFinalCents * tauxRetrait) / 12);
  const renteMensuelleReelleCents = dernier?.renteMensuelleReelleCents ?? 0;

  const sources = params
    ? [
        getParam(params, 'hypothese.inflation_defaut'),
        getParam(params, 'hypothese.taux_retrait_defaut'),
      ].map((p) => ({
        cle: p.cle,
        annee: p.annee,
        libelle: p.libelle,
        url: p.sourceUrl,
        verifieLe: p.verifieLe,
        verifie: p.verifie,
      }))
    : [];

  return {
    result: {
      patrimoineFinalCents,
      patrimoineFinalReelCents,
      totalInvestiCents: totalInvesti,
      rendementsCumulesCents: rendementsCumules,
      renteMensuelleCents,
      renteMensuelleReelleCents,
      anneeIndependance,
      courbe,
    },
    breakdown: [
      { libelle: 'Patrimoine de départ', valeur: input.patrimoineActuelCents, unite: 'eur' },
      {
        libelle: 'Investissement annuel',
        valeur: investAnnuel,
        unite: 'eur',
        precision: `Dont ${formatPercent(partInvestActions)} en actions`,
      },
      { libelle: 'Total investi sur la période', valeur: totalInvesti, unite: 'eur' },
      {
        libelle: 'Rendements nets cumulés',
        valeur: rendementsCumules,
        unite: 'eur',
        precision: `Actions ${formatPercent(rActions)} taxées à ${formatPercent(fActions)}, reste ${formatPercent(rAutres)} taxé à ${formatPercent(fAutres)}`,
      },
      {
        libelle: `Patrimoine à ${horizon} ans`,
        valeur: patrimoineFinalCents,
        unite: 'eur',
        total: true,
      },
      {
        libelle: 'En euros d’aujourd’hui',
        valeur: patrimoineFinalReelCents,
        unite: 'eur',
        precision: `Corrigé d'une inflation de ${formatPercent(inflation)} par an — c'est le chiffre qui compte`,
        total: true,
      },
      {
        libelle: 'Rente mensuelle soutenable',
        valeur: renteMensuelleReelleCents,
        unite: 'eur',
        precision: `Au taux de retrait de ${formatPercent(tauxRetrait)}, en euros d'aujourd'hui`,
        total: true,
      },
      ...(anneeIndependance !== null
        ? [
            {
              libelle: 'Année où la rente couvre tes dépenses actuelles',
              valeur: anneeIndependance,
              unite: 'annees' as const,
              precision: `Sur la base de ${formatEUR(depensesAnnuelles, { decimals: 0 })} de dépenses annuelles`,
              total: true,
            },
          ]
        : []),
    ],
    sources,
    hypotheses: [
      'Rendements supposés constants et lissés : la réalité est faite de séquences, et l’ordre des bonnes et mauvaises années change le résultat.',
      'La fiscalité est appliquée chaque année sur le rendement, ce qui est prudent : en pratique la taxe sur les plus-values n’est due qu’à la vente.',
      'L’exonération annuelle sur les plus-values n’est pas déduite ici : la projection est donc légèrement pessimiste.',
      'Aucun frais de courtage ni de gestion n’est déduit.',
      'Ceci est une simulation, pas une prévision, et encore moins un conseil en investissement.',
    ],
  };
}
