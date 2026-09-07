import type { Metadata } from 'next';
import { OutilInteretsComposes } from '@/components/outils/interets-composes';
import { booleenDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';

/**
 * L'image de partage reprend les chiffres de la simulation : c'est ce qui fait
 * circuler un lien plutôt qu'une carte générique de plus.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/interets-composes'>): Promise<Metadata> {
  const p = await searchParams;

  const og = new URLSearchParams({ outil: 'interets-composes' });
    if (p.capital_initial !== undefined) og.set('capital_initial', String(Array.isArray(p.capital_initial) ? p.capital_initial[0] : p.capital_initial));
    if (p.epargne_mensuelle !== undefined) og.set('epargne_mensuelle', String(Array.isArray(p.epargne_mensuelle) ? p.epargne_mensuelle[0] : p.epargne_mensuelle));
    if (p.horizon !== undefined) og.set('horizon', String(Array.isArray(p.horizon) ? p.horizon[0] : p.horizon));
    if (p.taux !== undefined) og.set('taux', String(Array.isArray(p.taux) ? p.taux[0] : p.taux));
    if (p.inflation !== undefined) og.set('inflation', String(Array.isArray(p.inflation) ? p.inflation[0] : p.inflation));

  const image = `/api/og?${og.toString()}`;

  return {
    title: 'Calculateur d’intérêts composés — version belge',
    description: 'Projette ton capital avec versements mensuels, et vois ce qu’il en reste après la taxe belge sur les plus-values.',
    alternates: { canonical: '/outils/interets-composes' },
    openGraph: {
      title: 'Calculateur d’intérêts composés — version belge',
      description: 'Projette ton capital avec versements mensuels, et vois ce qu’il en reste après la taxe belge sur les plus-values.',
      url: '/outils/interets-composes',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function InteretsComposesPage({
  searchParams,
}: PageProps<'/outils/interets-composes'>) {
  const p = await searchParams;

  const initiales = {
    capital_initial: nombreDepuisUrl(p, 'capital_initial', 10_000),
    epargne_mensuelle: nombreDepuisUrl(p, 'epargne_mensuelle', 100),
    horizon: nombreDepuisUrl(p, 'horizon', 20),
    taux: nombreDepuisUrl(p, 'taux', 5),
    inflation: nombreDepuisUrl(p, 'inflation', 2),
    net: booleenDepuisUrl(p, 'net', true),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="titre-degrade mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
          Intérêts composés
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Un calculateur d’intérêts composés brut, tout le monde en a un. Celui-ci déduit la
          taxe belge sur les plus-values et corrige de l’inflation : c’est la seule version
          qui te dit ce que tu auras vraiment.
        </p>
      </header>

      <OutilInteretsComposes initiales={initiales} />
    </div>
  );
}
