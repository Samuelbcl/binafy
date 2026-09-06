import type { Metadata } from 'next';
import { OutilInteretsComposes } from '@/components/outils/interets-composes';
import { booleenDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';

export const metadata: Metadata = {
  title: 'Calculateur d’intérêts composés — version belge',
  description:
    'Projette ton capital avec versements mensuels, et vois ce qu’il en reste après la taxe belge sur les plus-values. Résultat en euros d’aujourd’hui.',
  alternates: { canonical: '/outils/interets-composes' },
};

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
        <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
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
