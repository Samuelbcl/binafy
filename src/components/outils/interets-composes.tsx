'use client';

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChampBascule, ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import {
  MentionInformative,
  PanneauExplication,
} from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { euros, formatEUR, formatEURCompact } from '@/lib/money';
import { calculerInteretsComposesNets } from '@/lib/finance/interets-composes';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

/**
 * Calculateur d'intérêts composés (doc 07 § 1).
 *
 * Paramètres d'URL alignés sur les conventions du marché, pour la lisibilité :
 * `?capital_initial=10000&epargne_mensuelle=100&horizon=20&taux=5`
 */

export type ValeursInterets = {
  capital_initial: number;
  epargne_mensuelle: number;
  horizon: number;
  taux: number;
  inflation: number;
  net: boolean;
};

export function OutilInteretsComposes({ initiales }: { initiales: ValeursInterets }) {
  const [v, definir] = useEtatUrl(initiales);
  const netImpot = v.net;

  const calcul = useMemo(
    () =>
      calculerInteretsComposesNets(
        {
          capitalInitialCents: euros(v.capital_initial),
          versementCents: euros(v.epargne_mensuelle),
          horizonAnnees: v.horizon,
          tauxAnnuelPourcent: v.taux,
          inflationPourcent: v.inflation,
          periodicite: 'mensuelle',
        },
        TAX_PARAMS_2026,
      ),
    [v.capital_initial, v.epargne_mensuelle, v.horizon, v.taux, v.inflation],
  );

  const { result } = calcul;
  const valeurAffichee = netImpot ? result.valeurFinaleNetteCents : result.valeurFinaleCents;

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Capital initial"
            valeur={v.capital_initial}
            onChange={(x) => definir('capital_initial', x)}
            suffixe="€"
            pas={1_000}
          />
          <ChampNombre
            label="Épargne mensuelle"
            valeur={v.epargne_mensuelle}
            onChange={(x) => definir('epargne_mensuelle', x)}
            suffixe="€"
            pas={50}
          />
          <ChampNombre
            label="Horizon"
            valeur={v.horizon}
            onChange={(x) => definir('horizon', x)}
            suffixe="ans"
            min={1}
            max={60}
          />
          <ChampNombre
            label="Rendement annuel"
            valeur={v.taux}
            onChange={(x) => definir('taux', x)}
            suffixe="%"
            pas={0.5}
          />
          <ChampNombre
            label="Inflation"
            valeur={v.inflation}
            onChange={(x) => definir('inflation', x)}
            suffixe="%"
            pas={0.5}
            aide="Pour afficher le résultat en euros d’aujourd’hui."
          />
          <ChampBascule
            label="Net de fiscalité belge"
            valeur={netImpot}
            onChange={(x) => definir('net', x)}
            aide="Taxe de 10 % sur les plus-values, exonération annuelle de 10 000 € déduite."
          />
        </div>
      </section>

      <section className="carte p-5 sm:p-6">
        <p className="label-kpi">
          {netImpot ? 'Valeur finale nette d’impôt' : 'Valeur finale brute'}
        </p>
        <p className="mt-2 chiffre-hero text-primary">
          <Montant cents={valeurAffichee} decimals={0} jamaisMasque />
        </p>
        <p className="mt-2 text-[13px] text-text-muted">
          soit{' '}
          <Montant
            cents={netImpot ? result.valeurFinaleNetteReelleCents : result.valeurFinaleReelleCents}
            decimals={0}
            jamaisMasque
          />{' '}
          en euros d’aujourd’hui — c’est le chiffre qui compte.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="label-kpi">Total versé</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums">
              {formatEUR(result.totalVerseCents, { decimals: 0 })}
            </dd>
          </div>
          <div>
            <dt className="label-kpi">Plus-values</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums text-positive">
              {formatEUR(result.plusValuesCents, { decimals: 0, sign: 'always' })}
            </dd>
          </div>
          <div>
            <dt className="label-kpi">Taxe sur les plus-values</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums">
              {formatEUR(-result.taxePlusValuesCents, { decimals: 0 })}
            </dd>
          </div>
        </dl>

        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={result.courbe}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
              stackOffset="none"
            >
              <defs>
                <linearGradient id="degradeVerse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--data-8)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--data-8)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="degradePlusValues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.05} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="annee"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                tickFormatter={(v: number) => `${v} an${v > 1 ? 's' : ''}`}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                tickFormatter={(v: number) => formatEURCompact(v)}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'var(--text-muted)' }}
                labelFormatter={(v) => `Année ${v}`}
                formatter={(valeur, nom) => [
                  formatEUR(typeof valeur === 'number' ? valeur : 0, { decimals: 0 }),
                  String(nom),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
              />
              <Area
                type="monotone"
                dataKey="verseCents"
                name="Versé"
                stackId="1"
                stroke="var(--data-8)"
                strokeWidth={1.5}
                fill="url(#degradeVerse)"
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="plusValuesCents"
                name="Plus-values"
                stackId="1"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#degradePlusValues)"
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <PanneauExplication calcul={calcul} />

      <section className="carte overflow-hidden">
        <details>
          <summary className="cursor-pointer px-5 py-3.5 text-[14px] font-medium hover:bg-surface-hover">
            Tableau annuel
          </summary>
          <div className="max-h-96 overflow-auto border-t border-border">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Évolution annuelle du capital</caption>
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-[12px] text-text-muted">
                  <th scope="col" className="px-5 py-2 font-medium">Année</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Versé</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Plus-values</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {result.courbe.map((point) => (
                  <tr key={point.annee} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-1.5">{point.annee}</td>
                    <td className="px-3 py-1.5 text-right">
                      {formatEUR(point.verseCents, { decimals: 0 })}
                    </td>
                    <td className="px-3 py-1.5 text-right text-positive">
                      {formatEUR(point.plusValuesCents, { decimals: 0 })}
                    </td>
                    <td className="px-5 py-1.5 text-right font-medium">
                      {formatEUR(point.valeurCents, { decimals: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <MentionInformative />
    </div>
  );
}
