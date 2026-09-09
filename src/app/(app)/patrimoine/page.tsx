import type { Metadata } from 'next';
import { AjoutActif } from '@/components/patrimoine/ajout-actif';
import { ListeActifs } from '@/components/patrimoine/liste-actifs';
import { CourbePatrimoine } from '@/components/charts/courbe-patrimoine';
import { DonutAllocation } from '@/components/charts/donut-allocation';
import { Montant } from '@/components/ui/montant';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import {
  allocation,
  LIBELLE_PASSIF,
  totalActifs,
  valeurQuotePart,
} from '@/lib/patrimoine/types';
import { EtatVide } from '@/components/ui/etat-vide';

export const metadata: Metadata = {
  title: 'Patrimoine',
  description: 'L’inventaire complet de tes actifs et de tes passifs.',
};

export default async function PatrimoinePage() {
  const { actifs: bruts, passifs, historique, demo } = await chargerPatrimoine();

  const actifs = [...bruts].sort((a, b) => valeurQuotePart(b) - valeurQuotePart(a));
  const total = totalActifs(actifs);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titre-degrade text-[30px] font-bold tracking-tight">Patrimoine</h1>
        </div>
        {!demo && <AjoutActif />}
      </header>

      {/* La courbe vit ici, pas sur l'accueil : c'est la page de ce qu'on a. */}
      {historique.length > 1 && <CourbePatrimoine historique={historique} />}

      <section className="carte overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 sm:px-6">
          <h2 className="font-display text-[17px]">Actifs</h2>
          <span className="text-[12px] text-text-muted">
            {actifs.length} ligne{actifs.length > 1 ? 's' : ''}
          </span>
        </div>

        {actifs.length === 0 ? (
          <div className="border-t border-border px-5 sm:px-6">
            <EtatVide
              titre="Commence par un seul compte"
              texte="Pas besoin de tout saisir aujourd’hui. Un compte d’épargne suffit pour voir apparaître ton patrimoine net, ton allocation et ton impôt latent — le reste s’ajoute au fil de l’eau."
              action={{ href: '/patrimoine#ajouter', libelle: 'Ajouter un actif' }}
            />
          </div>
        ) : (
          <ListeActifs actifs={actifs} total={total} />
        )}
      </section>

      {passifs.length > 0 && (
        <section className="carte overflow-hidden">
          <div className="px-5 py-4 sm:px-6">
            <h2 className="font-display text-[17px]">Passifs</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <caption className="sr-only">Liste des passifs</caption>
              <thead>
                <tr className="border-y border-border text-left text-[12px] text-text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Passif</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Mensualité</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Taux</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">
                    Capital restant dû
                  </th>
                </tr>
              </thead>
              <tbody>
                {passifs.map((passif) => (
                  <tr key={passif.id} className="h-14 border-b border-border/50 last:border-0">
                    <td className="px-5 sm:px-6">
                      <p className="font-medium">{passif.nom}</p>
                      <p className="text-[12px] text-text-subtle">
                        {LIBELLE_PASSIF[passif.type]} · {passif.dureeMois} mois
                      </p>
                    </td>
                    <td className="px-3 text-right">
                      <Montant cents={passif.mensualiteCents} />
                    </td>
                    <td className="px-3 text-right font-mono text-[13px] tabular-nums text-text-muted">
                      {passif.tauxAnnuel.toString().replace('.', ',')} %
                    </td>
                    <td className="px-5 text-right sm:px-6">
                      <Montant cents={passif.capitalRestantCents} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {actifs.length > 0 && (
        <DonutAllocation allocation={allocation(actifs)} totalCents={totalActifs(actifs)} />
      )}
    </div>
  );
}
