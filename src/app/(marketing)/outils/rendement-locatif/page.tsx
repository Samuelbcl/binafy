import type { Metadata } from 'next';
import { OutilRendementLocatif } from '@/components/outils/rendement-locatif';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import { REGIONS } from '@/lib/tax/types';

export const metadata: Metadata = {
  title: 'Rendement locatif en Belgique : le calcul juste',
  description:
    'En Belgique, tu n’es pas taxé sur tes loyers mais sur le revenu cadastral indexé majoré de 40 %. Calcule ton rendement net d’impôt et ton cash-flow mensuel réel, crédit compris.',
  alternates: { canonical: '/outils/rendement-locatif' },
};

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
        <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
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
