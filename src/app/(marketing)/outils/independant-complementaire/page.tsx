import type { Metadata } from 'next';
import { OutilIndependantComplementaire } from '@/components/outils/independant-complementaire';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import { CAISSES } from '@/lib/tax/independant';

const TITRE = 'Indépendant complémentaire en Belgique — ce qu’il reste vraiment';
const DESCRIPTION =
  'Cotisations sociales, frais de caisse et impôt supplémentaire : sur ce que tu factures en complémentaire, voici ce qui arrive dans ta poche.';

export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/independant-complementaire'>): Promise<Metadata> {
  const p = await searchParams;
  const premier = (cle: string) => {
    const v = p[cle];
    return v === undefined ? undefined : String(Array.isArray(v) ? v[0] : v);
  };

  const og = new URLSearchParams({ outil: 'independant-complementaire' });
  for (const cle of ['revenu', 'salaire', 'caisse']) {
    const valeur = premier(cle);
    if (valeur !== undefined) og.set(cle, valeur);
  }
  const image = `/api/og?${og.toString()}`;

  return {
    title: TITRE,
    description: DESCRIPTION,
    alternates: { canonical: '/outils/independant-complementaire' },
    openGraph: {
      title: TITRE,
      description: DESCRIPTION,
      url: '/outils/independant-complementaire',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function IndependantComplementairePage({
  searchParams,
}: PageProps<'/outils/independant-complementaire'>) {
  const p = await searchParams;

  const initiales = {
    revenu: nombreDepuisUrl(p, 'revenu', 8_000),
    salaire: nombreDepuisUrl(p, 'salaire', 32_000),
    caisse: choixDepuisUrl(p, 'caisse', CAISSES, 'acerta'),
    tva: booleenDepuisUrl(p, 'tva', true),
    communaux: nombreDepuisUrl(p, 'communaux', 8.5),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em]">
          Indépendant complémentaire
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Les simulateurs de caisses calculent les cotisations et s’arrêtent là. Or c’est l’impôt
          qui fait le plus mal : un revenu complémentaire s’empile sur le salaire et se fait taxer
          dans la tranche du dessus. Celui-ci va jusqu’au net.
        </p>
      </header>

      <OutilIndependantComplementaire initiales={initiales} />
    </div>
  );
}
