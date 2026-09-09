import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { VideoGuide } from '@/components/apprendre/video-guide';
import { CouvertureGuide } from '@/components/apprendre/couverture';
import { RenduGuide } from '@/components/apprendre/rendu-guide';
import { GUIDES, guideParSlug } from '@/lib/apprendre/guides';
import { CATEGORIES, LIBELLE_NIVEAU } from '@/lib/apprendre/types';
import { TAX_PARAMS_2026 } from '@/lib/tax/parametres';

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/apprendre/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideParSlug(slug);
  if (!guide) return {};

  const image = `/api/og?${new URLSearchParams({ outil: 'guide', slug: guide.slug })}`;

  return {
    title: guide.titre,
    description: guide.resume,
    alternates: { canonical: `/apprendre/${guide.slug}` },
    openGraph: {
      type: 'article',
      title: guide.titre,
      description: guide.resume,
      url: `/apprendre/${guide.slug}`,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

function formatDate(iso: string): string {
  const [annee, mois, jour] = iso.split('-');
  return `${jour}/${mois}/${annee}`;
}

export default async function GuidePage({ params }: PageProps<'/apprendre/[slug]'>) {
  const { slug } = await params;
  const guide = guideParSlug(slug);
  if (!guide) notFound();

  const categorie = CATEGORIES.find((c) => c.cle === guide.categorie);

  /**
   * Les sources du guide ne sont pas saisies à la main : elles sont déduites des
   * paramètres fiscaux dont il dépend. Un guide ne peut donc pas citer une source
   * que le calcul n'utilise pas, ni oublier celle qu'il utilise.
   */
  const sources = guide.parametresLies
    .map((cle) => TAX_PARAMS_2026.parametres.find((p) => p.cle === cle))
    .filter((p) => p !== undefined)
    .filter(
      (p, i, tous) => tous.findIndex((autre) => autre.sourceUrl === p.sourceUrl) === i,
    );

  const nonVerifies = guide.parametresLies
    .map((cle) => TAX_PARAMS_2026.parametres.find((p) => p.cle === cle))
    .filter((p) => p !== undefined && !p.verifie);

  const suite = (guide.suite ?? [])
    .map((s) => guideParSlug(s))
    .filter((g) => g !== undefined);

  return (
    <article className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <Link
        href="/apprendre"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" />
        Tous les guides
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-text-muted">
          <span className="font-semibold text-primary">{categorie?.libelle}</span>
          <span aria-hidden>·</span>
          <span>{LIBELLE_NIVEAU[guide.niveau]}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            {guide.dureeMinutes} min
          </span>
        </div>

        <h1 className="mt-4 text-[clamp(1.85rem,4.5vw,2.6rem)] leading-[1.1] tracking-[-0.03em]">
          {guide.titre}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-text-muted">{guide.resume}</p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="puce bg-positive/12 text-positive">
            <ShieldCheck className="size-3.5" />
            Vérifié le {formatDate(guide.verifieLe)}
          </span>
          <span className="puce bg-surface-2 text-text-muted">
            Revenus {guide.anneeRevenus}, déclarés en {guide.anneeRevenus + 1}
          </span>
        </div>
      </header>

      {/* La video d'abord, quand elle existe : c'est le guide en une minute. */}
      <VideoGuide slug={guide.slug} className="mt-8" />

      <CouvertureGuide
        slug={guide.slug}
        categorie={guide.categorie}
        className="mt-8 rounded-[var(--radius-lg)]"
        hauteur={180}
      />

      <div className="mt-10">
        <RenduGuide blocs={guide.blocs} />
      </div>

      {nonVerifies.length > 0 && (
        <p className="mt-10 rounded-[var(--radius-lg)] border border-warning/25 bg-warning/8 p-4 text-[13px] leading-relaxed text-text-muted">
          {nonVerifies.length} paramètre{nonVerifies.length > 1 ? 's' : ''} utilisé
          {nonVerifies.length > 1 ? 's' : ''} par ce guide {nonVerifies.length > 1 ? 'restent' : 'reste'} à
          confirmer à la source officielle. L’ordre de grandeur est correct, le chiffre
          exact ne doit pas fonder une décision à lui seul.
        </p>
      )}

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="text-[15px]">Sources</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Ce guide n’avance aucun chiffre qui ne vienne de ces sources. Les montants sont
          exprimés en année de revenus, pas en exercice d’imposition — c’est la confusion
          la plus fréquente sur ces sujets.
        </p>
        <ul className="mt-4 space-y-2.5">
          {sources.map((p) => (
            <li key={p.sourceUrl}>
              <a
                href={p.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-2 text-[13px] leading-relaxed text-text-muted transition-colors hover:text-primary"
              >
                <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  {p.libelle}
                  {p.verifieLe && (
                    <span className="text-text-subtle"> — vérifié le {formatDate(p.verifieLe)}</span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {suite.length > 0 && (
        <section className="mt-10">
          <h2 className="text-[15px]">À lire ensuite</h2>
          <ul className="mt-4 space-y-3">
            {suite.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/apprendre/${g.slug}`}
                  className="carte carte-interactive flex items-center gap-4 p-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold">{g.titre}</span>
                    <span className="mt-1 block text-[13.5px] leading-relaxed text-text-muted">
                      {g.resume}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-[12.5px] leading-relaxed text-text-subtle">
        Nestor informe, il ne conseille pas. Ce guide explique des règles et chiffre ce
        que chaque option coûte ; il ne recommande aucun placement, aucun produit et aucun
        établissement.
      </p>
    </article>
  );
}
