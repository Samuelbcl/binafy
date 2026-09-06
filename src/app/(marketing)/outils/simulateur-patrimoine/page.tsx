import type { Metadata } from 'next';
import { OutilSimulateurPatrimoine } from '@/components/outils/simulateur-patrimoine';
import { nombreDepuisUrl } from '@/lib/etat-url';

/**
 * L'image de partage reprend les chiffres de la simulation : c'est ce qui fait
 * circuler un lien plutôt qu'une carte générique de plus.
 */
export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/simulateur-patrimoine'>): Promise<Metadata> {
  const p = await searchParams;

  const og = new URLSearchParams({ outil: 'simulateur-patrimoine' });
    if (p.patrimoine !== undefined) og.set('patrimoine', String(Array.isArray(p.patrimoine) ? p.patrimoine[0] : p.patrimoine));
    if (p.part_actions !== undefined) og.set('part_actions', String(Array.isArray(p.part_actions) ? p.part_actions[0] : p.part_actions));
    if (p.investissement !== undefined) og.set('investissement', String(Array.isArray(p.investissement) ? p.investissement[0] : p.investissement));
    if (p.horizon !== undefined) og.set('horizon', String(Array.isArray(p.horizon) ? p.horizon[0] : p.horizon));
    if (p.rendement_actions !== undefined) og.set('rendement_actions', String(Array.isArray(p.rendement_actions) ? p.rendement_actions[0] : p.rendement_actions));
    if (p.taux_retrait !== undefined) og.set('taux_retrait', String(Array.isArray(p.taux_retrait) ? p.taux_retrait[0] : p.taux_retrait));
    if (p.inflation !== undefined) og.set('inflation', String(Array.isArray(p.inflation) ? p.inflation[0] : p.inflation));
    if (p.depenses !== undefined) og.set('depenses', String(Array.isArray(p.depenses) ? p.depenses[0] : p.depenses));

  const image = `/api/og?${og.toString()}`;

  return {
    title: 'Simulateur de patrimoine belge',
    description: 'Projette ton patrimoine en euros d’aujourd’hui, fiscalité belge comprise, et découvre quand la rente couvrirait tes dépenses.',
    alternates: { canonical: '/outils/simulateur-patrimoine' },
    openGraph: {
      title: 'Simulateur de patrimoine belge',
      description: 'Projette ton patrimoine en euros d’aujourd’hui, fiscalité belge comprise, et découvre quand la rente couvrirait tes dépenses.',
      url: '/outils/simulateur-patrimoine',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function SimulateurPatrimoinePage({
  searchParams,
}: PageProps<'/outils/simulateur-patrimoine'>) {
  const p = await searchParams;

  const initiales = {
    patrimoine: nombreDepuisUrl(p, 'patrimoine', 50_000),
    part_actions: nombreDepuisUrl(p, 'part_actions', 60),
    investissement: nombreDepuisUrl(p, 'investissement', 6_000),
    horizon: nombreDepuisUrl(p, 'horizon', 25),
    rendement_actions: nombreDepuisUrl(p, 'rendement_actions', 7),
    rendement_autres: nombreDepuisUrl(p, 'rendement_autres', 2),
    // Valeurs belges par défaut (doc 07 § 2) : 10 % de taxe sur les plus-values
    // sur les actions, 30 % de précompte mobilier sur le reste.
    fiscalite_actions: nombreDepuisUrl(p, 'fiscalite_actions', 10),
    fiscalite_autres: nombreDepuisUrl(p, 'fiscalite_autres', 30),
    taux_retrait: nombreDepuisUrl(p, 'taux_retrait', 4),
    inflation: nombreDepuisUrl(p, 'inflation', 2),
    depenses: nombreDepuisUrl(p, 'depenses', 24_000),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight tracking-[-0.02em]">
          Où sera ton patrimoine dans 25 ans ?
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Deux courbes plutôt qu’une : ce que tu auras sur le papier, et ce que ça vaudra
          vraiment une fois l’inflation passée. La fiscalité belge est appliquée poche par
          poche — 10 % sur les plus-values, 30 % de précompte sur le reste.
        </p>
      </header>

      <OutilSimulateurPatrimoine initiales={initiales} />
    </div>
  );
}
