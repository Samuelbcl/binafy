import { formatEUR } from '../money';
import { VERSEMENTS_PAR_AN, type FrequenceContribution } from '../objectifs/types';
import type { CalcResult } from '../tax/types';

/**
 * Projection d'un objectif d'épargne.
 *
 * Trois questions, et rien d'autre : où en serai-je à l'échéance au rythme
 * prévu ; quand est-ce que j'y arrive si je garde ce rythme ; et, si le rythme
 * ne suffit pas, quel rendement il faudrait pour combler l'écart. La dernière
 * est un calcul, pas une promesse : elle dit ce qu'il faudrait, elle ne dit pas
 * où le trouver.
 */

/** Ramène un versement à son équivalent mensuel, en centimes entiers. */
export function mensualiser(contributionCents: number, frequence: FrequenceContribution): number {
  return Math.round((Math.max(0, contributionCents) * VERSEMENTS_PAR_AN[frequence]) / 12);
}

/**
 * Mois entiers entre une date et une échéance `AAAA-MM-JJ`. Jamais négatif :
 * une échéance passée compte pour zéro mois, pas pour un remboursement.
 */
export function moisJusqua(echeance: string, aujourdhui: Date): number {
  const [a = '0', m = '1'] = echeance.split('-');
  const cible = Number(a) * 12 + (Number(m) - 1);
  const actuel = aujourdhui.getUTCFullYear() * 12 + aujourdhui.getUTCMonth();
  return Math.max(0, cible - actuel);
}

/** L'échéance qui tombe dans `mois` mois, au premier du mois, en `AAAA-MM-JJ`. */
export function echeanceDans(mois: number, aujourdhui: Date): string {
  const d = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth() + mois, 1));
  return d.toISOString().slice(0, 10);
}

export type ProjectionObjectif = {
  mensualiteCents: number;
  /** Ce qui sera là à l'échéance si rien ne rapporte rien. */
  atteintAHorizonCents: number;
  /** Ce qui manquera à l'échéance. Zéro si le rythme suffit. */
  ecartAHorizonCents: number;
  /**
   * Mois pour atteindre la cible au rythme prévu, indépendamment de
   * l'échéance. Zéro si déjà atteint ; nul si rien n'est versé et que la cible
   * n'est pas atteinte — on ne divise pas par zéro pour dire « jamais ».
   */
  moisPourAtteindre: number | null;
  /**
   * Rendement annuel qu'il faudrait pour que ce qui est là plus les versements
   * atteignent la cible à l'échéance. Zéro si le rythme suffit sans rendement ;
   * nul si aucun rendement raisonnable (≤ 100 % par an) n'y suffirait, ou si
   * l'échéance est déjà là.
   */
  rendementRequis: number | null;
  /** Un point par mois, de zéro à l'horizon : les versements cumulés. */
  trajectoire: readonly { mois: number; verseCents: number }[];
};

/**
 * Valeur finale de `atteint` capitalisé plus `mensualite` versée chaque mois,
 * au taux annuel `taux`, sur `horizon` mois. Composition mensuelle : c'est ce
 * qu'on veut inverser, pas une convention de marché.
 */
function valeurFinale(
  atteintCents: number,
  mensualiteCents: number,
  horizonMois: number,
  tauxAnnuel: number,
): number {
  const i = (1 + tauxAnnuel) ** (1 / 12) - 1;
  if (i === 0) return atteintCents + mensualiteCents * horizonMois;
  const facteur = (1 + i) ** horizonMois;
  return atteintCents * facteur + mensualiteCents * ((facteur - 1) / i);
}

export function projeterObjectif(input: {
  atteintCents: number;
  cibleCents: number;
  contributionCents: number | null;
  frequence: FrequenceContribution | null;
  horizonMois: number;
}): CalcResult<ProjectionObjectif> {
  const atteint = Math.max(0, input.atteintCents);
  const cible = Math.max(0, input.cibleCents);
  const horizon = Math.max(0, Math.round(input.horizonMois));
  const mensualite =
    input.contributionCents != null && input.frequence
      ? mensualiser(input.contributionCents, input.frequence)
      : 0;

  const trajectoire: { mois: number; verseCents: number }[] = [];
  for (let m = 0; m <= horizon; m++) trajectoire.push({ mois: m, verseCents: atteint + mensualite * m });

  const atteintAHorizon = atteint + mensualite * horizon;
  const ecart = Math.max(0, cible - atteintAHorizon);

  const reste = Math.max(0, cible - atteint);
  const moisPourAtteindre = reste === 0 ? 0 : mensualite > 0 ? Math.ceil(reste / mensualite) : null;

  // Le rendement requis : on cherche le taux annuel qui annule l'écart. La
  // fonction est croissante en taux, donc une bissection suffit ; soixante
  // itérations donnent bien mieux que le centième de point qu'on affiche.
  let rendementRequis: number | null;
  if (ecart === 0) rendementRequis = 0;
  else if (horizon === 0) rendementRequis = null;
  else if (valeurFinale(atteint, mensualite, horizon, 1) < cible) rendementRequis = null;
  else {
    let bas = 0;
    let haut = 1;
    for (let k = 0; k < 60; k++) {
      const milieu = (bas + haut) / 2;
      if (valeurFinale(atteint, mensualite, horizon, milieu) < cible) bas = milieu;
      else haut = milieu;
    }
    rendementRequis = haut;
  }

  return {
    result: {
      mensualiteCents: mensualite,
      atteintAHorizonCents: atteintAHorizon,
      ecartAHorizonCents: ecart,
      moisPourAtteindre,
      rendementRequis,
      trajectoire,
    },
    breakdown: [
      { libelle: 'Déjà là', valeur: atteint, unite: 'eur' },
      {
        libelle: 'Versement mensuel équivalent',
        valeur: mensualite,
        unite: 'eur',
        precision:
          input.contributionCents != null && input.frequence
            ? `${formatEUR(input.contributionCents)} ${input.frequence === 'annee' ? 'par an' : `par ${input.frequence}`}`
            : 'Aucun versement prévu',
      },
      { libelle: 'Horizon', valeur: horizon, unite: 'coefficient', precision: 'mois' },
      {
        libelle: 'Projeté à l’échéance, sans rendement',
        valeur: atteintAHorizon,
        unite: 'eur',
        total: true,
      },
      { libelle: 'Cible', valeur: cible, unite: 'eur' },
      {
        libelle: 'Écart à l’échéance',
        valeur: ecart,
        unite: 'eur',
        precision:
          ecart === 0
            ? 'Le rythme suffit sans rendement'
            : rendementRequis === null
              ? 'Aucun rendement raisonnable ne le comble : il faut verser plus, ou plus longtemps'
              : `Comblé par un rendement annuel de ${(rendementRequis * 100).toFixed(1).replace('.', ',')} %`,
      },
    ],
    sources: [],
    hypotheses: [
      'La projection suppose des versements réguliers et aucun rendement : c’est le cas défavorable, celui d’un compte d’épargne à taux nul.',
      'Le rendement requis est brut : la fiscalité belge (précompte, TOB, taxe sur les plus-values) le rendrait plus élevé encore.',
    ],
  };
}

export type EtatObjectif = 'atteint' | 'en_route' | 'en_retard' | 'sans_rythme';

/**
 * Où en est un objectif, en un mot et un chiffre.
 *
 * - `atteint` : ce qui est là couvre la cible.
 * - `en_route` : au rythme prévu, la cible tombe avant l'échéance (ou, sans
 *   échéance, tombe tout court) — `moisRestants` dit quand.
 * - `en_retard` : le rythme ne suffit pas pour l'échéance — `manqueMensuelCents`
 *   dit ce qu'il faudrait verser en plus chaque mois.
 * - `sans_rythme` : rien n'est prévu ; on ne peut projeter aucune date.
 */
export function etatObjectif(
  input: {
    atteintCents: number;
    cibleCents: number;
    contributionCents: number | null;
    frequence: FrequenceContribution | null;
    echeance: string | null;
  },
  aujourdhui: Date,
): { etat: EtatObjectif; moisRestants: number | null; manqueMensuelCents: number } {
  const reste = Math.max(0, input.cibleCents - input.atteintCents);
  if (reste === 0) return { etat: 'atteint', moisRestants: 0, manqueMensuelCents: 0 };

  const mensualite =
    input.contributionCents != null && input.frequence
      ? mensualiser(input.contributionCents, input.frequence)
      : 0;
  const horizon = input.echeance ? moisJusqua(input.echeance, aujourdhui) : null;

  if (mensualite === 0) {
    // Sans rythme, la seule chose qu'on sache dire est ce qu'il faudrait par
    // mois pour tenir l'échéance — si elle existe et n'est pas déjà là.
    const manque = horizon && horizon > 0 ? Math.ceil(reste / horizon) : 0;
    return { etat: 'sans_rythme', moisRestants: null, manqueMensuelCents: manque };
  }

  const moisRestants = Math.ceil(reste / mensualite);
  if (horizon === null || moisRestants <= horizon) {
    return { etat: 'en_route', moisRestants, manqueMensuelCents: 0 };
  }
  const manque = horizon > 0 ? Math.ceil(reste / horizon) - mensualite : reste;
  return { etat: 'en_retard', moisRestants, manqueMensuelCents: Math.max(0, manque) };
}
