import { Montant, Pourcentage, Variation } from '@/components/ui/montant';
import {
  COULEUR_POCHE,
  LIBELLE_CLASSE,
  pocheDe,
  valeurQuotePart,
  type Actif,
} from '@/lib/patrimoine/types';

/**
 * La liste des actifs, en deux formes selon l'écran.
 *
 * Un tableau de cinq colonnes ne tient pas dans 390 px. Le faire défiler
 * horizontalement est la solution qui ne coûte rien à écrire et tout à lire :
 * on voit le nom sans la valeur, ou la valeur sans le nom, jamais les deux.
 * Sur téléphone, chaque actif devient donc une ligne à deux étages — ce qu'il
 * est à gauche, ce qu'il vaut à droite — et le tableau reprend à partir de
 * `sm`, où les colonnes ont la place d'exister.
 *
 * La couleur de poche à gauche de chaque ligne est la même que dans le donut :
 * on reconnaît l'épargne au vert avant de lire « Compte d'épargne ». C'est la
 * seule couleur de la ligne ; la variation garde la sienne, le reste est neutre.
 */
export function ListeActifs({ actifs, total }: { actifs: readonly Actif[]; total: number }) {
  return (
    <>
      <ul className="divide-y divide-border/60 border-t border-border sm:hidden">
        {actifs.map((actif) => {
          const valeur = valeurQuotePart(actif);
          const part = total > 0 ? valeur / total : 0;
          const couleur = COULEUR_POCHE[pocheDe(actif.classe)];

          return (
            <li key={actif.id} className="flex items-center gap-3 px-5 py-3.5">
              <span
                aria-hidden
                className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-sm)] text-[13px] font-bold"
                style={{
                  background: `color-mix(in oklab, ${couleur} 16%, var(--surface))`,
                  color: couleur,
                }}
              >
                {actif.nom.trim().charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium">{actif.nom}</p>
                <p className="mt-0.5 truncate text-[12px] text-text-subtle">
                  {LIBELLE_CLASSE[actif.classe]}
                  {actif.institution && ` · ${actif.institution}`}
                  {actif.quotePart < 100 && ` · ${actif.quotePart} %`}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <Montant cents={valeur} decimals={0} className="text-[14.5px] font-semibold" />
                <p className="mt-0.5 text-[12px]">
                  {actif.variationJourCents === 0 ? (
                    <Pourcentage ratio={part} className="text-text-subtle" />
                  ) : (
                    <Variation cents={actif.variationJourCents} decimals={0} />
                  )}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
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
              const couleur = COULEUR_POCHE[pocheDe(actif.classe)];

              return (
                <tr
                  key={actif.id}
                  className="h-14 border-b border-border/50 transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-5 sm:px-6">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-[3px]"
                        style={{ background: couleur }}
                      />
                      <div>
                        <p className="font-medium">{actif.nom}</p>
                        <p className="text-[12px] text-text-subtle">
                          {actif.institution ?? 'Saisie manuelle'}
                          {actif.quotePart < 100 && ` · ${actif.quotePart} % détenus`}
                        </p>
                      </div>
                    </div>
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
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(2, part * 100)}%`, background: couleur }}
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
    </>
  );
}
