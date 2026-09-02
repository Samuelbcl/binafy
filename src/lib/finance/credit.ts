import { formatEUR, formatPercent, formatTaux } from '../money';
import {
  type BreakdownLine,
  getParam,
  getRate,
  mergeSources,
  toSource,
  type CalcResult,
  type TaxParamSet,
} from '../tax/types';

/**
 * Crédit hypothécaire : mensualité, capacité d'emprunt, amortissement (doc 07 § 3).
 *
 * Sert deux usages : le simulateur public de capacité d'emprunt, et le calcul du
 * capital restant dû des passifs, qui alimente le patrimoine net.
 */

/** Mensualité d'un crédit à taux fixe : `C × i / (1 − (1+i)^(−n))`. */
export function mensualite(
  capitalCents: number,
  tauxAnnuelPourcent: number,
  dureeMois: number,
): number {
  if (dureeMois <= 0) return 0;
  const i = tauxAnnuelPourcent / 100 / 12;
  if (i === 0) return Math.round(capitalCents / dureeMois);
  return Math.round((capitalCents * i) / (1 - Math.pow(1 + i, -dureeMois)));
}

/** Capital empruntable pour une mensualité donnée — l'inverse de `mensualite`. */
export function capitalEmpruntable(
  mensualiteCents: number,
  tauxAnnuelPourcent: number,
  dureeMois: number,
): number {
  if (dureeMois <= 0) return 0;
  const i = tauxAnnuelPourcent / 100 / 12;
  if (i === 0) return Math.round(mensualiteCents * dureeMois);
  return Math.round((mensualiteCents * (1 - Math.pow(1 + i, -dureeMois))) / i);
}

export type LigneAmortissement = {
  mois: number;
  mensualiteCents: number;
  interetsCents: number;
  capitalCents: number;
  capitalRestantCents: number;
  /** Cumul des intérêts payés depuis le début. */
  interetsCumulesCents: number;
};

/**
 * Tableau d'amortissement complet. Sert à afficher la part d'intérêts, qui est
 * écrasante les premières années et que peu d'emprunteurs anticipent.
 */
export function tableauAmortissement(
  capitalCents: number,
  tauxAnnuelPourcent: number,
  dureeMois: number,
): LigneAmortissement[] {
  const lignes: LigneAmortissement[] = [];
  if (dureeMois <= 0 || capitalCents <= 0) return lignes;

  const i = tauxAnnuelPourcent / 100 / 12;
  const m = mensualite(capitalCents, tauxAnnuelPourcent, dureeMois);
  let restant = capitalCents;
  let interetsCumules = 0;

  for (let mois = 1; mois <= dureeMois; mois++) {
    const interets = Math.round(restant * i);
    // Dernière échéance : on solde le restant pour éviter un résidu d'arrondi.
    const capital = mois === dureeMois ? restant : m - interets;
    restant = Math.max(0, restant - capital);
    interetsCumules += interets;

    lignes.push({
      mois,
      mensualiteCents: capital + interets,
      interetsCents: interets,
      capitalCents: capital,
      capitalRestantCents: restant,
      interetsCumulesCents: interetsCumules,
    });
  }

  return lignes;
}

/**
 * Capital restant dû après un nombre de mois écoulés.
 * Utilisé pour valoriser un passif sans stocker tout le tableau.
 */
export function capitalRestantDu(
  capitalInitialCents: number,
  tauxAnnuelPourcent: number,
  dureeMois: number,
  moisEcoules: number,
): number {
  if (moisEcoules <= 0) return capitalInitialCents;
  if (moisEcoules >= dureeMois) return 0;

  const i = tauxAnnuelPourcent / 100 / 12;
  if (i === 0) {
    const parMois = capitalInitialCents / dureeMois;
    return Math.max(0, Math.round(capitalInitialCents - parMois * moisEcoules));
  }

  const m = mensualite(capitalInitialCents, tauxAnnuelPourcent, dureeMois);
  const facteur = Math.pow(1 + i, moisEcoules);
  return Math.max(0, Math.round(capitalInitialCents * facteur - m * ((facteur - 1) / i)));
}

export type CapaciteEmpruntInput = {
  /** Revenus nets mensuels du ménage, en centimes. */
  revenusNetsMensuelsCents: number;
  /** Charges de crédit existantes, en centimes par mois. */
  chargesMensuellesCents?: number;
  /** Durée souhaitée, en années. */
  dureeAnnees: number;
  /** Taux annuel en pourcentage. */
  tauxAnnuelPourcent: number;
  /** Ratio de charge maximum en pourcentage. À défaut, le paramètre BNB. */
  ratioChargeMaxPourcent?: number;
  /** Loyer attendu si investissement locatif, en centimes par mois. */
  loyerAttenduMensuelCents?: number;
  /** Plancher de reste à vivre exigé, en centimes par mois. */
  resteAVivreMinimumCents?: number;
};

export type CapaciteEmpruntResult = {
  mensualiteMaxCents: number;
  capaciteEmpruntCents: number;
  mensualiteCents: number;
  coutTotalCreditCents: number;
  interetsTotauxCents: number;
  resteAVivreCents: number;
  /** Vrai si le reste à vivre passe sous le plancher exigé. */
  resteAVivreInsuffisant: boolean;
  revenusPrisEnCompteCents: number;
};

/**
 * Capacité d'emprunt (doc 07 § 3).
 *
 * ```
 * mensualité_max = revenus_nets_mensuels × ratio_charge_max
 * capacité       = mensualité_max × (1 − (1+i)^(−n)) / i
 * ```
 * Affinée par un contrôle de reste à vivre, et, en locatif, par la prise en compte
 * partielle du loyer attendu — les banques ne retiennent jamais 100 % du loyer.
 */
export function calculerCapaciteEmprunt(
  input: CapaciteEmpruntInput,
  params: TaxParamSet,
): CalcResult<CapaciteEmpruntResult> {
  const revenus = Math.max(0, input.revenusNetsMensuelsCents);
  const charges = Math.max(0, input.chargesMensuellesCents ?? 0);
  const dureeMois = Math.max(1, Math.round(input.dureeAnnees * 12));

  const pRatio = getParam(params, 'credit.ratio_charge_max');
  const ratio = (input.ratioChargeMaxPourcent ?? pRatio.valeur) / 100;

  const pPartLoyer = getParam(params, 'credit.part_loyer_prise_en_compte');
  const partLoyer = getRate(params, 'credit.part_loyer_prise_en_compte');
  const loyerRetenu = Math.round(Math.max(0, input.loyerAttenduMensuelCents ?? 0) * partLoyer);

  const revenusPrisEnCompteCents = revenus + loyerRetenu;
  const mensualiteMaxCents = Math.max(0, Math.round(revenusPrisEnCompteCents * ratio) - charges);

  const capaciteEmpruntCents = capitalEmpruntable(
    mensualiteMaxCents,
    input.tauxAnnuelPourcent,
    dureeMois,
  );
  const mensualiteReelle = mensualite(capaciteEmpruntCents, input.tauxAnnuelPourcent, dureeMois);
  const coutTotalCreditCents = mensualiteReelle * dureeMois;
  const interetsTotauxCents = coutTotalCreditCents - capaciteEmpruntCents;

  const resteAVivreCents = revenusPrisEnCompteCents - mensualiteReelle - charges;
  const plancher = input.resteAVivreMinimumCents ?? 0;

  const breakdown: BreakdownLine[] = [
    { libelle: 'Revenus nets mensuels', valeur: revenus, unite: 'eur' as const },
  ];

  if (loyerRetenu > 0) {
    breakdown.push({
      libelle: 'Loyer attendu pris en compte',
      valeur: loyerRetenu,
      unite: 'eur' as const,
      precision: `Les banques ne retiennent qu'environ ${formatTaux(pPartLoyer.valeur, 0)} du loyer attendu`,
    });
  }

  breakdown.push(
    {
      libelle: 'Mensualité maximale',
      valeur: mensualiteMaxCents,
      unite: 'eur' as const,
      precision: `${formatTaux(ratio * 100, 0)} des revenus${charges > 0 ? `, moins ${formatEUR(charges)} de charges existantes` : ''}`,
    },
    {
      libelle: 'Capacité d’emprunt',
      valeur: capaciteEmpruntCents,
      unite: 'eur' as const,
      precision: `Sur ${input.dureeAnnees} ans à ${formatTaux(input.tauxAnnuelPourcent)}`,
      total: true,
    },
    { libelle: 'Mensualité', valeur: mensualiteReelle, unite: 'eur' as const },
    {
      libelle: 'Intérêts totaux',
      valeur: interetsTotauxCents,
      unite: 'eur' as const,
      precision: `Soit ${formatPercent(capaciteEmpruntCents > 0 ? interetsTotauxCents / capaciteEmpruntCents : 0)} du capital emprunté`,
    },
    { libelle: 'Coût total du crédit', valeur: coutTotalCreditCents, unite: 'eur' as const },
    {
      libelle: 'Reste à vivre',
      valeur: resteAVivreCents,
      unite: 'eur' as const,
      precision:
        plancher > 0
          ? `Plancher retenu : ${formatEUR(plancher)}`
          : 'Revenus moins mensualité et charges existantes',
    },
  );

  return {
    result: {
      mensualiteMaxCents,
      capaciteEmpruntCents,
      mensualiteCents: mensualiteReelle,
      coutTotalCreditCents,
      interetsTotauxCents,
      resteAVivreCents,
      resteAVivreInsuffisant: plancher > 0 && resteAVivreCents < plancher,
      revenusPrisEnCompteCents,
    },
    breakdown,
    sources: mergeSources([toSource(pRatio)], loyerRetenu > 0 ? [toSource(pPartLoyer)] : []),
    hypotheses: [
      'Le ratio de charge d’un tiers est une pratique de marché, pas une règle légale : il se négocie selon le profil.',
      'La capacité calculée ne tient pas compte de l’assurance solde restant dû, qui alourdit la mensualité réelle.',
      'Le montant empruntable ne dit rien du cash nécessaire à l’acte, qui s’y ajoute.',
    ],
  };
}
