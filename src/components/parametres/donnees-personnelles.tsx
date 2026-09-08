'use client';

import { AlertTriangle, Download, Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActionState, useId, useState } from 'react';
import { demanderSuppression } from '@/app/(app)/parametres/actions';
import { supabaseNavigateur } from '@/lib/db/client';

/**
 * Portabilité et effacement (RGPD).
 *
 * L'export se télécharge directement. La suppression demande une confirmation
 * tapée : un compte de suivi patrimonial contient des mois de saisie, un clic
 * malencontreux ne doit pas suffire à tout effacer.
 */
export function DonneesPersonnelles({ resume }: { resume: Record<string, number> }) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);
  const idConfirmation = useId();

  const [etat, action, enCours] = useActionState(
    async (precedent: Awaited<ReturnType<typeof demanderSuppression>> | null, donnees: FormData) => {
      const resultat = await demanderSuppression(precedent, donnees);

      if (resultat.ok) {
        // La session locale doit disparaître avec le compte, sinon le cookie
        // pointerait vers un utilisateur supprimé.
        try {
          await supabaseNavigateur().auth.signOut();
        } catch {
          // Sans session à fermer, la redirection suffit.
        }
        router.replace('/');
        // Vide le cache des Server Components : sans cela, les pages rendues
        // pour le compte supprimé resteraient en mémoire côté client.
        router.refresh();
      }

      return resultat;
    },
    null,
  );

  const libelles: Record<string, string> = {
    assets: 'actifs',
    liabilities: 'passifs',
    transactions: 'transactions',
    goals: 'objectifs',
    net_worth_snapshots: 'instantanés de patrimoine',
  };

  const total = Object.values(resume).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-4">
      <section className="carte p-5 sm:p-6">
        <h2 className="font-display text-[17px]">Exporter mes données</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Récupère l’intégralité de ce que Nestor conserve sur toi, au format JSON : profil,
          actifs, passifs, transactions, objectifs et historique. C’est ton droit à la
          portabilité, et c’est aussi une sauvegarde.
        </p>

        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-text-subtle">
          {Object.entries(resume).map(([table, nombre]) => (
            <li key={table}>
              <span className="font-mono tabular-nums text-text-muted">{nombre}</span>{' '}
              {libelles[table] ?? table}
            </li>
          ))}
        </ul>

        <a
          href="/api/rgpd/export"
          download
          className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] border border-border px-4 text-[14px] font-medium transition-colors hover:bg-surface-hover"
        >
          <Download className="size-4" />
          Télécharger l’export
        </a>

        <p className="mt-3 text-[11px] leading-relaxed text-text-subtle">
          Le fichier contient des données financières personnelles. Conserve-le en lieu sûr.
        </p>
      </section>

      <section className="carte border-negative/25 p-5 sm:p-6">
        <h2 className="font-display text-[17px]">Supprimer mon compte</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-text-muted">
          Efface définitivement ton compte et {total > 0 ? `les ${total} enregistrements` : 'les données'}{' '}
          qui s’y rattachent. L’opération est immédiate et irréversible : aucune sauvegarde
          n’est conservée de notre côté.
        </p>

        {!confirmationOuverte ? (
          <button
            type="button"
            onClick={() => setConfirmationOuverte(true)}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] border border-negative/40 px-4 text-[14px] font-medium text-negative transition-colors hover:bg-negative/10"
          >
            <Trash2 className="size-4" />
            Supprimer mon compte
          </button>
        ) : (
          <form action={action} className="mt-5 space-y-4">
            <div className="flex gap-2.5 rounded-[var(--radius)] border border-negative/30 bg-negative/8 p-3">
              <AlertTriangle className="mt-px size-4 shrink-0 text-negative" />
              <p className="text-[12px] leading-relaxed text-text-muted">
                Pense à télécharger ton export avant de continuer. Une fois le compte supprimé,
                rien ne peut être restauré.
              </p>
            </div>

            <label htmlFor={idConfirmation} className="block space-y-1.5">
              <span className="label-kpi block">
                Tape SUPPRIMER pour confirmer
              </span>
              <input
                id={idConfirmation}
                name="confirmation"
                required
                autoComplete="off"
                placeholder="SUPPRIMER"
                className="h-11 w-full max-w-xs rounded-[var(--radius)] border border-border bg-surface-2 px-3 font-mono text-[14px] transition-colors focus:border-negative focus:outline-none"
              />
            </label>

            {etat && !etat.ok && (
              <p role="alert" className="text-[12px] leading-relaxed text-negative">
                {etat.message}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmationOuverte(false)}
                className="min-h-11 rounded-[var(--radius)] border border-border px-4 text-[14px] transition-colors hover:bg-surface-hover"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={enCours}
                className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius)] bg-negative px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enCours && <Loader2 className="size-4 animate-spin" />}
                Supprimer définitivement
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
