import {
  Barbell,
  Car,
  ForkKnife,
  Gift,
  GraduationCap,
  HeartStraight,
  House,
  Lightning,
  Phone,
  Repeat,
  ShoppingCart,
  Tag,
  Ticket,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';

/**
 * L'icône d'une catégorie de dépenses, d'après son nom.
 *
 * Les catégories viennent de l'import et de la main de l'utilisateur : on ne
 * peut pas les connaître à l'avance. On reconnaît les mots qui reviennent —
 * logement, courses, transport — et tout ce qu'on ne reconnaît pas porte
 * l'étiquette. Une catégorie sans icône serait la seule ligne nue de la liste.
 */
const CORRESPONDANCES: readonly [RegExp, Icon][] = [
  [/logement|loyer|habitat|maison|immo/i, House],
  [/courses|alimentation|supermarch|colruyt|delhaize|carrefour|aldi|lidl/i, ShoppingCart],
  [/transport|voiture|essence|carburant|sncb|stib|tec|de lijn/i, Car],
  [/abonnement|netflix|spotify|streaming|proximus|telenet|orange|voo/i, Repeat],
  [/restaurant|resto|bar|caf[eé]|sortie/i, ForkKnife],
  [/loisir|cin[eé]ma|concert|voyage|vacances/i, Ticket],
  [/sant[eé]|m[eé]decin|pharma|mutuelle/i, HeartStraight],
  [/sport|salle|fitness/i, Barbell],
  [/[eé]nergie|[eé]lectricit|gaz|eau|luminus|engie|lampiris/i, Lightning],
  [/t[eé]l[eé]phone|gsm|mobile|internet/i, Phone],
  [/cadeau|don/i, Gift],
  [/[eé]tude|[eé]cole|kot|minerval|formation/i, GraduationCap],
];

export function iconeCategorie(nom: string): Icon {
  return CORRESPONDANCES.find(([motif]) => motif.test(nom))?.[1] ?? Tag;
}
