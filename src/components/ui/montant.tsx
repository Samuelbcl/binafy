'use client';

import { cn } from '@/lib/cn';
import { formatEUR, formatPercent, type FormatEURConfig } from '@/lib/money';
import { useDiscretion } from '@/components/providers';

/**
 * Affichage d'un montant.
 *
 * Passe obligatoirement par ce composant : il applique le mode discrétion, le
 * format belge et les chiffres tabulaires. Un montant écrit en dur dans du JSX
 * échappe aux trois.
 */

type MontantProps = FormatEURConfig & {
  cents: number;
  className?: string;
  /** Colore la valeur selon son signe. Pour les variations, pas pour les soldes. */
  colore?: boolean;
  /** Ne pas masquer en mode discrétion — réservé aux montants non personnels. */
  jamaisMasque?: boolean;
  /**
   * Les centimes en retrait. Sur un grand chiffre, « 13 349,88 € » se lit
   * 13 349 ; les décimales sont là pour qui les cherche, pas pour peser.
   */
  decimalesDiscretes?: boolean;
};

export function Montant({
  cents,
  className,
  colore = false,
  jamaisMasque = false,
  decimalesDiscretes = false,
  ...config
}: MontantProps) {
  const { discret } = useDiscretion();
  const masque = discret && !jamaisMasque;
  const texte = formatEUR(cents, { ...config, masked: masque });
  // « 13 349,88 € » → entier, décimales, symbole. Si le format ne se découpe
  // pas (masqué, sans décimales), on affiche tel quel.
  const morceaux = decimalesDiscretes && !masque ? /^(.*?)(,\d+)(\s€)$/.exec(texte) : null;

  return (
    <span
      data-montant
      className={cn(
        // Un grand chiffre seul n'a rien à aligner : en chiffres proportionnels,
        // la virgule retrouve sa largeur au lieu d'occuper une case de chiffre.
        'font-mono',
        decimalesDiscretes ? 'proportional-nums' : 'tabular-nums',
        colore && !masque && cents > 0 && 'text-positive',
        colore && !masque && cents < 0 && 'text-negative',
        className,
      )}
    >
      {morceaux ? (
        <>
          {morceaux[1]}
          <span className="opacity-50">{morceaux[2]}</span>
          {morceaux[3]}
        </>
      ) : (
        texte
      )}
    </span>
  );
}

type PourcentageProps = {
  /** Ratio : 0,052 pour 5,2 %. */
  ratio: number;
  className?: string;
  decimals?: number;
  sign?: 'auto' | 'always';
  colore?: boolean;
  jamaisMasque?: boolean;
};

export function Pourcentage({
  ratio,
  className,
  decimals = 1,
  sign = 'auto',
  colore = false,
  jamaisMasque = true,
}: PourcentageProps) {
  const { discret } = useDiscretion();
  const masque = discret && !jamaisMasque;

  return (
    <span
      className={cn(
        'font-mono tabular-nums',
        colore && ratio > 0 && 'text-positive',
        colore && ratio < 0 && 'text-negative',
        className,
      )}
    >
      {formatPercent(ratio, { decimals, sign, masked: masque })}
    </span>
  );
}

/**
 * Variation : montant signé et pourcentage, colorés ensemble.
 * Le rouge reste tempéré — on n'affole pas quelqu'un qui regarde son épargne.
 */
export function Variation({
  cents,
  ratio,
  className,
  decimals = 0,
}: {
  cents: number;
  ratio?: number;
  className?: string;
  decimals?: number;
}) {
  const { discret } = useDiscretion();
  const positif = cents > 0;
  const nul = cents === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-sm tabular-nums',
        !discret && positif && 'text-positive',
        !discret && !positif && !nul && 'text-negative',
        (discret || nul) && 'text-text-muted',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block size-1.5 rounded-full',
          positif && 'bg-positive',
          !positif && !nul && 'bg-negative',
          nul && 'bg-text-subtle',
        )}
      />
      {formatEUR(cents, { sign: 'always', decimals, masked: discret })}
      {ratio !== undefined && (
        <span className="text-text-muted">
          ({formatPercent(ratio, { sign: 'always', masked: false })})
        </span>
      )}
    </span>
  );
}
