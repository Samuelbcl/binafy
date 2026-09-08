'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useDiscretion } from '@/components/providers';
import { cn } from '@/lib/cn';
import { formatEUR, formatEURCompact, MASK, NBSP } from '@/lib/money';
import type { PointHistorique } from '@/lib/patrimoine/types';

/**
 * Courbe d'évolution du patrimoine net (doc 05 § graphique d'évolution).
 *
 * Aire avec dégradé vertical de l’accent, ligne 2px, courbe monotone, grille
 * horizontale seule en pointillés. L'animation ne joue qu'au montage.
 */

export type Periode = '1M' | '3M' | '6M' | 'YTD' | '1A' | 'TOUT';

const PERIODES: { cle: Periode; libelle: string; mois: number | null }[] = [
  { cle: '1M', libelle: '1M', mois: 1 },
  { cle: '3M', libelle: '3M', mois: 3 },
  { cle: '6M', libelle: '6M', mois: 6 },
  { cle: 'YTD', libelle: 'YTD', mois: null },
  { cle: '1A', libelle: '1A', mois: 12 },
  { cle: 'TOUT', libelle: 'Tout', mois: null },
];

function formatDateCourte(iso: string): string {
  const [, mois = '01', jour = '01'] = iso.split('-');
  const noms = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${jour} ${noms[Number(mois) - 1] ?? ''}`;
}

function formatMoisAnnee(iso: string): string {
  const [annee = '', mois = '01'] = iso.split('-');
  const noms = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  return `${noms[Number(mois) - 1] ?? ''} ${annee.slice(2)}`;
}

type InfobulleProps = {
  active?: boolean;
  payload?: readonly { payload?: PointHistorique }[];
};

function Infobulle({ active, payload, discret }: InfobulleProps & { discret: boolean }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-[11px] text-text-muted">{formatMoisAnnee(point.date)}</p>
      <p className="mt-0.5 font-mono text-[15px] font-medium tabular-nums">
        {discret ? `${MASK}${NBSP}€` : formatEUR(point.netCents, { decimals: 0 })}
      </p>
      {!discret && (
        <p className="mt-1 text-[11px] text-text-subtle">
          Actifs {formatEURCompact(point.actifsCents)} · Passifs{' '}
          {formatEURCompact(point.passifsCents)}
        </p>
      )}
    </div>
  );
}

export function CourbePatrimoine({
  historique,
  className,
}: {
  historique: PointHistorique[];
  className?: string;
}) {
  const [periode, setPeriode] = useState<Periode>('1A');
  const { discret } = useDiscretion();

  const donnees = useMemo(() => {
    const config = PERIODES.find((p) => p.cle === periode);
    if (!config || periode === 'TOUT') return historique;

    if (periode === 'YTD') {
      const dernier = historique[historique.length - 1];
      const annee = dernier?.date.slice(0, 4);
      return historique.filter((p) => p.date.slice(0, 4) === annee);
    }

    return config.mois ? historique.slice(-config.mois) : historique;
  }, [historique, periode]);

  return (
    <div className={cn('carte p-5 sm:p-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px]">Évolution du patrimoine net</h3>

        <div
          role="tablist"
          aria-label="Période affichée"
          className="flex gap-0.5 rounded-[var(--radius)] bg-surface-2 p-1"
        >
          {PERIODES.map(({ cle, libelle }) => (
            <button
              key={cle}
              type="button"
              role="tab"
              aria-selected={periode === cle}
              onClick={() => setPeriode(cle)}
              className={cn(
                'rounded-[8px] px-2.5 py-1.5 text-[12px] font-medium transition-colors',
                periode === cle
                  ? 'bg-surface text-text shadow-[var(--shadow-card)]'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {libelle}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 h-[260px] w-full sm:h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={donnees} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="degradePatrimoine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.38} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatMoisAnnee}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
              minTickGap={28}
            />
            <YAxis
              tickFormatter={(v: number) => (discret ? MASK : formatEURCompact(v))}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
              width={64}
              domain={['dataMin - 5000', 'dataMax + 5000']}
            />
            <Tooltip
              content={({ active, payload }) => (
                <Infobulle
                  active={active}
                  payload={payload as unknown as InfobulleProps['payload']}
                  discret={discret}
                />
              )}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="netCents"
              stroke="var(--primary)"
              strokeWidth={2}
              fill="url(#degradePatrimoine)"
              activeDot={{
                r: 4,
                fill: 'var(--primary)',
                stroke: 'var(--bg)',
                strokeWidth: 3,
              }}
              // Une seule animation, au montage. Jamais à chaque re-render.
              animationDuration={600}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tableau accessible, doublure du graphique (doc 05 § accessibilité). */}
      <details className="mt-3">
        <summary className="cursor-pointer text-[12px] text-text-muted hover:text-text">
          Voir les données
        </summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full text-[12px]">
            <caption className="sr-only">Évolution du patrimoine net par mois</caption>
            <thead className="text-left text-text-muted">
              <tr>
                <th scope="col" className="py-1.5 font-medium">Date</th>
                <th scope="col" className="py-1.5 text-right font-medium">Patrimoine net</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {donnees.map((point) => (
                <tr key={point.date} className="border-t border-border/50">
                  <td className="py-1.5 font-sans">{formatDateCourte(point.date)}</td>
                  <td className="py-1.5 text-right">
                    {discret ? `${MASK}${NBSP}€` : formatEUR(point.netCents, { decimals: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
