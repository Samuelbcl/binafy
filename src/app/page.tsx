import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { OUTILS } from '@/lib/outils';
import { utilisateurCourant } from '@/lib/db/serveur';
import { modeDemo } from '@/lib/env';
import { MarqueNestor } from '@/components/ui/marque';

export const metadata: Metadata = {
  title: 'Nestor — Ton patrimoine, clair.',
  description:
    'Gérer son patrimoine, le comprendre, apprendre la fiscalité belge et éviter les erreurs que la plupart des gens font.',
};



/**
 * Données structurées (doc 09 § technique SEO).
 *
 * Décrites en JSON-LD plutôt qu'en microdonnées : le balisage reste séparé du
 * contenu, et il ne risque pas d'être cassé par une refonte visuelle.
 */
const DONNEES_STRUCTUREES = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Nestor',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  inLanguage: 'fr-BE',
  description:
    'Suivi de patrimoine pour la Belgique : fiscalité belge intégrée à chaque calcul — précompte mobilier, TOB, taxe sur les plus-values, droits d’enregistrement par Région.',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  author: { '@type': 'Organization', name: 'Biancola Studio', address: 'Liège, Belgique' },
  audience: { '@type': 'Audience', geographicArea: { '@type': 'Country', name: 'Belgique' } },
};

export default async function AccueilPage() {
  const connecte = !modeDemo && (await utilisateurCourant()) !== null;
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-6 sm:py-24">
      <script
        type="application/ld+json"
        // Contenu constant, défini juste au-dessus : aucune donnée utilisateur
        // n'entre ici, donc aucune surface d'injection.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DONNEES_STRUCTUREES) }}
      />

      <header className="max-w-3xl">
        <div className="flex items-center gap-2.5">
          <MarqueNestor />
        </div>

        {/*
          Le dégradé ne tombe que sur la seconde ligne : c'est elle qui porte la
          promesse, et un dégradé qui couvre tout le titre ne met plus rien en
          avant. Le fond du dégradé reste dans la couleur du texte pour que la
          ligne se lise même si le navigateur ne sait pas découper un fond sur
          du texte.
        */}
        {/*
          Pas de « version belge » : l'application est faite pour des Belges, ils
          n'ont pas a se le faire dire. Pas de comparaison avec la France non
          plus : on vient sur Nestor pour Nestor. Une phrase qui dit ce qu'on
          gagne, et une qui dit a quoi ca sert.
        */}
        <h1 className="mt-10 font-display text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] tracking-[-0.03em]">
          Ton patrimoine,
          <br />
          <span className="titre-degrade">enfin clair.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-text-muted">
          Nestor t’aide à gérer ton patrimoine, à le comprendre, à apprendre la fiscalité belge —
          et à éviter les erreurs que la plupart des gens font.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {/*
            Seule action chaude du site. Sur la page d'accueil, l'engagement
            qu'on demande est de créer un compte : lui donner la couleur qui
            attire est honnête. Dans l'application, l'action principale reste
            noire — là, ce qui doit attirer l'œil, ce sont les chiffres.
          */}
          {/* Connecte, on ne se voit pas proposer de creer un compte. */}
          {connecte ? (
            <Link href="/dashboard" className="bouton-marque">
              Ouvrir mon espace
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link href="/connexion" className="bouton-marque">
              Créer mon compte
              <ArrowRight className="size-4" />
            </Link>
          )}
          <Link href="/apprendre" className="bouton-secondaire">
            Apprendre la fiscalité belge
          </Link>
        </div>
      </header>

      <section className="mt-20">
        <h2 className="label-kpi">Outils gratuits, sans compte</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {OUTILS.map(({ href, titre, description, icone, teinte }) => (
            <Link
              key={href}
              href={href}
              className="carte carte-interactive group flex flex-col p-5"
            >
              <PastilleIcone icone={icone} teinte={teinte} />
              <h3 className="mt-4 font-display text-[16px]">{titre}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-text-muted">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                Ouvrir
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          {
            titre: 'Chaque chiffre s’explique',
            texte:
              'Formule, paramètres utilisés, année de référence et source officielle, dépliables sous chaque résultat.',
          },
          {
            titre: 'Patrimoine net d’impôt latent',
            texte:
              'Ton patrimoine brut, et ce qu’il resterait après taxation en cas de liquidation. Personne ne l’affiche.',
          },
          {
            titre: 'Nestor informe, ne conseille pas',
            texte:
              'On montre des chiffres et des règles, tu décides. Aucun produit maison, aucun conflit d’intérêts.',
          },
        ].map((bloc) => (
          <div key={bloc.titre} className="border-t border-border pt-4">
            <h3 className="font-display text-[15px]">{bloc.titre}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-text-muted">{bloc.texte}</p>
          </div>
        ))}
      </section>

      <footer className="mt-20 border-t border-border pt-6">
        <p className="text-[12px] leading-relaxed text-text-subtle">
          Nestor est un outil d’information et de simulation. Il ne constitue ni un conseil
          fiscal, ni un conseil en investissement, et ne donne accès à aucun ordre de bourse ni
          mouvement d’argent. Projet porté par Biancola Studio, Liège.
        </p>
      </footer>
    </div>
  );
}
