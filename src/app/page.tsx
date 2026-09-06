import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, FileCheck2, Landmark } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nestor — Le patrimoine, version belge',
  description:
    'Suivre, comprendre et piloter son patrimoine en Belgique. Fiscalité belge intégrée à chaque calcul : précompte, TOB, taxe sur les plus-values, droits d’enregistrement par Région.',
};

const OUTILS = [
  {
    href: '/outils/frais-acquisition',
    titre: 'Frais d’acquisition immobilière',
    description:
      'Le cash réel à sortir le jour de l’acte, par Région, et ce que coûte un locatif acheté avant sa résidence principale.',
    icone: Landmark,
  },
  {
    href: '/outils/interets-composes',
    titre: 'Intérêts composés',
    description:
      'La projection classique, mais avec la version nette de fiscalité belge. Personne d’autre ne la donne.',
    icone: Calculator,
  },
  {
    href: '/outils/rendement-locatif',
    titre: 'Rendement locatif belge',
    description:
      'Tu n’es pas taxé sur les loyers mais sur le revenu cadastral indexé. Voici ton cash-flow réel après impôt.',
    icone: FileCheck2,
  },
];


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

export default function AccueilPage() {
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
          <span
            aria-hidden
            className="grid size-8 place-items-center rounded-[10px] bg-primary font-display text-[15px] font-bold text-on-primary"
          >
            N
          </span>
          <span className="font-display text-[17px] font-semibold tracking-tight">Nestor</span>
        </div>

        <h1 className="mt-10 font-display text-[clamp(2.25rem,6vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em]">
          Le patrimoine,
          <br />
          version belge.
        </h1>

        <p className="mt-6 max-w-2xl text-[17px] leading-relaxed text-text-muted">
          Suivre. Comprendre. Décider. Sans devoir traduire la fiscalité française.
          Précompte mobilier, TOB, taxe sur les plus-values, revenu cadastral, droits
          d’enregistrement par Région — intégrés à chaque calcul, pas en option.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] bg-primary px-5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
          >
            Voir la démo
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/outils/frais-acquisition"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-5 text-[14px] font-medium transition-colors hover:bg-surface-hover"
          >
            Essayer un outil
          </Link>
        </div>
      </header>

      <section className="mt-20">
        <h2 className="label-kpi">Outils gratuits, sans compte</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {OUTILS.map(({ href, titre, description, icone: Icone }) => (
            <Link
              key={href}
              href={href}
              className="carte carte-interactive group flex flex-col p-5"
            >
              <Icone className="size-5 text-primary" />
              <h3 className="mt-4 font-display text-[16px] font-semibold">{titre}</h3>
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
            <h3 className="font-display text-[15px] font-semibold">{bloc.titre}</h3>
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
