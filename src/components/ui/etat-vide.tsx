import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * États vides (docs/05 § composants clés).
 *
 * Un écran vide n'est pas un écran raté : c'est le **premier** écran d'un
 * nouvel utilisateur, et celui qui décide s'il reste. « Aucun actif pour
 * l'instant » ne fait qu'énoncer ce qu'on voit déjà.
 *
 * Trois choses, dans cet ordre : ce qui apparaîtra ici, pourquoi ce n'est pas
 * encore là, et le seul geste qui le remplit. Le motif rend la zone
 * reconnaissable et l'empêche de se lire comme une erreur.
 */

/**
 * Le nid, en fond, très pâle.
 *
 * Repris du symbole de la marque plutôt que d'une illustration de banque
 * d'images : le vide reste dans le vocabulaire du produit, et rien à
 * télécharger.
 */
function MotifVide({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 68"
      fill="none"
      aria-hidden
      className={cn('h-16 w-auto text-primary', className)}
    >
      {/*
        Trois arcs concentriques ouverts vers le haut, comme le symbole. Leur
        rayon est calé sur la hauteur du cadre : le plus large descend à y=62
        depuis la ligne y=26, soit exactement 36 de rayon. Un rayon plus grand
        sortirait du viewBox et l'arc serait rogné.
      */}
      <g stroke="currentColor" strokeLinecap="round" strokeWidth="2">
        <path d="M24 26a36 36 0 0 0 72 0" strokeOpacity="0.2" />
        <path d="M36 26a24 24 0 0 0 48 0" strokeOpacity="0.34" />
        <path d="M48 26a12 12 0 0 0 24 0" strokeOpacity="0.5" />
      </g>
      <circle cx="60" cy="18" r="7" fill="currentColor" fillOpacity="0.55" />
    </svg>
  );
}

export type ActionVide = {
  href: string;
  libelle: string;
  /** `false` pour une piste annoncée mais pas encore ouverte. */
  disponible?: boolean;
};

/**
 * Bloc d'état vide, à placer dans une carte ou seul.
 *
 * `dense` pour l'intérieur d'une carte qui en contient d'autres, où un grand
 * motif écraserait le reste.
 */
export function EtatVide({
  titre,
  texte,
  action,
  dense = false,
  children,
  className,
}: {
  /** Ce qui apparaîtra ici, formulé au futur plutôt qu'en négatif. */
  titre: string;
  texte: string;
  action?: ActionVide;
  dense?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        dense ? 'gap-2 py-6' : 'gap-3 py-10',
        className,
      )}
    >
      <MotifVide className={dense ? 'h-10' : 'h-16'} />
      <p className={cn('font-bold', dense ? 'text-[14px]' : 'mt-1 text-[16px]')}>{titre}</p>
      <p
        className={cn(
          'max-w-sm leading-relaxed text-text-muted',
          dense ? 'text-[12.5px]' : 'text-[13.5px]',
        )}
      >
        {texte}
      </p>
      {action &&
        (action.disponible === false ? (
          <span className="mt-1 text-[12.5px] text-text-subtle">{action.libelle}</span>
        ) : (
          <Link href={action.href} className="bouton-principal mt-2">
            {action.libelle}
          </Link>
        ))}
      {children}
    </div>
  );
}
