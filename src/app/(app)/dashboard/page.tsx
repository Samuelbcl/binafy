import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { ActionsRapides } from '@/components/app/actions-rapides';
import { CarteHero } from '@/components/ui/carte-hero';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { CATEGORIES } from '@/lib/apprendre/types';
import { guideParSlug } from '@/lib/apprendre/guides';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import { chargerPrenom } from '@/lib/db/profil';
import { patrimoineNet, totalActifs, valeurQuotePart, variationJour } from '@/lib/patrimoine/types';
import { salutation } from '@/lib/salutation';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';
import { calculerImpotLatent } from '@/lib/tax/plus-values';

export const metadata: Metadata = {
  title: 'Vue d’ensemble',
  description: 'Ton patrimoine, tes objectifs, et de quoi apprendre.',
};

/**
 * Vue d'ensemble (doc 02 § module 1).
 *
 * Le test qui gouverne cet écran : quelqu'un qui n'y connaît rien doit
 * comprendre chaque bloc sans qu'on lui explique. Donc quatre blocs, et pas
 * un de plus : un bonjour, le chiffre, trois gestes, un guide. Les objectifs
 * sont mis de côté pour le moment (trop de choses à la fois) ; le module
 * reste dans le code, sans lien vers lui.
 * Tout le reste — la courbe, la répartition, l'impôt latent, les masses —
 * vit sur la page qui lui correspond. Un écran d'accueil n'est pas un
 * résumé de l'application ; c'est sa porte.
 */
export default async function DashboardPage() {
  const { actifs, passifs, historique, demo } = await chargerPatrimoine();
  const prenom = await chargerPrenom();

  const net = patrimoineNet(actifs, passifs);
  const variation = variationJour(actifs);
  const ratioVariation = net > 0 ? variation / net : 0;

  // Le chiffre signature : patrimoine net d'impôt latent. Personne d'autre ne le fait.
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

  // Un guide a lire : le premier, tant qu'il n'y a pas d'historique de lecture.
  const guide = guideParSlug('matelas-de-securite-belgique');
  const categorie = guide ? CATEGORIES.find((c) => c.cle === guide.categorie) : undefined;

  // Premier écran après inscription : pas de graphique vide et triste (doc 02).
  if (actifs.length === 0 && passifs.length === 0) {
    return <PremierEcran />;
  }

  void historique;
  void demo;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="apparait text-[30px] font-bold tracking-tight">
        {salutation()}
        {prenom ? `, ${prenom}` : ''}
      </h1>

      <CarteHero
        label="Ton patrimoine"
        valeurCents={net}
        metriques={[
          {
            cle: 'net',
            label: 'Ton patrimoine',
            valeurCents: net,
            precision: 'Ce que tu as, dettes déduites.',
          },
          {
            cle: 'brut',
            label: 'Sans déduire les dettes',
            valeurCents: totalActifs(actifs),
            precision: 'Tout ce que tu as, dettes comprises.',
          },
          {
            cle: 'net_impot',
            label: 'Après impôt',
            valeurCents: net - impotLatent.result.impotLatentCents,
            precision: 'Ce qui resterait si tu vendais tout aujourd’hui.',
          },
        ]}
        // Un zero en pastille est un emplacement rempli, pas une information.
        variationCents={variation === 0 ? undefined : variation}
        ratioVariation={variation === 0 ? undefined : ratioVariation}
        mentionVariation={variation === 0 ? undefined : 'aujourd’hui'}
      />

      <ActionsRapides className="apparait" />

      {guide && (
        <section className="apparait" style={{ '--delai': '70ms' } as CSSProperties}>
          <h2 className="mb-3 text-[20px] font-bold">Apprendre</h2>
          <Link
            href={`/apprendre/${guide.slug}`}
            className="carte carte-interactive flex items-center gap-4 p-4"
          >
            <PastilleIcone icone="book-2" teinte="azur" taille="grande" />
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold leading-snug">{guide.titre}</span>
              <span className="mt-0.5 block text-[12.5px] text-text-muted">
                {guide.dureeMinutes} min{categorie ? ` · ${categorie.libelle}` : ''}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-text-subtle" />
          </Link>
        </section>
      )}
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
        <h1 className="titre-degrade text-[30px] font-bold tracking-tight">
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
            <h2 className="mt-3 font-display text-[16px]">{etape.titre}</h2>
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
