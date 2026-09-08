import { cn } from '@/lib/cn';

/**
 * La marque.
 *
 * Un nid : trois arcs emboîtés et ce qu'ils abritent. C'est le sens du nom, et
 * c'est aussi ce que fait le produit — on ne fait pas fructifier l'argent des
 * gens, on le met à l'abri et on le rend lisible.
 *
 * Contraintes qui ont dicté le dessin : lisible à 16 px dans un onglet, correct
 * en une seule couleur, et reconnaissable en aplat comme en trait. D'où trois
 * arcs seulement, espacés de trois unités sur une grille de 24, et une forme
 * pleine au centre qui survit à la réduction quand les arcs se referment.
 */
export function LogoNestor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      className={cn('size-5', className)}
      aria-hidden
    >
      <path d="M3 11.5a9 9 0 0 0 18 0" />
      <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
      <circle cx="12" cy="8" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Le bloc marque complet : le symbole dans sa pastille, puis le nom.
 *
 * `ton="accent"` pour la pastille colorée du site public, `ton="sobre"` quand la
 * marque cohabite avec une carte d'accent — deux surfaces colorées sur un même
 * écran et l'accent ne désigne plus rien.
 */
export function MarqueNestor({
  ton = 'accent',
  taille = 'normale',
  className,
}: {
  ton?: 'accent' | 'sobre';
  taille?: 'normale' | 'grande';
  className?: string;
}) {
  const grande = taille === 'grande';

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <span
        aria-hidden
        className={cn(
          // Rond, en relief : la marque parle la langue de forme des jetons.
          'grid place-items-center rounded-full shadow-[var(--pastille-relief)]',
          grande ? 'size-10' : 'size-8',
          ton === 'accent' ? 'bg-primary text-on-primary' : 'bg-surface-2 text-primary',
        )}
      >
        <LogoNestor className={grande ? 'size-6' : 'size-5'} />
      </span>
      <span
        className={cn(
          'font-display tracking-[-0.005em]',
          grande ? 'text-[22px]' : 'text-[19px]',
        )}
      >
        Nestor
      </span>
    </span>
  );
}
