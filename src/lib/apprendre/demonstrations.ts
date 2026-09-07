import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { calculerPrecompteDividendes, calculerPrecompteEpargneReglementee } from '@/lib/tax/precompte';
import { calculerTaxePlusValues } from '@/lib/tax/plus-values';
import { calculerTOBAllerRetour } from '@/lib/tax/tob';
import type { CalcResult } from '@/lib/tax/types';

/**
 * Démonstrations chiffrées des guides.
 *
 * Chaque entrée appelle **le même calculateur que l'application**, avec les mêmes
 * paramètres fiscaux. Un guide ne peut donc pas afficher un chiffre que l'app
 * contredirait : si le taux change dans `parametres.ts`, le texte du guide suit
 * sans qu'on y touche.
 *
 * Les entrées sont choisies pour être plausibles pour la cible — quelqu'un qui
 * place quelques milliers d'euros, pas un patrimoine de gestion privée.
 */

export type Demonstration = {
  /** L'énoncé, en français, de la situation calculée. */
  enonce: string;
  resultat: CalcResult<unknown>;
};

const P = TAX_PARAMS_2026;

export const DEMONSTRATIONS: Record<string, () => Demonstration> = {
  /** Le calcul qui fait exister l'alerte « à récupérer » du tableau de bord. */
  'dividendes-recuperation': () => ({
    enonce:
      'Tu as encaissé 1 240 € de dividendes sur l’année. Ton courtier a retenu le précompte à la source, comme il y est obligé.',
    resultat: calculerPrecompteDividendes(
      { dividendesBrutsCents: 124_000, precompteRetenuCents: 37_200 },
      P,
    ),
  }),

  /** Montre que l'exonération porte sur le dividende, pas sur le précompte. */
  'dividendes-petit-portefeuille': () => ({
    enonce:
      'Un portefeuille plus modeste : 400 € de dividendes sur l’année, précompte retenu à la source.',
    resultat: calculerPrecompteDividendes(
      { dividendesBrutsCents: 40_000, precompteRetenuCents: 12_000 },
      P,
    ),
  }),

  /** Le coût d'un aller-retour sur un ETF, souvent ignoré à l'achat. */
  'tob-aller-retour-etf': () => ({
    enonce:
      'Tu achètes pour 3 000 € d’un ETF capitalisant inscrit à la distribution en Belgique, puis tu revends la même somme.',
    resultat: calculerTOBAllerRetour(
      { montantAchatCents: 300_000, montantVenteCents: 300_000, support: 'capitalisant_belge' },
      P,
    ),
  }),

  /** La taxe de 2026 sur une plus-value modeste : souvent nulle, il faut le dire. */
  'plus-value-sous-exoneration': () => ({
    enonce:
      'Tu revends des parts avec 4 200 € de plus-value, réalisée après le 1er janvier 2026, sans autre vente dans l’année.',
    resultat: calculerTaxePlusValues({ plusValueCents: 420_000 }, P),
  }),

  /** La même mécanique au-delà de l'exonération annuelle. */
  'plus-value-au-dessus': () => ({
    enonce:
      'Même opération, mais 18 000 € de plus-value cette fois — un cas plus rare, utile pour voir où l’exonération s’arrête.',
    resultat: calculerTaxePlusValues({ plusValueCents: 1_800_000 }, P),
  }),

  /** Le compte d'épargne réglementé et son exonération propre. */
  'epargne-reglementee': () => ({
    enonce:
      'Un compte d’épargne réglementé de 6 800 € rémunéré 0,90 % de taux de base et 0,60 % de prime de fidélité, sur une année complète.',
    resultat: calculerPrecompteEpargneReglementee(
      { interetsBaseCents: 6_120, primeFideliteCents: 4_080 },
      P,
    ),
  }),
};

export function demonstration(cle: string): Demonstration | null {
  const fabrique = DEMONSTRATIONS[cle];
  return fabrique ? fabrique() : null;
}
