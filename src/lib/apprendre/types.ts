/**
 * Contenu pédagogique (doc 09).
 *
 * Les guides ne sont pas du Markdown : ce sont des blocs typés. La raison est la
 * même que pour le reste de l'app — **aucun montant n'est écrit en dur**. Un bloc
 * `demonstration` ne contient pas « 249,90 € » mais la clé d'un calculateur et
 * ses entrées ; le chiffre est produit à la lecture par la même fonction que
 * celle qui alimente l'application, avec son détail et ses sources.
 *
 * Conséquence directe : quand un paramètre fiscal change, les guides changent
 * avec lui. Un guide ne peut pas dériver de l'app.
 */

export type CategorieGuide =
  | 'fiscalite'
  | 'investir'
  | 'immobilier'
  | 'budget'
  | 'independant';

export const CATEGORIES: readonly {
  cle: CategorieGuide;
  libelle: string;
  description: string;
}[] = [
  {
    cle: 'fiscalite',
    libelle: 'Fiscalité',
    description: 'Ce que l’État prélève, quand, et ce qui se récupère.',
  },
  {
    cle: 'investir',
    libelle: 'Investir',
    description: 'ETF, actions, comptes-titres — vus depuis la Belgique.',
  },
  {
    cle: 'immobilier',
    libelle: 'Immobilier',
    description: 'Acheter, louer, emprunter, et ce que ça coûte vraiment.',
  },
  {
    cle: 'budget',
    libelle: 'Budget',
    description: 'Savoir où part l’argent avant de savoir où le placer.',
  },
  {
    cle: 'independant',
    libelle: 'Indépendant',
    description: 'Le complémentaire, ses cotisations et ses seuils.',
  },
];

export type NiveauGuide = 'debutant' | 'intermediaire' | 'avance';

export const LIBELLE_NIVEAU: Record<NiveauGuide, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
};

/** Un bloc de contenu. Le rendu vit dans `components/apprendre/rendu-guide`. */
export type BlocGuide =
  | { type: 'para'; texte: string }
  | { type: 'titre'; texte: string }
  | { type: 'liste'; items: readonly string[] }
  /** L'encart qui nomme le piège du sujet — le cœur de chaque guide. */
  | { type: 'piege'; titre: string; texte: string }
  | { type: 'note'; titre: string; texte: string }
  /**
   * Un calcul réel, produit par le moteur. `cle` désigne une démonstration
   * enregistrée dans `demonstrations.ts` ; le rendu affiche son détail ligne à
   * ligne et ses sources.
   */
  | { type: 'demonstration'; cle: string; titre: string; introduction?: string }
  /** Renvoi vers un calculateur public, pour rejouer avec ses propres chiffres. */
  | { type: 'outil'; href: string; libelle: string; texte: string };

export type Guide = {
  slug: string;
  titre: string;
  /** Ce que le lecteur saura faire après. Une phrase, 140 caractères max. */
  resume: string;
  categorie: CategorieGuide;
  niveau: NiveauGuide;
  /** Minutes de lecture, à 200 mots par minute. */
  dureeMinutes: number;
  /** Date ISO de dernière vérification du contenu à ses sources. */
  verifieLe: string;
  /** Année **de revenus** à laquelle les montants cités s'appliquent. */
  anneeRevenus: number;
  blocs: readonly BlocGuide[];
  /** Clés de `src/lib/tax/parametres.ts` dont dépend le guide. */
  parametresLies: readonly string[];
  /** Guides à lire ensuite. */
  suite?: readonly string[];
};

/** Nombre de mots d'un guide, pour recouper la durée annoncée. */
export function compterMots(guide: Guide): number {
  return guide.blocs.reduce((total, bloc) => {
    const textes: string[] = [];
    if ('texte' in bloc && bloc.texte) textes.push(bloc.texte);
    if ('titre' in bloc && bloc.titre) textes.push(bloc.titre);
    if ('introduction' in bloc && bloc.introduction) textes.push(bloc.introduction);
    if (bloc.type === 'liste') textes.push(...bloc.items);
    return total + textes.join(' ').split(/\s+/).filter(Boolean).length;
  }, 0);
}
