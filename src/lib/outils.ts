import type { BaseIcone } from '@/lib/icones/solar';
import type { Teinte } from '@/components/ui/pastille-icone';

/**
 * Catalogue des outils publics (doc 09).
 *
 * Une seule liste, lue par la page d'accueil, la page d'index des outils et le
 * sitemap. Trois outils avaient été écrits sans figurer nulle part : c'est
 * exactement ce que cette liste empêche.
 */

export type Outil = {
  href: string;
  titre: string;
  /** Ce que l'outil répond, en une phrase — pas ce qu'il contient. */
  description: string;
  icone: BaseIcone;
  /**
   * Couleur de la pastille. Elle suit le sujet, pas l'ordre de la liste :
   * l'immobilier reste ambre partout, la bourse reste violette. On retrouve un
   * outil à sa couleur avant d'avoir lu son titre.
   */
  teinte: Teinte;
  /** Mis en avant sur la page d'accueil. */
  vedette?: boolean;
};

export const OUTILS: readonly Outil[] = [
  {
    href: '/outils/frais-acquisition',
    titre: 'Frais d’acquisition immobilière',
    description:
      'Le cash réel à sortir le jour de l’acte, par Région, et ce que coûte un locatif acheté avant sa résidence principale.',
    icone: 'home-2',
    teinte: 'ambre',
    vedette: true,
  },
  {
    href: '/outils/capacite-emprunt',
    titre: 'Capacité d’emprunt',
    description:
      'Combien tu peux emprunter, et surtout ce qu’il te resterait pour vivre — le chiffre que les banques ne montrent pas.',
    icone: 'buildings-2',
    teinte: 'terre',
    vedette: true,
  },
  {
    href: '/outils/interets-composes',
    titre: 'Intérêts composés',
    description:
      'La projection classique, mais avec la version nette de fiscalité belge. Personne d’autre ne la donne.',
    icone: 'calculator-minimalistic',
    teinte: 'violet',
    vedette: true,
  },
  {
    href: '/outils/budget',
    titre: 'Budget et taux d’épargne',
    description:
      'Épargner et investir ne sont pas la même chose. Les deux taux, séparés, et la cible d’épargne de précaution qui en découle.',
    icone: 'wallet-money',
    teinte: 'menthe',
  },
  {
    href: '/outils/rendement-locatif',
    titre: 'Rendement locatif belge',
    description:
      'Tu n’es pas taxé sur les loyers mais sur le revenu cadastral indexé. Voici ton cash-flow réel après impôt.',
    icone: 'document-text',
    teinte: 'azur',
  },
  {
    href: '/outils/independant-complementaire',
    titre: 'Indépendant complémentaire',
    description:
      'Cotisations, frais de caisse et impôt marginal : sur ce que tu factures, ce qui arrive vraiment dans ta poche.',
    icone: 'hand-money',
    teinte: 'rose',
  },
  {
    href: '/outils/simulateur-patrimoine',
    titre: 'Simulateur de patrimoine',
    description:
      'Où mène ton rythme d’épargne actuel, sur dix ou trente ans, taxe sur les plus-values comprise.',
    icone: 'graph-up',
    teinte: 'lagune',
  },
];

export const OUTILS_VEDETTE = OUTILS.filter((o) => o.vedette);
