import type { Metadata } from 'next';
import { AjoutActif } from '@/components/patrimoine/ajout-actif';
import { ListeActifs } from '@/components/patrimoine/liste-actifs';
import { CarteKPI } from '@/components/ui/carte-kpi';
import { Montant } from '@/components/ui/montant';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import {
  allocation,
  LIBELLE_PASSIF,
  patrimoineNet,
  totalActifs,
  totalPassifs,
  valeurQuotePart,
} from '@/lib/patrimoine/types';
import { baseDeReference } from '@/lib/tax/plus-values';
import { EtatVide } from '@/components/ui/etat-vide';

export const metadata: Metadata = {
  title: 'Patrimoine',
  description: 'L’inventaire complet de tes actifs et de tes passifs.',
};

const LIBELLE_ORIGINE: Record<string, string> = {
  valeur_2025: 'Valeur au 31/12/2025',
  prix_acquisition: 'Prix d’acquisition',
  inconnue: 'À renseigner',
};

export default async function PatrimoinePage() {
  const { actifs: bruts, passifs, demo } = await chargerPatrimoine();

  const actifs = [...bruts].sort((a, b) => valeurQuotePart(b) - valeurQuotePart(a));
  const total = totalActifs(actifs);
  const net = patrimoineNet(actifs, passifs);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="titre-degrade font-display text-[32px] tracking-tight">Patrimoine</h1>
          <p className="mt-1.5 text-[14px] text-text-muted">
            Ta quote-part de détention, actifs et passifs confondus.
          </p>
        </div>
        {!demo && <AjoutActif />}
      </header>

      {/* Trois cartes empilées mangeaient un écran entier sur téléphone ;
          deux par rang, et la dernière — la seule qui compte vraiment — seule
          sur la sienne, en pleine largeur. */}
      <div className="grid grid-cols-2 gap-3 [&>*:last-child:nth-child(odd)]:col-span-2 sm:grid-cols-3 sm:gap-4 sm:[&>*:last-child:nth-child(odd)]:col-span-1">
        <CarteKPI label="Actifs" valeurCents={total} />
        <CarteKPI label="Passifs" valeurCents={-totalPassifs(passifs)} />
        <CarteKPI label="Patrimoine net" valeurCents={net} accent />
      </div>

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
        <>
          <section className="carte p-5 sm:p-6">
            <h2 className="font-display text-[17px]">
              Base fiscale des positions
            </h2>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-text-muted">
              Pour la taxe sur les plus-values, le point de départ n’est pas le prix d’achat
              mais la valeur au 31/12/2025 quand la position est antérieure. Confondre les
              deux surestime l’impôt.
            </p>

            <ul className="mt-4 divide-y divide-border/50">
              {actifs
                .filter((a) => a.prixAcquisitionCents != null || a.valeurReference2025Cents != null)
                .map((actif) => {
                  const base = baseDeReference({
                    prixAcquisitionCents: actif.prixAcquisitionCents ?? null,
                    valeurReference2025Cents: actif.valeurReference2025Cents ?? null,
                    dateAcquisition: actif.dateAcquisition ?? null,
                  });
                  const plusValue =
                    base.baseCents !== null ? actif.valeurCents - base.baseCents : null;

                  return (
                    <li
                      key={actif.id}
                      className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-[14px]">{actif.nom}</span>
                      <span className="text-[12px] text-text-subtle">
                        {LIBELLE_ORIGINE[base.origine]}
                      </span>
                      {base.baseCents !== null && (
                        <Montant
                          cents={base.baseCents}
                          className="text-[13px] text-text-muted"
                        />
                      )}
                      {plusValue !== null && (
                        <span className="w-28 text-right">
                          <Montant
                            cents={plusValue}
                            sign="always"
                            colore
                            className="text-[13px]"
                          />
                        </span>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>

          <section className="carte p-5 sm:p-6">
            <h2 className="font-display text-[17px]">Répartition par poche</h2>
            <ul className="mt-4 space-y-2 text-[14px]">
              {allocation(actifs).map((poche) => (
                <li key={poche.poche} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-muted">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-[3px]"
                      style={{ background: poche.couleur }}
                    />
                    {poche.libelle}
                  </span>
                  <Montant cents={poche.valeurCents} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
