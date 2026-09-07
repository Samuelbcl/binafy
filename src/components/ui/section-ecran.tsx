import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Zone nommée d'un écran (docs/05 § composants clés).
 *
 * Sans elle, un écran devient une pile de cartes blanches identiques : rien ne
 * dit ce qui va avec quoi, et l'œil n'a nulle part où se poser. Le filet et le
 * titre découpent l'écran en questions successives — *où j'en suis*, *comment
 * ça évolue*, *ce que je possède* — plutôt qu'en une liste de chiffres.
 *
 * Le sous-titre n'est pas décoratif : il dit à quoi sert la zone, ce qui évite
 * d'avoir à le deviner depuis les chiffres eux-mêmes.
 *
 * Le filet ne prend pas `--border` : cette couleur est faite pour cerner une
 * carte blanche, et sur le fond gris de l'écran elle disparaît — dix points
 * d'écart entre les deux. Il faut un trait plus franc pour que la séparation
 * se voie.
 */
export function SectionEcran({
  titre,
  sousTitre,
  action,
  premiere = false,
  children,
  className,
}: {
  titre: string;
  /** À quoi répond cette zone, en une phrase. */
  sousTitre?: string;
  /** Lien secondaire aligné à droite du titre. */
  action?: ReactNode;
  /** La première zone d'un écran n'a pas de filet au-dessus d'elle. */
  premiere?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        premiere ? 'pt-0' : 'mt-10 border-t border-text-subtle/25 pt-8',
        className,
      )}
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold tracking-[-0.01em]">{titre}</h2>
          {sousTitre && (
            <p className="mt-1 text-[13px] leading-relaxed text-text-muted">{sousTitre}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
