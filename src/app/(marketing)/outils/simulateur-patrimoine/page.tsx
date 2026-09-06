import type { Metadata } from 'next';
import { OutilSimulateurPatrimoine } from '@/components/outils/simulateur-patrimoine';
import { nombreDepuisUrl } from '@/lib/etat-url';

export const metadata: Metadata = {
  title: 'Simulateur de patrimoine belge',
  description:
    'Projette ton patrimoine en euros d’aujourd’hui, fiscalité belge comprise : taxe sur les plus-values, précompte mobilier, inflation. Et la date où la rente couvrirait tes dépenses.',
  alternates: { canonical: '/outils/simulateur-patrimoine' },
};

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
