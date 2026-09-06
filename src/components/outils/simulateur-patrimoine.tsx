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
import { ChampNombre } from '@/components/ui/champs';
import { Montant } from '@/components/ui/montant';
import { MentionInformative, PanneauExplication } from '@/components/ui/panneau-explication';
import { useEtatUrl } from '@/lib/use-etat-url';
import { calculerProjectionPatrimoine } from '@/lib/finance/projection';
import { euros, formatEUR, formatEURCompact } from '@/lib/money';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

/**
 * Simulateur de patrimoine (doc 07 § 2).
 *
 * Les deux courbes, nominale et réelle, sont affichées ensemble : un patrimoine
 * de 500 000 € dans 20 ans avec 2 % d'inflation ne vaut pas 500 000 € d'aujourd'hui,
 * et c'est l'information la plus utile du simulateur.
 */

export type ValeursPatrimoine = {
  patrimoine: number;
  part_actions: number;
  investissement: number;
  horizon: number;
  rendement_actions: number;
  rendement_autres: number;
  fiscalite_actions: number;
  fiscalite_autres: number;
  taux_retrait: number;
  inflation: number;
  depenses: number;
};

export function OutilSimulateurPatrimoine({ initiales }: { initiales: ValeursPatrimoine }) {
  // Valeurs venues du serveur : la projection est dans le HTML, pas seulement
  // dans le navigateur.
  const [v, definir] = useEtatUrl(initiales);

  const calcul = useMemo(
    () =>
      calculerProjectionPatrimoine(
        {
          patrimoineActuelCents: euros(v.patrimoine),
          partActionsPourcent: v.part_actions,
          investissementAnnuelCents: euros(v.investissement),
          horizonAnnees: v.horizon,
          rendementActionsPourcent: v.rendement_actions,
          rendementAutresPourcent: v.rendement_autres,
          fiscaliteActionsPourcent: v.fiscalite_actions,
          fiscaliteAutresPourcent: v.fiscalite_autres,
          tauxRetraitPourcent: v.taux_retrait,
          inflationPourcent: v.inflation,
          depensesAnnuellesCents: euros(v.depenses),
        },
        TAX_PARAMS_2026,
      ),
    [
      v.patrimoine,
      v.part_actions,
      v.investissement,
      v.horizon,
      v.rendement_actions,
      v.rendement_autres,
      v.fiscalite_actions,
      v.fiscalite_autres,
      v.taux_retrait,
      v.inflation,
      v.depenses,
    ],
  );

  const { result } = calcul;

  return (
    <div className="space-y-6">
      <section className="carte p-5 sm:p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ChampNombre
            label="Patrimoine actuel"
            valeur={v.patrimoine}
            onChange={(x) => definir('patrimoine', x)}
            suffixe="€"
            pas={5_000}
          />
          <ChampNombre
            label="Part en actions"
            valeur={v.part_actions}
            onChange={(x) => definir('part_actions', x)}
            suffixe="%"
            max={100}
            aide="Le reste est supposé placé sur des supports moins rémunérateurs."
          />
          <ChampNombre
            label="Investissement annuel"
            valeur={v.investissement}
            onChange={(x) => definir('investissement', x)}
            suffixe="€"
            pas={500}
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
            label="Rendement actions"
            valeur={v.rendement_actions}
            onChange={(x) => definir('rendement_actions', x)}
            suffixe="%"
            pas={0.5}
          />
          <ChampNombre
            label="Rendement du reste"
            valeur={v.rendement_autres}
            onChange={(x) => definir('rendement_autres', x)}
            suffixe="%"
            pas={0.5}
          />
          <ChampNombre
            label="Fiscalité actions"
            valeur={v.fiscalite_actions}
            onChange={(x) => definir('fiscalite_actions', x)}
            suffixe="%"
            pas={1}
            aide="10 % : taxe belge sur les plus-values, hors exonération annuelle."
          />
          <ChampNombre
            label="Fiscalité du reste"
            valeur={v.fiscalite_autres}
            onChange={(x) => definir('fiscalite_autres', x)}
            suffixe="%"
            pas={1}
            aide="30 % : précompte mobilier belge."
          />
          <ChampNombre
            label="Taux de retrait"
            valeur={v.taux_retrait}
            onChange={(x) => definir('taux_retrait', x)}
            suffixe="%"
            pas={0.5}
            aide="Part du capital retirée chaque année une fois l’horizon atteint."
          />
          <ChampNombre
            label="Inflation"
            valeur={v.inflation}
            onChange={(x) => definir('inflation', x)}
            suffixe="%"
            pas={0.5}
          />
          <ChampNombre
            label="Tes dépenses annuelles actuelles"
            valeur={v.depenses}
            onChange={(x) => definir('depenses', x)}
            suffixe="€"
            pas={1_000}
            className="sm:col-span-2"
            aide="Sert à dater l’année où la rente les couvrirait."
          />
        </div>
      </section>

      <section className="carte p-5 sm:p-6">
        <p className="label-kpi">Patrimoine dans {v.horizon} ans, en euros d’aujourd’hui</p>
        <p className="mt-2 chiffre-hero text-primary">
          <Montant cents={result.patrimoineFinalReelCents} decimals={0} jamaisMasque />
        </p>
        <p className="mt-2 text-[13px] text-text-muted">
          soit <Montant cents={result.patrimoineFinalCents} decimals={0} jamaisMasque /> en
          euros courants — c’est le premier chiffre qui impressionne, le second qui compte.
        </p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="label-kpi">Total investi</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums">
              {formatEUR(result.totalInvestiCents, { decimals: 0 })}
            </dd>
          </div>
          <div>
            <dt className="label-kpi">Rendements nets</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums text-positive">
              {formatEUR(result.rendementsCumulesCents, { decimals: 0, sign: 'always' })}
            </dd>
          </div>
          <div>
            <dt className="label-kpi">Rente mensuelle soutenable</dt>
            <dd className="mt-1.5 font-mono text-[18px] tabular-nums">
              {formatEUR(result.renteMensuelleReelleCents, { decimals: 0 })}
            </dd>
          </div>
        </dl>

        {result.anneeIndependance !== null && (
          <p className="mt-5 rounded-[var(--radius)] border border-primary/25 bg-primary-soft p-3.5 text-[14px] leading-relaxed">
            Au bout de <span className="font-semibold">{result.anneeIndependance} ans</span>, la
            rente soutenable couvrirait tes dépenses actuelles de{' '}
            {formatEUR(euros(v.depenses), { decimals: 0 })} par an.
          </p>
        )}

        <div className="mt-6 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={result.courbe} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="degradeNominal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="degradeReel" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--data-2)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--data-2)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="annee"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--text-subtle)', fontSize: 11 }}
                tickFormatter={(v: number) => `${v} an${v > 1 ? 's' : ''}`}
                minTickGap={28}
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
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }} />
              <Area
                type="monotone"
                dataKey="patrimoineCents"
                name="En euros courants"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="url(#degradeNominal)"
                animationDuration={600}
              />
              <Area
                type="monotone"
                dataKey="patrimoineReelCents"
                name="En euros d’aujourd’hui"
                stroke="var(--data-2)"
                strokeWidth={2}
                strokeDasharray="4 3"
                fill="url(#degradeReel)"
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
              <caption className="sr-only">Évolution annuelle du patrimoine</caption>
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-[12px] text-text-muted">
                  <th scope="col" className="px-5 py-2 font-medium">Année</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Investi</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Nominal</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Réel</th>
                  <th scope="col" className="px-5 py-2 text-right font-medium">Rente/mois</th>
                </tr>
              </thead>
              <tbody className="font-mono tabular-nums">
                {result.courbe.map((point) => (
                  <tr key={point.annee} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-1.5">{point.annee}</td>
                    <td className="px-3 py-1.5 text-right text-text-muted">
                      {formatEUR(point.investiCents, { decimals: 0 })}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {formatEUR(point.patrimoineCents, { decimals: 0 })}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium">
                      {formatEUR(point.patrimoineReelCents, { decimals: 0 })}
                    </td>
                    <td className="px-5 py-1.5 text-right text-text-muted">
                      {formatEUR(point.renteMensuelleReelleCents, { decimals: 0 })}
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
