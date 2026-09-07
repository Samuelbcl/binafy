'use client';

import { Loader2, Plus, X } from 'lucide-react';
import { useActionState, useId, useState } from 'react';
import { creerActif, type ResultatAction } from '@/app/(app)/patrimoine/actions';
import { cn } from '@/lib/cn';
import { CLASSES_ACTIF, LIBELLE_CLASSE, pocheDe } from '@/lib/patrimoine/types';

/**
 * Ajout d'un actif.
 *
 * Le formulaire ne demande que ce qui est nécessaire à la classe choisie :
 * un compte courant n'a ni ISIN, ni date d'acquisition, ni base fiscale.
 * Demander vingt champs pour en remplir trois est le meilleur moyen de faire
 * abandonner quelqu'un dès le premier écran.
 */

const ETAT_INITIAL: ResultatAction | null = null;

/** Les classes pour lesquelles la base fiscale de 2026 a un sens. */
function aBaseFiscale(classe: string): boolean {
  const poche = pocheDe(classe as never);
  return poche === 'actions' || poche === 'crypto';
}

export function AjoutActif() {
  const [ouvert, setOuvert] = useState(false);
  const [classe, setClasse] = useState<string>('compte_courant');
  const idFormulaire = useId();

  // La fermeture est une conséquence directe de l'enregistrement : on la traite
  // dans l'action plutôt que dans un effet qui observerait le résultat après coup.
  const [etat, action, enCours] = useActionState(
    async (precedent: ResultatAction | null, donnees: FormData) => {
      const resultat = await creerActif(precedent, donnees);
      if (resultat.ok) setOuvert(false);
      return resultat;
    },
    ETAT_INITIAL,
  );

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="bouton-principal"
      >
        <Plus className="size-4" />
        Ajouter un actif
      </button>
    );
  }

  const montreBaseFiscale = aBaseFiscale(classe);
  const montreFonds = ['etf', 'fonds'].includes(classe);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${idFormulaire}-titre`}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
    >
      <div className="carte w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={`${idFormulaire}-titre`} className="font-display text-[17px] font-semibold">
            Ajouter un actif
          </h2>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <X className="size-[18px]" />
            <span className="sr-only">Fermer</span>
          </button>
        </div>

        <form action={action} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Nom" className="sm:col-span-2">
              <input
                name="nom"
                required
                maxLength={120}
                placeholder="Compte à vue, iShares Core MSCI World…"
                className={classeChamp}
              />
            </Champ>

            <Champ label="Type">
              <select
                name="classe"
                value={classe}
                onChange={(e) => setClasse(e.target.value)}
                className={classeChamp}
              >
                {CLASSES_ACTIF.map((c) => (
                  <option key={c} value={c}>
                    {LIBELLE_CLASSE[c]}
                  </option>
                ))}
              </select>
            </Champ>

            <Champ label="Valeur actuelle" aide="En euros.">
              <input
                name="valeur"
                required
                inputMode="decimal"
                placeholder="2340,12"
                className={cn(classeChamp, 'font-mono tabular-nums')}
              />
            </Champ>

            <Champ label="Établissement" aide="Facultatif.">
              <input
                name="institution"
                maxLength={120}
                placeholder="ING, Degiro…"
                className={classeChamp}
              />
            </Champ>

            <Champ label="Quote-part détenue" aide="100 % si le bien est entièrement à toi.">
              <input
                name="quotePart"
                type="number"
                min={1}
                max={100}
                step={1}
                defaultValue={100}
                className={cn(classeChamp, 'font-mono tabular-nums')}
              />
            </Champ>
          </div>

          {montreBaseFiscale && (
            <fieldset className="space-y-4 rounded-[var(--radius)] border border-border p-4">
              <legend className="px-1.5 text-[12px] text-text-muted">
                Base fiscale — pour la taxe sur les plus-values
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <Champ label="Prix d’acquisition" aide="Facultatif.">
                  <input
                    name="prixAcquisition"
                    inputMode="decimal"
                    placeholder="3600"
                    className={cn(classeChamp, 'font-mono tabular-nums')}
                  />
                </Champ>

                <Champ label="Date d’acquisition" aide="Facultatif.">
                  <input name="dateAcquisition" type="date" className={classeChamp} />
                </Champ>

                <Champ
                  label="Valeur au 31/12/2025"
                  className="sm:col-span-2"
                  aide="Pour une position détenue avant 2026, c’est elle qui sert de point de départ à la taxe, pas le prix d’achat."
                >
                  <input
                    name="valeurReference2025"
                    inputMode="decimal"
                    placeholder="3910"
                    className={cn(classeChamp, 'font-mono tabular-nums')}
                  />
                </Champ>
              </div>
            </fieldset>
          )}

          {montreFonds && (
            <fieldset className="space-y-2.5 rounded-[var(--radius)] border border-border p-4">
              <legend className="px-1.5 text-[12px] text-text-muted">
                Traitement TOB — détermine le taux à la revente
              </legend>

              <label className="flex items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  name="capitalisant"
                  value="true"
                  className="size-4 accent-[var(--primary)]"
                />
                Fonds capitalisant
              </label>
              <label className="flex items-center gap-2.5 text-[13px]">
                <input
                  type="checkbox"
                  name="inscritEnBelgique"
                  value="true"
                  className="size-4 accent-[var(--primary)]"
                />
                Inscrit à la distribution en Belgique
              </label>
              <p className="text-[11px] leading-snug text-text-subtle">
                L’inscription se vérifie sur la liste de la FSMA, pas sur l’ISIN : un fonds
                luxembourgeois peut parfaitement être inscrit en Belgique.
              </p>
            </fieldset>
          )}

          {etat && !etat.ok && (
            <p role="alert" className="text-[12px] leading-relaxed text-negative">
              {etat.message}
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setOuvert(false)}
              className="min-h-11 rounded-[var(--radius)] border border-border px-4 text-[14px] transition-colors hover:bg-surface-hover"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={enCours}
              className="bouton-principal"
            >
              {enCours && <Loader2 className="size-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const classeChamp =
  'h-11 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-[14px] transition-colors focus:border-primary focus:outline-none';

function Champ({
  label,
  aide,
  className,
  children,
}: {
  label: string;
  aide?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="label-kpi block">{label}</span>
      {children}
      {aide && <span className="block text-[11px] leading-snug text-text-subtle">{aide}</span>}
    </label>
  );
}
