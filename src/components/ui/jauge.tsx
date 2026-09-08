import { cn } from '@/lib/cn';
import { formatEUR, formatPercent } from '@/lib/money';

/**
 * Jauge d'avancement vers un plafond ou un objectif.
 *
 * Un montant seul ne dit rien : « 524 € » n'a de sens que rapporté à ce qu'il
 * peut atteindre. La jauge donne la réponse d'un coup d'œil, là où deux
 * chiffres côte à côte demandent une division mentale.
 *
 * **Elle ne mesure jamais un jugement.** Pas de note sur dix, pas de score de
 * diversification : Nestor n'est pas agréé pour dire à quelqu'un si son
 * portefeuille est bon. Une jauge ne compare qu'à un **plafond légal** ou à une
 * **cible que l'utilisateur a fixée lui-même** — deux repères factuels, dont il
 * tire ses propres conclusions.
 */
export function Jauge({
  label,
  valeurCents,
  cibleCents,
  precision,
  ton = 'accent',
  inverse = false,
  className,
}: {
  label: string;
  /** Ce qui est atteint aujourd'hui. */
  valeurCents: number;
  /** Le plafond légal, ou l'objectif fixé. */
  cibleCents: number;
  /** Ce que la jauge signifie, en une phrase. */
  precision?: string;
  ton?: 'accent' | 'positif' | 'attention';
  /**
   * `true` quand remplir la jauge est une mauvaise nouvelle — un plafond qu'on
   * consomme plutôt qu'un objectif qu'on atteint. Seul le libellé change.
   */
  inverse?: boolean;
  className?: string;
}) {
  const cible = Math.max(0, cibleCents);
  const valeur = Math.max(0, valeurCents);
  const part = cible > 0 ? Math.min(1, valeur / cible) : 0;
  const reste = Math.max(0, cible - valeur);

  const couleur =
    ton === 'positif' ? 'bg-positive' : ton === 'attention' ? 'bg-warning' : 'bg-primary';

  return (
    <div className={cn('carte p-4 sm:p-5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="label-kpi min-w-0 truncate">{label}</p>
        <p className="shrink-0 text-[12.5px] tabular-nums text-text-subtle">
          {formatPercent(part, { decimals: 0 })}
        </p>
      </div>

      <p className="mt-2 text-[20px] font-semibold tracking-[-0.02em] sm:text-[22px]">
        <span data-montant>{formatEUR(valeur, { decimals: 0 })}</span>
        <span className="ml-1.5 text-[13px] font-medium text-text-muted">
          sur {formatEUR(cible, { decimals: 0 })}
        </span>
      </p>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={`${label} : ${formatEUR(valeur, { decimals: 0 })} sur ${formatEUR(cible, { decimals: 0 })}`}
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', couleur)}
          style={{ width: `${part * 100}%` }}
        />
      </div>

      <p className="mt-2.5 text-[12.5px] leading-snug text-text-subtle">
        {precision ??
          (inverse
            ? `Il reste ${formatEUR(reste, { decimals: 0 })} avant d’atteindre le plafond.`
            : `Encore ${formatEUR(reste, { decimals: 0 })} pour y arriver.`)}
      </p>
    </div>
  );
}
