import type { Metadata } from 'next';
import { OutilBudget } from '@/components/outils/budget';
import { nombreDepuisUrl } from '@/lib/etat-url';

const TITRE = 'Calculateur de budget et de taux d’épargne';
const DESCRIPTION =
  'Ton taux d’épargne, ton taux d’investissement — ce n’est pas la même chose — et la cible d’épargne de précaution qui en découle.';

export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/budget'>): Promise<Metadata> {
  const p = await searchParams;
  const premier = (cle: string) => {
    const v = p[cle];
    return v === undefined ? undefined : String(Array.isArray(v) ? v[0] : v);
  };

  const og = new URLSearchParams({ outil: 'budget' });
  for (const cle of ['revenus', 'depenses', 'investi']) {
    const valeur = premier(cle);
    if (valeur !== undefined) og.set(cle, valeur);
  }
  const image = `/api/og?${og.toString()}`;

  return {
    title: TITRE,
    description: DESCRIPTION,
    alternates: { canonical: '/outils/budget' },
    openGraph: {
      title: TITRE,
      description: DESCRIPTION,
      url: '/outils/budget',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function BudgetPage({ searchParams }: PageProps<'/outils/budget'>) {
  const p = await searchParams;

  const initiales = {
    revenus: nombreDepuisUrl(p, 'revenus', 2_400),
    depenses: nombreDepuisUrl(p, 'depenses', 1_800),
    investi: nombreDepuisUrl(p, 'investi', 200),
    charges_fixes: nombreDepuisUrl(p, 'charges_fixes', 1_100),
    couverture: nombreDepuisUrl(p, 'couverture', 4),
    deja: nombreDepuisUrl(p, 'deja', 3_000),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="titre-degrade mt-3 font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-0.02em]">
          Budget et taux d’épargne
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Mettre 500 € par mois sur un compte d’épargne et investir 500 € par mois donnent le même
          taux d’épargne, et deux situations qui n’ont rien à voir. Ce calculateur sépare les deux,
          puis en déduit la cible d’épargne de précaution.
        </p>
      </header>

      <OutilBudget initiales={initiales} />
    </div>
  );
}
