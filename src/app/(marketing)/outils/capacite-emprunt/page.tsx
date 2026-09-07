import type { Metadata } from 'next';
import { OutilCapaciteEmprunt } from '@/components/outils/capacite-emprunt';
import { booleenDepuisUrl, nombreDepuisUrl } from '@/lib/etat-url';

const TITRE = 'Capacité d’emprunt — calcul belge avec reste à vivre';
const DESCRIPTION =
  'Combien tu peux emprunter, la mensualité correspondante, et surtout ce qu’il te reste pour vivre — le chiffre que les simulateurs de banque ne montrent pas.';

export async function generateMetadata({
  searchParams,
}: PageProps<'/outils/capacite-emprunt'>): Promise<Metadata> {
  const p = await searchParams;
  const premier = (cle: string) => {
    const v = p[cle];
    return v === undefined ? undefined : String(Array.isArray(v) ? v[0] : v);
  };

  const og = new URLSearchParams({ outil: 'capacite-emprunt' });
  for (const cle of ['revenus', 'charges', 'duree', 'taux', 'loyer']) {
    const valeur = premier(cle);
    if (valeur !== undefined) og.set(cle, valeur);
  }
  const image = `/api/og?${og.toString()}`;

  return {
    title: TITRE,
    description: DESCRIPTION,
    alternates: { canonical: '/outils/capacite-emprunt' },
    openGraph: {
      title: TITRE,
      description: DESCRIPTION,
      url: '/outils/capacite-emprunt',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [image] },
  };
}

export default async function CapaciteEmpruntPage({
  searchParams,
}: PageProps<'/outils/capacite-emprunt'>) {
  const p = await searchParams;

  const initiales = {
    revenus: nombreDepuisUrl(p, 'revenus', 2_400),
    charges: nombreDepuisUrl(p, 'charges', 0),
    duree: nombreDepuisUrl(p, 'duree', 25),
    taux: nombreDepuisUrl(p, 'taux', 3.4),
    loyer: nombreDepuisUrl(p, 'loyer', 0),
    locatif: booleenDepuisUrl(p, 'locatif', false),
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="mb-8">
        <p className="label-kpi">Outil gratuit, sans compte</p>
        <h1 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.025em]">
          Capacité d’emprunt
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Les simulateurs de banque affichent un montant maximal et s’arrêtent là. Celui-ci montre
          aussi ce qu’il te resterait pour vivre chaque mois, et prévient quand ce reste devient
          trop mince pour qu’un dossier passe.
        </p>
      </header>

      <OutilCapaciteEmprunt initiales={initiales} />
    </div>
  );
}
