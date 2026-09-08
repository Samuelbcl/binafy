import type { Metadata } from 'next';
import { OutilRendementLocatif } from '@/components/outils/rendement-locatif';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import { REGIONS } from '@/lib/tax/types';

/**
 * L'image de partage reprend les chiffres de la simulation : c'est ce qui fait
 * circuler un lien plutôt qu'une carte générique de plus.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/rendement-locatif'>): Promise<Metadata> {
  const p = await searchParams;

  const og = new URLSearchParams({ outil: 'rendement-locatif' });
    if (p.prix !== undefined) og.set('prix', String(Array.isArray(p.prix) ? p.prix[0] : p.prix));
    if (p.loyer !== undefined) og.set('loyer', String(Array.isArray(p.loyer) ? p.loyer[0] : p.loyer));
    if (p.rc !== undefined) og.set('rc', String(Array.isArray(p.rc) ? p.rc[0] : p.rc));
    if (p.marginal !== undefined) og.set('marginal', String(Array.isArray(p.marginal) ? p.marginal[0] : p.marginal));
    if (p.region !== undefined) og.set('region', String(Array.isArray(p.region) ? p.region[0] : p.region));
    if (p.credit !== undefined) og.set('credit', String(Array.isArray(p.credit) ? p.credit[0] : p.credit));
    if (p.quotite !== undefined) og.set('quotite', String(Array.isArray(p.quotite) ? p.quotite[0] : p.quotite));
    if (p.taux !== undefined) og.set('taux', String(Array.isArray(p.taux) ? p.taux[0] : p.taux));
    if (p.duree !== undefined) og.set('duree', String(Array.isArray(p.duree) ? p.duree[0] : p.duree));

  const image = `/api/og?${og.toString()}`;

  return {
    title: 'Rendement locatif en Belgique : le calcul juste',
    description: 'En Belgique, tu n’es pas taxé sur tes loyers mais sur le revenu cadastral indexé majoré de 40 %. Calcule ton cash-flow réel.',
    alternates: { canonical: '/outils/rendement-locatif' },
    openGraph: {
      title: 'Rendement locatif en Belgique : le calcul juste',
      description: 'En Belgique, tu n’es pas taxé sur tes loyers mais sur le revenu cadastral indexé majoré de 40 %. Calcule ton cash-flow réel.',
      url: '/outils/rendement-locatif',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

/**
 * Les paramètres sont lus côté serveur et passés au calculateur : le résultat
 * figure ainsi dans le HTML. Une page d'acquisition qui ne servirait qu'un
 * squelette n'apporterait rien à un moteur de recherche.
 */
export default async function RendementLocatifPage({
  searchParams,
}: PageProps<'/outils/rendement-locatif'>) {
  const p = await searchParams;

  const initiales = {
    prix: nombreDepuisUrl(p, 'prix', 200_000),
    loyer: nombreDepuisUrl(p, 'loyer', 850),
    rc: nombreDepuisUrl(p, 'rc', 900),
    marginal: nombreDepuisUrl(p, 'marginal', 50),
    charges: nombreDepuisUrl(p, 'charges', 1_200),
    precompte: nombreDepuisUrl(p, 'precompte', 800),
    vacance: nombreDepuisUrl(p, 'vacance', 5),
    travaux: nombreDepuisUrl(p, 'travaux', 1_000),
    quotite: nombreDepuisUrl(p, 'quotite', 80),
    taux: nombreDepuisUrl(p, 'taux', 3.5),
    duree: nombreDepuisUrl(p, 'duree', 25),
    region: choixDepuisUrl(p, 'region', REGIONS, 'wallonie'),
    credit: booleenDepuisUrl(p, 'credit', true),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="titre-degrade mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-[-0.02em]">
          Ce que ce bien te rapportera vraiment
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Un rendement brut de 6 % qui donne un cash-flow négatif est un piège, et c’est le cas
          le plus fréquent. Voici les trois rendements — brut, net de charges, net d’impôt — et
          surtout ce qui entre ou sort de ton compte chaque mois.
        </p>
      </header>

      <OutilRendementLocatif initiales={initiales} />
    </div>
  );
}
