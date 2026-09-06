import type { Metadata } from 'next';
import { Upload } from 'lucide-react';
import { SankeyBudget } from '@/components/charts/sankey-budget';
import { ImportCSV } from '@/components/budget/import-csv';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import { chargerBudget, construireFluxSankey } from '@/lib/db/budget';
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
export default async function BudgetPage() {
  const budget = await chargerBudget();

  if (budget.nombreTransactions === 0) {
    return <EtatVide />;
  }

  const epargne = calculerTauxEpargneCompare(budget.mois);
  const { mensuel, lisse12Mois, moisAtypique } = epargne.result;

  const totalDepenses = budget.categories.reduce((s, c) => s + c.montantCents, 0);
  const coutAnnuelAbonnements = budget.abonnements.reduce((s, a) => s + a.coutAnnuelCents, 0);
  const flux = construireFluxSankey(budget);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-tight">Budget</h1>
          <p className="mt-1.5 text-[14px] text-text-muted">
            Une seule question : combien tu épargnes réellement chaque mois.
          </p>
        </div>
        {!budget.demo && <ImportCSV />}
      </header>

      {/* La phrase de synthèse — la meilleure vulgarisation du taux d'épargne. */}
      <section className="carte p-5 sm:p-6">
        <p className="text-[17px] leading-relaxed">
          Ton taux d’épargne est de{' '}
          <span className="font-semibold text-primary">
            {formatPercent(lisse12Mois.tauxEpargne)}
          </span>{' '}
          sur {lisse12Mois.moisComptes} mois. Revenus{' '}
          <Montant cents={lisse12Mois.revenusCents} decimals={0} />, dépenses{' '}
          <Montant cents={lisse12Mois.depensesCents} decimals={0} />, investi{' '}
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
          precision="La seule vue comparable d’une période à l’autre"
          accent
        />
        <CarteKPITexte
          label="Taux d’épargne du mois"
          valeur={formatPercent(mensuel.tauxEpargne)}
          precision={moisAtypique ? 'Mois atypique, à relativiser' : 'Mois représentatif'}
        />
        <CarteKPI
          label="Investi sur la période"
          valeurCents={lisse12Mois.investiCents}
          precision="Dirigé vers des actifs de rendement"
        />
        <CarteKPI
          label="Abonnements"
          valeurCents={coutAnnuelAbonnements}
          precision={`${budget.abonnements.length} détectés, coût annualisé`}
        />
      </div>

      <SankeyBudget flux={flux} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Dépenses par catégorie</h2>
          <p className="mt-1 text-[12px] text-text-subtle">
            {budget.mois[budget.mois.length - 1]?.mois ?? 'Dernier mois'}
          </p>

          {budget.categories.length === 0 ? (
            <p className="mt-4 text-[13px] text-text-muted">
              Aucune dépense catégorisée sur le dernier mois.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {budget.categories.map((cat) => {
                const part = totalDepenses > 0 ? cat.montantCents / totalDepenses : 0;
                return (
                  <li key={cat.cle}>
                    <div className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-[3px]"
                          style={{ background: cat.couleur }}
                        />
                        <span className="truncate">{cat.nom}</span>
                      </span>
                      <span className="flex shrink-0 items-baseline gap-2">
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
          )}
        </section>

        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Abonnements détectés</h2>
          <p className="mt-1 text-[12px] text-text-subtle">
            Regroupés par libellé et périodicité, avec le coût annualisé
          </p>

          {budget.abonnements.length === 0 ? (
            <p className="mt-4 text-[13px] leading-relaxed text-text-muted">
              Aucun abonnement détecté. Il en faut au moins trois mensualités stables pour
              qu’une dépense soit reconnue comme récurrente.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/50">
              {budget.abonnements.slice(0, 8).map((abo) => (
                <li key={abo.libelle} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px]">{abo.libelle}</p>
                    <p className="text-[12px] text-text-subtle">
                      <Montant cents={abo.montantMensuelCents} className="text-[12px]" /> par mois
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Montant cents={abo.coutAnnuelCents} decimals={0} />
                    <p className="text-[11px] text-text-subtle">par an</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
              {[...budget.mois].reverse().map((m) => {
                const taux =
                  m.revenusCents > 0 ? (m.revenusCents - m.depensesCents) / m.revenusCents : 0;
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

      {budget.imports.length > 0 && (
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Imports récents</h2>
          <ul className="mt-4 divide-y divide-border/50 text-[13px]">
            {budget.imports.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-4 py-2.5">
                <span className="min-w-0 truncate">{i.nomFichier}</span>
                <span className="shrink-0 text-text-subtle">
                  {i.lignesImportees} importées
                  {i.lignesIgnorees > 0 && `, ${i.lignesIgnorees} ignorées`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PanneauExplication calcul={epargne} titre="Comment le taux d’épargne est calculé" />
    </div>
  );
}

/** État vide : un budget sans transaction ne doit pas montrer de faux chiffres. */
function EtatVide() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Budget</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-muted">
          Importe un extrait bancaire et tu sauras ton taux d’épargne réel des douze derniers
          mois, sans le calculer à la main.
        </p>
      </header>

      <section className="carte p-6 text-center">
        <Upload className="mx-auto size-6 text-primary" />
        <h2 className="mt-4 font-display text-[17px] font-semibold">
          Aucune transaction pour l’instant
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-text-muted">
          Exporte tes opérations en CSV depuis ton application bancaire. Les colonnes sont
          détectées automatiquement, les enseignes belges catégorisées, et les doublons
          écartés si tu réimportes le même fichier.
        </p>
        <div className="mt-5 flex justify-center">
          <ImportCSV />
        </div>
      </section>

      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-semibold">Pourquoi le CSV d’abord</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          La connexion bancaire automatique viendra, mais elle casse : un consentement PSD2
          expire tous les 90 jours, c’est structurel. L’import CSV fonctionne toujours, avec
          n’importe quelle banque belge, et il donne l’essentiel de la valeur tout de suite.
        </p>
      </section>
    </div>
  );
}
