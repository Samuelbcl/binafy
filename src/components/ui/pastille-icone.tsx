import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';

/**
 * Les six teintes que peut porter une pastille.
 *
 * Un ensemble fermé, et volontairement court : au-delà, la couleur cesse de
 * distinguer et redevient de la décoration. Chaque sujet garde la sienne
 * partout dans l'application — c'est la constance qui en fait un repère, pas la
 * couleur elle-même.
 */
export const TEINTES = ['violet', 'menthe', 'ambre', 'rose', 'azur', 'lagune', 'terre'] as const;
export type Teinte = (typeof TEINTES)[number];

const CLASSE: Record<Teinte, string> = {
  violet: 'pastille-violet',
  menthe: 'pastille-menthe',
  ambre: 'pastille-ambre',
  rose: 'pastille-rose',
  azur: 'pastille-azur',
  lagune: 'pastille-lagune',
  terre: 'pastille-terre',
};

/**
 * Icône dans un carré teinté.
 *
 * Décorative par défaut : l'icône double un titre écrit juste à côté, donc la
 * lire au lecteur d'écran ne ferait qu'ajouter du bruit. Quand elle porte seule
 * une information, passer `libelle` — elle devient alors une image nommée.
 */
export function PastilleIcone({
  icone: Icone,
  teinte = 'violet',
  taille = 'normale',
  libelle,
  className,
}: {
  icone: Icon;
  teinte?: Teinte;
  taille?: 'normale' | 'grande';
  /** À ne fournir que si l'icône n'est pas redondante avec le texte voisin. */
  libelle?: string;
  className?: string;
}) {
  return (
    <span
      {...(libelle ? { role: 'img', 'aria-label': libelle } : { 'aria-hidden': true })}
      className={cn(
        'pastille-icone',
        CLASSE[teinte],
        taille === 'grande' && 'pastille-icone-lg',
        className,
      )}
    >
      {/* Deux tons : la forme pleine en transparence, le trait par-dessus.
          C'est ce qui fait qu'une icône ressemble à un objet, pas à un schéma. */}
      <Icone weight="duotone" className={taille === 'grande' ? 'size-7' : 'size-[22px]'} />
    </span>
  );
}
