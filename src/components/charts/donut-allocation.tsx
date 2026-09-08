'use client';

import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useDiscretion } from '@/components/providers';
import { cn } from '@/lib/cn';
import type { AllocationPoche } from '@/lib/patrimoine/types';
import { formatEUR, formatPercent, MASK, NBSP } from '@/lib/money';

/**
 * Donut d'allocation (doc 05 § donut).
 *
 * Épaisseur 28px, coins arrondis, écart entre segments. Le centre porte le total.
 * La légende est une liste avec micro-barre de progression : le survol met un
 * segment en avant et grise les autres.
 */

export function DonutAllocation({
  allocation,
  totalCents,
  className,
}: {
  allocation: AllocationPoche[];
  totalCents: number;
  className?: string;
}) {
  const [survole, setSurvole] = useState<string | null>(null);
  const { discret } = useDiscretion();

  return (
    <div className={cn('carte p-5 sm:p-6', className)}>
      <h2 className="font-display text-[17px]">Allocation</h2>

      <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative mx-auto size-[180px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                dataKey="valeurCents"
                nameKey="libelle"
                innerRadius={62}
                outerRadius={90}
                paddingAngle={2}
                cornerRadius={4}
                startAngle={90}
                endAngle={-270}
                stroke="none"
                animationDuration={600}
                isAnimationActive
                onMouseEnter={(_, index) => setSurvole(allocation[index]?.poche ?? null)}
                onMouseLeave={() => setSurvole(null)}
              >
                {allocation.map((entree) => (
                  <Cell
                    key={entree.poche}
                    fill={entree.couleur}
                    opacity={survole === null || survole === entree.poche ? 1 : 0.3}
                    style={{ transition: 'opacity 160ms cubic-bezier(.2,.8,.2,1)' }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold tabular-nums">
              {discret ? `${MASK}${NBSP}€` : formatEUR(totalCents, { decimals: 0 })}
            </span>
            <span className="label-kpi mt-0.5">Total</span>
          </div>
        </div>

        <ul className="min-w-0 flex-1 space-y-2.5">
          {allocation.map((entree) => (
            <li
              key={entree.poche}
              onMouseEnter={() => setSurvole(entree.poche)}
              onMouseLeave={() => setSurvole(null)}
              className={cn(
                'rounded-[var(--radius-sm)] px-2 py-1.5 transition-opacity',
                survole !== null && survole !== entree.poche && 'opacity-45',
              )}
            >
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ background: entree.couleur }}
                  />
                  <span className="truncate">{entree.libelle}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-text-muted">
                  {formatPercent(entree.part)}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2"
                  role="presentation"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, entree.part * 100)}%`,
                      background: entree.couleur,
                    }}
                  />
                </div>
                <span className="shrink-0 font-mono text-[11px] tabular-nums text-text-subtle">
                  {discret ? MASK : formatEUR(entree.valeurCents, { decimals: 0 })}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
