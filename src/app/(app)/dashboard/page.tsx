import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { CourbePatrimoine } from '@/components/charts/courbe-patrimoine';
import { DonutAllocation } from '@/components/charts/donut-allocation';
import { CarteHero } from '@/components/ui/carte-hero';
import { CarteKPI, CarteKPITexte } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import { budgetDemo, MOUVEMENTS_DEMO, PROFIL_DEMO } from '@/lib/demo/donnees';
import { calculerTauxEpargneCompare } from '@/lib/finance/epargne';
import { formatPercent } from '@/lib/money';
import {
  allocation,
  patrimoineNet,
  totalActifs,
  totalPassifs,
  valeurQuotePart,
  variationJour,
} from '@/lib/patrimoine/types';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { calculerImpotLatent } from '@/lib/tax/plus-values';
import { EtatVide } from '@/components/ui/etat-vide';
import { SectionEcran } from '@/components/ui/section-ecran';

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
export default async function DashboardPage() {
  const { actifs, passifs, historique, demo } = await chargerPatrimoine();

  const net = patrimoineNet(actifs, passifs);
  const variation = variationJour(actifs);
  const ratioVariation = net > 0 ? variation / net : 0;

  // Le KPI signature : patrimoine net d'impôt latent. Personne d'autre ne le fait.
  const impotLatent = calculerImpotLatent(
    {
      positions: actifs.map((a) => ({
        id: a.id,
        nom: a.nom,
        valeurActuelleCents: valeurQuotePart(a),
        prixAcquisitionCents: a.prixAcquisitionCents ?? null,
        valeurReference2025Cents: a.valeurReference2025Cents ?? null,
        dateAcquisition: a.dateAcquisition ?? null,
        supportTOB: a.supportTOB ?? null,
      })),
    },
    TAX_PARAMS_2026,
  );

  // Intérêts d'épargne attendus sur 12 mois, avant précompte.
  const revenusPassifs12Mois = actifs.reduce((somme, a) => {
    if (a.classe !== 'compte_epargne' || a.tauxBase == null) return somme;
    const taux = (a.tauxBase + (a.primeFidelite ?? 0)) / 100;
    return somme + Math.round(valeurQuotePart(a) * taux);
  }, 0);

  // Le budget n'est pas encore persisté : il reste sur le jeu de démo.
  const epargne = calculerTauxEpargneCompare(budgetDemo());

  // Premier écran après inscription : pas de graphique vide et triste (doc 02).
  if (actifs.length === 0 && passifs.length === 0) {
    return <PremierEcran />;
  }

  return (
    <div className="mx-auto max-w-6xl">
      {demo && (
        <p className="mb-4 text-[13px] text-text-muted">Bonsoir {PROFIL_DEMO.prenom}</p>
      )}

      <CarteHero
        label="Patrimoine net"
        valeurCents={net}
        metriques={[
          {
            cle: 'net',
            label: 'Patrimoine net',
            valeurCents: net,
            precision:
              'Ce que tu possèdes moins ce que tu dois. C’est le chiffre qui compte au quotidien.',
          },
          {
            cle: 'brut',
            label: 'Patrimoine brut',
            valeurCents: totalActifs(actifs),
            precision:
              'Tes actifs seuls, dettes non déduites. C’est ce que la plupart des applications affichent sans le dire.',
          },
          {
            cle: 'net_impot',
            label: 'Net d’impôt latent',
            valeurCents: net - impotLatent.result.impotLatentCents,
            precision:
              'Ce qu’il te resterait après taxe si tu vendais tout aujourd’hui. Personne d’autre ne te le montre.',
          },
        ]}
        variationCents={variation}
        ratioVariation={variation === 0 ? undefined : ratioVariation}
        mentionVariation={
          variation === 0 ? 'aucune cotation depuis la dernière clôture' : 'sur la journée'
        }
      />

      <SectionEcran
        titre="Où j’en suis"
        sousTitre="Les trois chiffres qui résument ta situation, au-delà du montant total."
        className="mt-8"
      >
      <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:[&>*:last-child:nth-child(odd)]:col-span-1 sm:gap-4 lg:grid-cols-3">
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
      </div>
      </SectionEcran>

      <SectionEcran
        titre="Comment ça évolue"
        sousTitre="Ce qui a changé depuis hier, et la trajectoire des derniers mois."
      >
      {historique.length > 1 ? (
        <CourbePatrimoine historique={historique} />
      ) : (
        <section className="carte p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Évolution du patrimoine net</h2>
          <EtatVide
            titre="Ta courbe commence demain"
            texte="Nestor photographie ton patrimoine une fois par jour. Il faut deux points pour tracer une ligne : reviens dans quelques jours, elle sera là — et elle n’aura plus jamais de trou."
          />
        </section>
      )}

      <section className="carte mt-4 p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-bold">Ce qui a bougé aujourd’hui</h3>
            <Link
              href="/patrimoine"
              className="inline-flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-primary"
            >
              Tout voir
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {demo ? (
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
          ) : (
            <EtatVide
              dense
              titre="Rien n’a encore bougé"
              texte="Dès qu’une cotation change ou qu’un import de transactions arrive, les variations de la journée s’affichent ici — la plus forte en premier."
            />
          )}
      </section>
      </SectionEcran>

      <SectionEcran
        titre="Ce que je possède"
        sousTitre="La répartition de tes actifs, et le détail de ce qui compose le total."
      >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <DonutAllocation allocation={allocation(actifs)} totalCents={totalActifs(actifs)} />

        <section className="carte p-5 sm:p-6">
          <h3 className="text-[15px] font-bold">Actifs et passifs</h3>
          <dl className="mt-4 space-y-3 text-[14px]">
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Total des actifs</dt>
              <dd>
                <Montant cents={totalActifs(actifs)} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-muted">Total des passifs</dt>
              <dd>
                <Montant cents={-totalPassifs(passifs)} />
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

      </div>
      </SectionEcran>

      <SectionEcran
        titre="Ce que ça me coûterait"
        sousTitre="L’impôt qui dort dans tes plus-values. Il ne se paie qu’à la vente — mais il existe déjà."
      >
        <div className="grid gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <CarteKPI
            label="Impôt latent"
            valeurCents={impotLatent.result.impotLatentCents}
            precision={`${formatPercent(
              net > 0 ? impotLatent.result.impotLatentCents / net : 0,
            )} de ton patrimoine, sur ${impotLatent.result.lignes.length} positions`}
          />
          <PanneauExplication
            calcul={impotLatent}
            titre="Voir le calcul, ligne par ligne"
            className="self-start"
          />
        </div>
      </SectionEcran>
    </div>
  );
}

/**
 * État vide du dashboard (doc 02 § module 1).
 * C'est le premier écran après inscription : pas de graphique vide et triste,
 * mais un parcours qui dit quoi faire.
 */
function PremierEcran() {
  const etapes = [
    {
      titre: 'Saisir manuellement',
      texte:
        'Un compte, un ETF, un crédit. C’est le plus rapide pour voir à quoi ressemble ton patrimoine consolidé.',
      href: '/patrimoine',
      libelle: 'Ajouter un actif',
      disponible: true,
    },
    {
      titre: 'Importer un CSV',
      texte:
        'Tes extraits bancaires, avec un mapping de colonnes. C’est ce qui donne le budget et le taux d’épargne réel.',
      href: '/budget',
      libelle: 'Bientôt',
      disponible: false,
    },
    {
      titre: 'Connecter une banque',
      texte:
        'Synchronisation PSD2, en lecture seule. Elle arrive après, parce que l’app doit déjà être utile sans.',
      href: '/parametres',
      libelle: 'Bientôt',
      disponible: false,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">
          Ton patrimoine est vide
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-text-muted">
          Trois façons de le remplir. La première suffit pour commencer, et elle prend
          deux minutes.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {etapes.map((etape, i) => (
          <div key={etape.titre} className="carte flex flex-col p-5">
            <span className="label-kpi">Étape {i + 1}</span>
            <h2 className="mt-3 font-display text-[16px] font-semibold">{etape.titre}</h2>
            <p className="mt-2 flex-1 text-[13px] leading-relaxed text-text-muted">
              {etape.texte}
            </p>
            {etape.disponible ? (
              <Link
                href={etape.href}
                className="bouton-principal mt-4"
              >
                <Plus className="size-4" />
                {etape.libelle}
              </Link>
            ) : (
              <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] border border-border px-4 text-[13px] text-text-subtle">
                {etape.libelle}
              </span>
            )}
          </div>
        ))}
      </div>

      <p className="text-[12px] leading-relaxed text-text-subtle">
        Les simulateurs, eux, fonctionnent déjà sans aucune donnée : va voir les{' '}
        <Link href="/projections" className="text-text-muted underline underline-offset-2">
          projections
        </Link>
        .
      </p>
    </div>
  );
}
