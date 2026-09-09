import type { CSSProperties, ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { PastilleIcone, type Teinte } from './pastille-icone';

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
 *
 * La pastille donne à chaque zone sa couleur, et cette couleur ne change pas
 * d'un écran à l'autre : *ce que je possède* est violet partout, *ce que ça me
 * coûterait* est ambre partout. On finit par reconnaître la zone avant de lire
 * son titre — c'est ce qui fait qu'un écran se parcourt au lieu de se lire.
 */
export function SectionEcran({
  titre,
  sousTitre,
  icone,
  teinte,
  action,
  premiere = false,
  ordre,
  children,
  className,
}: {
  titre: string;
  /** À quoi répond cette zone, en une phrase. */
  sousTitre?: string;
  /** Icône de la zone. Décorative : elle double le titre, elle ne le remplace pas. */
  icone?: Icon;
  teinte?: Teinte;
  /** Lien secondaire aligné à droite du titre. */
  action?: ReactNode;
  /** La première zone d'un écran n'a pas de filet au-dessus d'elle. */
  premiere?: boolean;
  /**
   * Rang d'apparition. Les zones entrent l'une après l'autre, 70 ms d'écart :
   * l'écran se construit de haut en bas au lieu de tomber d'un bloc.
   */
  ordre?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        premiere ? 'pt-0' : 'mt-10 border-t border-text-subtle/25 pt-8',
        ordre !== undefined && 'apparait',
        className,
      )}
      style={ordre !== undefined ? ({ '--delai': `${ordre * 70}ms` } as CSSProperties) : undefined}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          {/* Sur telephone, le titre seul : chaque element de plus est un
              element que quelqu'un qui decouvre l'ecran doit ignorer. */}
          {icone && (
            <PastilleIcone icone={icone} teinte={teinte} taille="petite" className="mt-0.5 hidden sm:grid" />
          )}
          <div className="min-w-0">
            <h2 className="text-[20px] font-bold">{titre}</h2>
            {sousTitre && (
              <p className="mt-1 hidden text-[13px] leading-relaxed text-text-muted sm:block">{sousTitre}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
