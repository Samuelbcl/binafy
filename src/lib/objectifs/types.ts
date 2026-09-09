import type { BaseIcone } from '@/lib/icones/solar';
import { z } from 'zod';
import { TEINTES, type Teinte } from '@/components/ui/pastille-icone';

/**
 * Objectifs (doc 02 § module 5).
 *
 * Un objectif transforme une intention floue en date. Il porte une cible, une
 * échéance, un rythme de versement, et des actifs rattachés dont la valeur dit
 * où on en est. Tout le reste — la date projetée, le retard, le rendement
 * qu'il faudrait — se **calcule** dans `lib/finance/objectifs.ts` ; rien de
 * cela n'est stocké, sinon il faudrait penser à le recalculer.
 */

export const FREQUENCES = ['semaine', 'mois', 'trimestre', 'annee'] as const;
export type FrequenceContribution = (typeof FREQUENCES)[number];

export const LIBELLE_FREQUENCE: Record<FrequenceContribution, string> = {
  semaine: 'par semaine',
  mois: 'par mois',
  trimestre: 'par trimestre',
  annee: 'par an',
};

/** Nombre de versements dans une année, pour ramener tout rythme au mois. */
export const VERSEMENTS_PAR_AN: Record<FrequenceContribution, number> = {
  semaine: 52,
  mois: 12,
  trimestre: 4,
  annee: 1,
};

/**
 * Les icônes qu'un objectif peut porter. Dix, pas cinquante : au-delà, on
 * cherche l'icône au lieu de nommer l'objectif. Les clés sont stables et
 * stockées en base ; les icônes Solar derrière peuvent changer.
 */
export const ICONES_OBJECTIF = {
  bouclier: 'shield-check',
  maison: 'home-2',
  soleil: 'sun-2',
  diplome: 'square-academic-cap',
  voiture: 'wheel',
  bague: 'hearts',
  avion: 'suitcase-tag',
  boussole: 'compass',
  tirelire: 'money-bag',
  bebe: 'balloon',
} satisfies Record<string, BaseIcone>;

export type IconeObjectif = keyof typeof ICONES_OBJECTIF;
export const CLES_ICONE = Object.keys(ICONES_OBJECTIF) as [IconeObjectif, ...IconeObjectif[]];

export const TYPES_OBJECTIF = ['libre', 'precaution', 'apport_immo'] as const;
export type TypeObjectif = (typeof TYPES_OBJECTIF)[number];

/**
 * Une inspiration : un objectif pré-nommé qu'on choisit d'un geste.
 *
 * Deux d'entre elles sont *spéciales* — leur cible se calcule au lieu de se
 * deviner : le matelas de sécurité depuis les charges fixes du budget, l'apport
 * depuis le moteur de frais d'acquisition. C'est ce qu'aucun concurrent ne fait
 * pour la Belgique, et c'est pour ça qu'elles sont en tête de liste.
 */
export type Inspiration = {
  cle: string;
  nom: string;
  icone: IconeObjectif;
  teinte: Teinte;
  /** Ce que cet objectif protège ou permet, en une phrase. */
  aide: string;
  special?: 'matelas' | 'apport';
};

export const INSPIRATIONS: readonly Inspiration[] = [
  {
    cle: 'matelas',
    nom: 'Mon matelas de sécurité',
    icone: 'bouclier',
    teinte: 'menthe',
    aide: 'Le premier, avant tout le reste. Nestor calcule la cible depuis tes charges fixes.',
    special: 'matelas',
  },
  {
    cle: 'apport',
    nom: 'Mon apport immobilier',
    icone: 'maison',
    teinte: 'ambre',
    aide: 'Cible calculée par Région : droits d’enregistrement, notaire, frais d’acte.',
    special: 'apport',
  },
  {
    cle: 'retraite',
    nom: 'Ma retraite',
    icone: 'soleil',
    teinte: 'violet',
    aide: 'Le complément à la pension légale, à ton rythme.',
  },
  {
    cle: 'etudes',
    nom: 'Les études des enfants',
    icone: 'diplome',
    teinte: 'azur',
    aide: 'Kot, minerval, matériel : une échéance qu’on connaît des années à l’avance.',
  },
  {
    cle: 'voiture',
    nom: 'Une voiture',
    icone: 'voiture',
    teinte: 'terre',
    aide: 'Payer cash plutôt qu’à crédit : la cible, c’est le prix.',
  },
  {
    cle: 'mariage',
    nom: 'Un mariage',
    icone: 'bague',
    teinte: 'rose',
    aide: 'Une date fixe, un budget qu’on choisit.',
  },
  {
    cle: 'voyage',
    nom: 'Un grand voyage',
    icone: 'avion',
    teinte: 'lagune',
    aide: 'Le tour du monde ou trois semaines loin : à toi de chiffrer.',
  },
  {
    cle: 'independance',
    nom: 'L’indépendance financière',
    icone: 'boussole',
    teinte: 'violet',
    aide: 'Le capital qui couvre tes dépenses annuelles, sans dépendre d’un salaire.',
  },
];

export type Objectif = {
  id: string;
  nom: string;
  type: TypeObjectif;
  icone: IconeObjectif;
  teinte: Teinte;
  cibleCents: number;
  /** Date visée, `AAAA-MM-JJ`. Nulle quand l'objectif n'a pas d'échéance. */
  echeance: string | null;
  /** Ce qu'on prévoit de verser, et à quel rythme. Nuls si non renseignés. */
  contributionCents: number | null;
  frequence: FrequenceContribution | null;
  /** Identifiants des actifs rattachés : leur valeur dit où on en est. */
  actifsLies: readonly string[];
  /** Valeur actuelle des actifs rattachés, en centimes. */
  atteintCents: number;
  creeLe: string;
};

/**
 * Ce qui vit dans la colonne `goals.parametres` (jsonb).
 *
 * Le schéma de la table a prévu cette colonne pour ce qui distingue un objectif
 * d'un autre sans mériter une colonne : l'icône, la couleur, le rythme. On la
 * relit toujours à travers ce schéma — une valeur inattendue retombe sur un
 * défaut plutôt que de casser l'écran.
 */
export const schemaParametresObjectif = z.object({
  icone: z.enum(CLES_ICONE).catch('tirelire'),
  teinte: z.enum(TEINTES).catch('violet'),
  contribution_cents: z.number().int().nonnegative().nullable().catch(null),
  frequence: z.enum(FREQUENCES).nullable().catch(null),
  inspiration: z.string().max(40).nullable().catch(null),
});

export type ParametresObjectif = z.infer<typeof schemaParametresObjectif>;
