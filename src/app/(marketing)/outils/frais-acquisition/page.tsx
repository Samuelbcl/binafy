import type { Metadata } from 'next';
import { OutilFraisAcquisition } from '@/components/outils/frais-acquisition';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import type { TypeAchat } from '@/lib/tax/enregistrement';
import { REGIONS } from '@/lib/tax/types';

/**
 * L'image de partage reprend les chiffres de la simulation : c'est ce qui fait
 * circuler un lien plutôt qu'une carte générique de plus.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/frais-acquisition'>): Promise<Metadata> {
  const p = await searchParams;

  const og = new URLSearchParams({ outil: 'frais-acquisition' });
    if (p.prix !== undefined) og.set('prix', String(Array.isArray(p.prix) ? p.prix[0] : p.prix));
    if (p.region !== undefined) og.set('region', String(Array.isArray(p.region) ? p.region[0] : p.region));
    if (p.type !== undefined) og.set('type', String(Array.isArray(p.type) ? p.type[0] : p.type));
    if (p.neuf !== undefined) og.set('neuf', String(Array.isArray(p.neuf) ? p.neuf[0] : p.neuf));

  const image = `/api/og?${og.toString()}`;

  return {
    title: 'Frais d’acquisition immobilière en Belgique',
    description: 'Calcule le cash réel à sortir le jour de l’acte : droits d’enregistrement par Région, honoraires du notaire, acte de crédit et apport.',
    alternates: { canonical: '/outils/frais-acquisition' },
    openGraph: {
      title: 'Frais d’acquisition immobilière en Belgique',
      description: 'Calcule le cash réel à sortir le jour de l’acte : droits d’enregistrement par Région, honoraires du notaire, acte de crédit et apport.',
      url: '/outils/frais-acquisition',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

const TYPES: readonly TypeAchat[] = ['propre_unique', 'autre', 'locatif'];

export default async function FraisAcquisitionPage({
  searchParams,
}: PageProps<'/outils/frais-acquisition'>) {
  const p = await searchParams;

  const initiales = {
    prix: nombreDepuisUrl(p, 'prix', 280_000),
    rp: nombreDepuisUrl(p, 'rp', 280_000),
    region: choixDepuisUrl(p, 'region', REGIONS, 'wallonie'),
    type: choixDepuisUrl(p, 'type', TYPES, 'propre_unique'),
    neuf: booleenDepuisUrl(p, 'neuf', false),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="titre-degrade mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
          Combien de cash pour acheter ?
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Le prix affiché n’est jamais ce que tu sors le jour de l’acte. Entre les droits
          d’enregistrement, le notaire, l’acte de crédit et l’apport exigé par la banque, il
          faut compter bien plus. Voici le chiffre complet, par Région.
        </p>
      </header>

      <OutilFraisAcquisition initiales={initiales} />
    </div>
  );
}
