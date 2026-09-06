import type { Metadata } from 'next';
import { OutilFraisAcquisition } from '@/components/outils/frais-acquisition';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';
import type { TypeAchat } from '@/lib/tax/enregistrement';
import { REGIONS } from '@/lib/tax/types';

export const metadata: Metadata = {
  title: 'Frais d’acquisition immobilière en Belgique',
  description:
    'Calcule le cash réel à sortir le jour de l’acte : droits d’enregistrement par Région, honoraires du notaire, acte de crédit et apport. Et ce que coûte un locatif acheté avant sa résidence principale.',
  alternates: { canonical: '/outils/frais-acquisition' },
};

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
        <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
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
