import type { Metadata } from 'next';
import { AjoutActif } from '@/components/patrimoine/ajout-actif';
import { CarteKPI } from '@/components/ui/carte-kpi';
import { Montant, Pourcentage, Variation } from '@/components/ui/montant';
import { chargerPatrimoine } from '@/lib/db/patrimoine';
import {
  allocation,
  LIBELLE_CLASSE,
  LIBELLE_PASSIF,
  patrimoineNet,
  totalActifs,
  totalPassifs,
  valeurQuotePart,
} from '@/lib/patrimoine/types';
import { baseDeReference } from '@/lib/tax/plus-values';

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
          <h1 className="font-display text-[28px] font-semibold tracking-tight">Patrimoine</h1>
          <p className="mt-1.5 text-[14px] text-text-muted">
            Ta quote-part de détention, actifs et passifs confondus.
          </p>
        </div>
        {!demo && <AjoutActif />}
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <CarteKPI label="Actifs" valeurCents={total} />
        <CarteKPI label="Passifs" valeurCents={-totalPassifs(passifs)} />
        <CarteKPI label="Patrimoine net" valeurCents={net} accent />
      </div>

      <section className="carte overflow-hidden">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 sm:px-6">
          <h2 className="font-display text-[17px] font-semibold">Actifs</h2>
          <span className="text-[12px] text-text-muted">
            {actifs.length} ligne{actifs.length > 1 ? 's' : ''}
          </span>
        </div>

        {actifs.length === 0 ? (
          <p className="border-t border-border px-5 py-8 text-center text-[14px] text-text-muted sm:px-6">
            Aucun actif pour l’instant. Ajoute-en un pour commencer.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[14px]">
              <caption className="sr-only">Liste des actifs détenus</caption>
              <thead>
                <tr className="border-y border-border text-left text-[12px] text-text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Actif</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Type</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Répartition</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Valeur</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium sm:px-6">
                    Variation 1J
                  </th>
                </tr>
              </thead>
              <tbody>
                {actifs.map((actif) => {
                  const valeur = valeurQuotePart(actif);
                  const part = total > 0 ? valeur / total : 0;

                  return (
                    <tr
                      key={actif.id}
                      className="h-14 border-b border-border/50 transition-colors last:border-0 hover:bg-surface-hover"
                    >
                      <td className="px-5 sm:px-6">
                        <p className="font-medium">{actif.nom}</p>
                        <p className="text-[12px] text-text-subtle">
                          {actif.institution ?? 'Saisie manuelle'}
                          {actif.quotePart < 100 && ` · ${actif.quotePart} % détenus`}
                        </p>
                      </td>
                      <td className="px-3">
                        <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-text-muted">
                          {LIBELLE_CLASSE[actif.classe]}
                        </span>
                      </td>
                      <td className="px-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-2">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.max(2, part * 100)}%` }}
                            />
                          </div>
                          <Pourcentage ratio={part} className="w-12 text-right text-[12px]" />
                        </div>
                      </td>
                      <td className="px-3 text-right">
                        <Montant cents={valeur} />
                      </td>
                      <td className="px-5 text-right sm:px-6">
                        {actif.variationJourCents === 0 ? (
                          <span className="text-[13px] text-text-subtle">—</span>
                        ) : (
                          <Variation cents={actif.variationJourCents} decimals={2} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {passifs.length > 0 && (
        <section className="carte overflow-hidden">
          <div className="px-5 py-4 sm:px-6">
            <h2 className="font-display text-[17px] font-semibold">Passifs</h2>
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
            <h2 className="font-display text-[17px] font-semibold">
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
            <h2 className="font-display text-[17px] font-semibold">Répartition par poche</h2>
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
