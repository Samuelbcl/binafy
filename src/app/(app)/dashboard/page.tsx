import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CourbePatrimoine } from '@/components/charts/courbe-patrimoine';
import { DonutAllocation } from '@/components/charts/donut-allocation';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Montant, Variation } from '@/components/ui/montant';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import {
  ACTIFS_DEMO,
  allocationDemo,
  budgetDemo,
  historiqueDemo,
  MOUVEMENTS_DEMO,
  patrimoineNetCents,
  PROFIL_DEMO,
  totalActifsCents,
  totalPassifsCents,
  variationJourCents,
} from '@/lib/demo/donnees';
import { calculerTauxEpargneCompare } from '@/lib/finance/epargne';
import { formatPercent } from '@/lib/money';
import { calculerImpotLatent } from '@/lib/tax/plus-values';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

export const metadata: Metadata = {
  title: 'Vue d’ensemble',
  description: 'Ton patrimoine net, son évolution et sa répartition.',
};

/**
 * Dashboard (doc 02 § module 1).
 *
 * Objectif : en 5 secondes, savoir si ça monte ou si ça descend, et pourquoi.
 * Server Component, avec des îlots clients pour les graphiques (doc 03 § performance).
 */
export default function DashboardPage() {
  const net = patrimoineNetCents();
  const variation = variationJourCents();
  const historique = historiqueDemo();
  const allocation = allocationDemo();

  const epargne = calculerTauxEpargneCompare(budgetDemo());

  // Le KPI signature : patrimoine net d'impôt latent. Personne d'autre ne le fait.
  const impotLatent = calculerImpotLatent(
    {
      positions: ACTIFS_DEMO.filter((a) => a.supportTOB !== undefined).map((a) => ({
        id: a.id,
        nom: a.nom,
        valeurActuelleCents: Math.round(a.valeurCents * (a.quotePart / 100)),
        prixAcquisitionCents: a.prixAcquisitionCents ?? null,
        valeurReference2025Cents: a.valeurReference2025Cents ?? null,
        dateAcquisition: a.dateAcquisition ?? null,
        supportTOB: a.supportTOB ?? null,
      })),
    },
    TAX_PARAMS_2026,
  );

  const ratioVariation = net > 0 ? variation / net : 0;

  // Revenus passifs projetés : intérêts d'épargne et dividendes attendus sur 12 mois.
  const revenusPassifs12Mois = ACTIFS_DEMO.reduce((somme, a) => {
    if (a.classe === 'compte_epargne' && a.tauxBase !== undefined) {
      const taux = (a.tauxBase + (a.primeFidelite ?? 0)) / 100;
      return somme + Math.round(a.valeurCents * taux);
    }
    return somme;
  }, 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="label-kpi">Bonsoir {PROFIL_DEMO.prenom}</p>
        <h1 className="mt-3 chiffre-hero">
          <Montant cents={net} decimals={2} />
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Variation cents={variation} ratio={ratioVariation} decimals={2} />
          <span className="text-[13px] text-text-subtle">sur la journée</span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CarteKPI
          label="Patrimoine net d’impôt latent"
          valeurCents={net - impotLatent.result.impotLatentCents}
          precision={`Après ${formatPercent(
            net > 0 ? impotLatent.result.impotLatentCents / net : 0,
          )} d’impôt si tu liquidais tout aujourd’hui`}
          accent
        />
        <CarteKPITexte
          label="Taux d’épargne lissé"
          valeur={formatPercent(epargne.result.lisse12Mois.tauxEpargne)}
          precision={`Sur 12 mois. Le mois seul afficherait ${formatPercent(
            epargne.result.mensuel.tauxEpargne,
          )}.`}
        />
        <CarteKPI
          label="Revenus passifs projetés"
          valeurCents={revenusPassifs12Mois}
          precision="Intérêts d’épargne attendus sur 12 mois, avant précompte"
        />
        <CarteKPI
          label="Impôt latent"
          valeurCents={impotLatent.result.impotLatentCents}
          precision={`Plus-values et TOB de sortie sur ${impotLatent.result.lignes.length} positions`}
        />
      </div>

      <CourbePatrimoine historique={historique} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <DonutAllocation allocation={allocation} totalCents={totalActifsCents()} />

        <section className="carte p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[17px] font-semibold">Ce qui a bougé</h2>
            <Link
              href="/patrimoine"
              className="inline-flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-primary"
            >
              Tout voir
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-border/50">
            {MOUVEMENTS_DEMO.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[14px]">{m.libelle}</p>
                  <p className="text-[12px] text-text-subtle">{m.detail}</p>
                </div>
                <Montant
                  cents={m.montantCents}
                  sign="always"
                  decimals={2}
                  colore
                  className="shrink-0 text-[14px]"
                />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Actifs et passifs</h2>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Total des actifs</dt>
              <dd>
                <Montant cents={totalActifsCents()} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Total des passifs</dt>
              <dd>
                <Montant cents={-totalPassifsCents()} />
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3 font-medium">
              <dt>Patrimoine net</dt>
              <dd>
                <Montant cents={net} />
              </dd>
            </div>
          </dl>
        </section>

        <PanneauExplication
          calcul={impotLatent}
          titre="D’où vient l’impôt latent"
          className="self-start"
        />
      </div>
    </div>
  );
}
