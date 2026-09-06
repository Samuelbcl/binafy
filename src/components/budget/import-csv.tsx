'use client';

import { AlertTriangle, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { useActionState, useId, useState } from 'react';
import {
  analyserFichier,
  importerTransactions,
  type ApercuImport,
  type ResultatImport,
} from '@/app/(app)/budget/actions';
import { cn } from '@/lib/cn';
import { formatEUR } from '@/lib/money';

/**
 * Import d'un extrait bancaire, en deux temps (doc 02 § module 3).
 *
 * On montre d'abord ce qui sera importé, on écrit ensuite. Un import bancaire
 * mal interprété pollue tout le budget, et personne ne relit une base de
 * données : mieux vaut douze lignes d'aperçu qu'un rollback.
 */

type Etape =
  | { nom: 'choix' }
  | { nom: 'apercu'; apercu: ApercuImport; nomFichier: string }
  | { nom: 'termine'; resultat: Extract<ResultatImport, { ok: true }> };

export function ImportCSV() {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<Etape>({ nom: 'choix' });
  const idTitre = useId();

  const [erreurAnalyse, actionAnalyse, analyseEnCours] = useActionState(
    async (_precedent: string | null, donnees: FormData) => {
      const fichier = donnees.get('fichier');
      const nom = fichier instanceof File ? fichier.name : 'import.csv';
      const resultat = await analyserFichier(null, donnees);

      if ('erreur' in resultat) return resultat.erreur;

      setEtape({ nom: 'apercu', apercu: resultat, nomFichier: nom });
      return null;
    },
    null,
  );

  const [resultatImport, actionImport, importEnCours] = useActionState(
    async (_precedent: ResultatImport | null, donnees: FormData) => {
      const resultat = await importerTransactions(null, donnees);
      if (resultat.ok) setEtape({ nom: 'termine', resultat });
      return resultat;
    },
    null,
  );

  function fermer() {
    setOuvert(false);
    setEtape({ nom: 'choix' });
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] bg-primary px-4 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
      >
        <Upload className="size-4" />
        Importer un extrait
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitre}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
    >
      <div className="carte w-full max-w-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={idTitre} className="font-display text-[17px] font-semibold">
            {etape.nom === 'termine' ? 'Import terminé' : 'Importer un extrait bancaire'}
          </h2>
          <button
            type="button"
            onClick={fermer}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <X className="size-[18px]" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>

        {/* ── Étape 1 : choix du fichier ─────────────────────── */}
        {etape.nom === 'choix' && (
          <form action={actionAnalyse} className="space-y-4 px-5 py-5">
            <p className="text-[13px] leading-relaxed text-text-muted">
              Exporte tes opérations en CSV depuis ton application bancaire. Les formats de
              Belfius, ING, BNP Paribas Fortis, KBC et Argenta sont reconnus automatiquement —
              les colonnes sont détectées en français comme en néerlandais.
            </p>

            <label className="block">
              <span className="label-kpi mb-1.5 block">Fichier CSV</span>
              <input
                type="file"
                name="fichier"
                accept=".csv,text/csv,text/plain"
                required
                className="w-full rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-[13px] file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-primary file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-on-primary"
              />
            </label>

            {erreurAnalyse && (
              <p role="alert" className="text-[12px] leading-relaxed text-negative">
                {erreurAnalyse}
              </p>
            )}

            <p className="text-[11px] leading-relaxed text-text-subtle">
              Le fichier n’est pas conservé : seules les transactions extraites sont
              enregistrées. Un extrait bancaire est la donnée la plus sensible qu’on manipule.
            </p>

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={fermer}
                className="min-h-11 rounded-[var(--radius)] border border-border px-4 text-[14px] transition-colors hover:bg-surface-hover"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={analyseEnCours}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] bg-primary px-5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {analyseEnCours && <Loader2 className="size-4 animate-spin" />}
                Analyser
              </button>
            </div>
          </form>
        )}

        {/* ── Étape 2 : aperçu avant écriture ────────────────── */}
        {etape.nom === 'apercu' && (
          <form action={actionImport} className="space-y-4 px-5 py-5">
            <input type="hidden" name="contenu" value={etape.apercu.contenu} />
            <input type="hidden" name="nomFichier" value={etape.nomFichier} />

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px]">
              <span>
                <span className="font-semibold">{etape.apercu.total}</span> transactions lues
              </span>
              {etape.apercu.rejets.length > 0 && (
                <span className="text-warning">
                  {etape.apercu.rejets.length} ligne
                  {etape.apercu.rejets.length > 1 ? 's' : ''} rejetée
                  {etape.apercu.rejets.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="overflow-hidden rounded-[var(--radius)] border border-border">
              <table className="w-full text-[13px]">
                <caption className="sr-only">Aperçu des transactions à importer</caption>
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-left text-[11px] text-text-muted">
                    <th scope="col" className="px-3 py-2 font-medium">Date</th>
                    <th scope="col" className="px-3 py-2 font-medium">Libellé</th>
                    <th scope="col" className="px-3 py-2 font-medium">Catégorie</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {etape.apercu.apercu.map((t, i) => (
                    <tr key={i} className="border-b border-border/40 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]">
                        {t.date}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2" title={t.libelle}>
                        {t.libelle}
                      </td>
                      <td className="px-3 py-2 text-[12px] text-text-muted">
                        {t.categorie ?? '—'}
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-3 py-2 text-right font-mono tabular-nums',
                          t.montantCents > 0 ? 'text-positive' : 'text-text',
                        )}
                      >
                        {formatEUR(t.montantCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {etape.apercu.total > etape.apercu.apercu.length && (
              <p className="text-[12px] text-text-subtle">
                … et {etape.apercu.total - etape.apercu.apercu.length} autres transactions.
              </p>
            )}

            {etape.apercu.rejets.length > 0 && (
              <details className="rounded-[var(--radius)] border border-warning/30 bg-warning/8 p-3">
                <summary className="cursor-pointer text-[12px] font-medium">
                  Voir les lignes rejetées
                </summary>
                <ul className="mt-2 space-y-1">
                  {etape.apercu.rejets.map((r) => (
                    <li key={r.ligne} className="text-[11px] text-text-muted">
                      Ligne {r.ligne} — {r.raison}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <p className="text-[11px] leading-relaxed text-text-subtle">
              Les doublons sont écartés automatiquement : réimporter le même fichier ne
              dédoublera pas ton budget. Les catégories restent modifiables après coup.
            </p>

            {resultatImport && !resultatImport.ok && (
              <p role="alert" className="text-[12px] leading-relaxed text-negative">
                {resultatImport.message}
              </p>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setEtape({ nom: 'choix' })}
                className="min-h-11 rounded-[var(--radius)] border border-border px-4 text-[14px] transition-colors hover:bg-surface-hover"
              >
                Choisir un autre fichier
              </button>
              <button
                type="submit"
                disabled={importEnCours}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] bg-primary px-5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {importEnCours && <Loader2 className="size-4 animate-spin" />}
                Importer {etape.apercu.total} transactions
              </button>
            </div>
          </form>
        )}

        {/* ── Étape 3 : compte rendu ─────────────────────────── */}
        {etape.nom === 'termine' && (
          <div className="space-y-4 px-5 py-5">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-positive" />
              <div className="text-[14px] leading-relaxed">
                <p>
                  <span className="font-semibold">{etape.resultat.importees}</span> transactions
                  importées.
                </p>
                {etape.resultat.ignorees > 0 && (
                  <p className="mt-1 text-text-muted">
                    {etape.resultat.ignorees} déjà présentes, écartées comme doublons.
                  </p>
                )}
                {etape.resultat.rejetees > 0 && (
                  <p className="mt-1 flex items-start gap-1.5 text-text-muted">
                    <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                    {etape.resultat.rejetees} lignes illisibles, non importées.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-border pt-4">
              <button
                type="button"
                onClick={fermer}
                className="inline-flex min-h-11 items-center rounded-[var(--radius)] bg-primary px-5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
              >
                Voir mon budget
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
