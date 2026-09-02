import type { Metadata } from 'next';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import { ABONNEMENTS_DEMO, budgetDemo, CATEGORIES_DEMO } from '@/lib/demo/donnees';
import { calculerTauxEpargneCompare } from '@/lib/finance/epargne';
import { formatPercent } from '@/lib/money';

export const metadata: Metadata = {
  title: 'Budget',
  description: 'Combien tu épargnes réellement chaque mois.',
};

/**
 * Module budget (doc 02 § module 3).
 * Objectif : répondre à une seule question — combien j'épargne réellement chaque mois.
 */
export default function BudgetPage() {
  const historique = budgetDemo();
  const epargne = calculerTauxEpargneCompare(historique);
  const { mensuel, lisse12Mois, moisAtypique } = epargne.result;

  const totalDepenses = CATEGORIES_DEMO.reduce((s, c) => s + c.montantCents, 0);
  const coutAnnuelAbonnements = ABONNEMENTS_DEMO.reduce(
    (s, a) => s + a.montantMensuelCents * 12,
    0,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Budget</h1>
        <p className="mt-1.5 text-[14px] text-text-muted">
          Une seule question : combien tu épargnes réellement chaque mois.
        </p>
      </header>

      {/* La phrase de synthèse — la meilleure vulgarisation du taux d'épargne. */}
      <section className="carte p-5 sm:p-6">
        <p className="text-[17px] leading-relaxed">
          Ton taux d’épargne est de{' '}
          <span className="font-semibold text-primary">
            {formatPercent(lisse12Mois.tauxEpargne)}
          </span>{' '}
          sur douze mois. Revenus <Montant cents={lisse12Mois.revenusCents} decimals={0} />,
          dépenses <Montant cents={lisse12Mois.depensesCents} decimals={0} />, investi{' '}
          <Montant cents={lisse12Mois.investiCents} decimals={0} />, il reste{' '}
          <Montant cents={lisse12Mois.epargneLiquideCents} decimals={0} /> disponible.
        </p>

        {moisAtypique && (
          <p className="mt-4 rounded-[var(--radius)] border border-warning/30 bg-warning/8 p-3 text-[13px] leading-relaxed text-text-muted">
            <span className="font-medium text-text">Le dernier mois est atypique.</span> En
            Belgique, le pécule de vacances et la prime de fin d’année rendent deux mois par an
            non représentatifs. Fie-toi au taux lissé, pas au mois seul.
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteKPITexte
          label="Taux d’épargne lissé"
          valeur={formatPercent(lisse12Mois.tauxEpargne)}
          precision="Sur 12 mois — la seule vue comparable"
          accent
        />
        <CarteKPITexte
          label="Taux d’épargne du mois"
          valeur={formatPercent(mensuel.tauxEpargne)}
          precision={moisAtypique ? 'Mois atypique, à relativiser' : 'Mois représentatif'}
        />
        <CarteKPI
          label="Investi sur 12 mois"
          valeurCents={lisse12Mois.investiCents}
          precision="Dirigé vers des actifs de rendement"
        />
        <CarteKPI
          label="Abonnements"
          valeurCents={coutAnnuelAbonnements}
          precision={`${ABONNEMENTS_DEMO.length} abonnements détectés, coût annualisé`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Dépenses par catégorie</h2>
          <p className="mt-1 text-[12px] text-text-subtle">Dernier mois</p>

          <ul className="mt-4 space-y-3">
            {CATEGORIES_DEMO.map((cat) => {
              const part = totalDepenses > 0 ? cat.montantCents / totalDepenses : 0;
              return (
                <li key={cat.nom}>
                  <div className="flex items-baseline justify-between gap-3 text-[14px]">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 rounded-[3px]"
                        style={{ background: cat.couleur }}
                      />
                      {cat.nom}
                    </span>
                    <span className="flex items-baseline gap-2">
                      <Montant cents={cat.montantCents} decimals={0} />
                      <span className="w-11 text-right font-mono text-[12px] tabular-nums text-text-subtle">
                        {formatPercent(part)}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(1, part * 100)}%`, background: cat.couleur }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Abonnements détectés</h2>
          <p className="mt-1 text-[12px] text-text-subtle">
            Regroupés par libellé et périodicité, avec le coût annualisé
          </p>

          <ul className="mt-4 divide-y divide-border/50">
            {ABONNEMENTS_DEMO.map((abo) => (
              <li key={abo.nom} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-[14px]">{abo.nom}</p>
                  <p className="text-[12px] text-text-subtle">
                    <Montant cents={abo.montantMensuelCents} className="text-[12px]" /> par mois
                  </p>
                </div>
                <div className="text-right">
                  <Montant cents={abo.montantMensuelCents * 12} decimals={0} />
                  <p className="text-[11px] text-text-subtle">par an</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="carte overflow-hidden">
        <div className="px-5 py-4 sm:px-6">
          <h2 className="font-display text-[17px] font-semibold">Historique mensuel</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-[14px]">
            <caption className="sr-only">Revenus, dépenses et épargne par mois</caption>
            <thead>
              <tr className="border-y border-border text-left text-[12px] text-text-muted">
                <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Mois</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Revenus</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Dépenses</th>
                <th scope="col" className="px-3 py-2.5 text-right font-medium">Investi</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">
                  Taux d’épargne
                </th>
              </tr>
            </thead>
            <tbody>
              {[...historique].reverse().map((m) => {
                const taux = m.revenusCents > 0
                  ? (m.revenusCents - m.depensesCents) / m.revenusCents
                  : 0;
                return (
                  <tr key={m.mois} className="border-b border-border/40 last:border-0">
                    <td className="px-5 py-2.5 font-mono text-[13px] sm:px-6">{m.mois}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Montant cents={m.revenusCents} decimals={0} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Montant cents={-m.depensesCents} decimals={0} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Montant cents={m.investiCents} decimals={0} />
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums sm:px-6">
                      {formatPercent(taux)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <PanneauExplication calcul={epargne} titre="Comment le taux d’épargne est calculé" />
    </div>
  );
}
