import type { BaseIcone } from '@/lib/icones/solar';

/**
 * L'icône d'une catégorie de dépenses, d'après son nom.
 *
 * Les catégories viennent de l'import et de la main de l'utilisateur : on ne
 * peut pas les connaître à l'avance. On reconnaît les mots qui reviennent —
 * logement, courses, transport — et tout ce qu'on ne reconnaît pas porte
 * l'étiquette. Une catégorie sans icône serait la seule ligne nue de la liste.
 */
const CORRESPONDANCES: readonly [RegExp, BaseIcone][] = [
  [/logement|loyer|habitat|maison|immo/i, 'home-2'],
  [/courses|alimentation|supermarch|colruyt|delhaize|carrefour|aldi|lidl/i, 'cart-large-2'],
  [/transport|voiture|essence|carburant|sncb|stib|tec|de lijn/i, 'wheel'],
  [/abonnement|netflix|spotify|streaming|proximus|telenet|orange|voo/i, 'refresh'],
  [/restaurant|resto|bar|caf[eé]|sortie/i, 'chef-hat'],
  [/loisir|cin[eé]ma|concert|voyage|vacances/i, 'ticket'],
  [/sant[eé]|m[eé]decin|pharma|mutuelle/i, 'heart-pulse'],
  [/sport|salle|fitness/i, 'dumbbell'],
  [/[eé]nergie|[eé]lectricit|gaz|eau|luminus|engie|lampiris/i, 'bolt'],
  [/t[eé]l[eé]phone|gsm|mobile|internet/i, 'phone-calling'],
  [/cadeau|don/i, 'gift'],
  [/[eé]tude|[eé]cole|kot|minerval|formation/i, 'square-academic-cap'],
];

export function iconeCategorie(nom: string): BaseIcone {
  return CORRESPONDANCES.find(([motif]) => motif.test(nom))?.[1] ?? 'tag';
}
