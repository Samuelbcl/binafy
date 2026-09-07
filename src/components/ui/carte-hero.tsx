'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatEUR, formatPercent } from '@/lib/money';
import { useDiscretion } from '@/components/providers';
import { Montant } from './montant';

/**
 * Carte du chiffre principal d'un écran (docs/05 § composants clés).
 *
 * Un aplat d'accent, un seul chiffre dessus. C'est le seul endroit de
 * l'interface où la couleur occupe une surface : ailleurs elle ne sert qu'à
 * désigner. Si deux cartes d'accent apparaissent sur un même écran, l'une des
 * deux n'est pas le chiffre principal.
 *
 * La variation n'est pas colorée en vert ou en rouge ici : sur un aplat saturé
 * ces couleurs deviennent illisibles, et le signe suffit à lire le sens.
 */
export function CarteHero({
  label,
  valeurCents,
  decimals = 2,
  variationCents,
  ratioVariation,
  mentionVariation,
  etat,
  aCote,
  children,
  className,
}: {
  label: string;
  valeurCents: number;
  decimals?: number;
  /** Variation absolue sur la période, en centimes. */
  variationCents?: number;
  /** Ratio de la même variation : 0,052 pour 5,2 %. */
  ratioVariation?: number;
  /** Ce que couvre la variation — « sur la journée », « depuis janvier ». */
  mentionVariation?: string;
  /** Pastille d'état en haut à droite : fraîcheur des données, avertissement. */
  etat?: string;
  /** Chiffre secondaire, aligné à droite du chiffre principal. */
  aCote?: { label: string; valeurCents: number };
  children?: ReactNode;
  className?: string;
}) {
  const { discret } = useDiscretion();

  return (
    <section
      className={cn(
        'rounded-[var(--radius-xl)] bg-primary p-6 text-on-primary sm:p-8',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] opacity-75">{label}</p>
        {etat && (
          <span className="puce bg-on-primary/15 text-on-primary">{etat}</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <h1 className="chiffre-hero">
          <Montant cents={valeurCents} decimals={decimals} className="text-on-primary" />
        </h1>
        {aCote && (
          <p className="text-right">
            <span className="block text-[12.5px] opacity-75">{aCote.label}</span>
            <Montant
              cents={aCote.valeurCents}
              decimals={0}
              className="mt-1 block text-[20px] font-bold text-on-primary"
            />
          </p>
        )}
      </div>

      {variationCents !== undefined && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="puce bg-on-primary/15 tabular-nums">
            {formatEUR(variationCents, { sign: 'always', decimals: 2, masked: discret })}
            {mentionVariation ? ` ${mentionVariation}` : ''}
          </span>
          {ratioVariation !== undefined && (
            <span className="puce bg-on-primary text-primary tabular-nums">
              {formatPercent(ratioVariation, { sign: 'always', masked: false })}
            </span>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
