'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { useTransition } from 'react';
import { supprimerObjectif } from '@/app/(app)/objectifs/actions';

/**
 * Suppression d'un objectif, avec une confirmation.
 *
 * Sur un téléphone, le pouce rate. Une suppression sans question est une
 * suppression accidentelle qui attend son heure — et un objectif, ce n'est pas
 * une ligne qu'on ressaisit en dix secondes.
 */
export function BoutonSupprimer({ id, nom }: { id: string; nom: string }) {
  const [enCours, demarrer] = useTransition();

  return (
    <button
      type="button"
      disabled={enCours}
      onClick={() => {
        if (!window.confirm(`Supprimer « ${nom} » ? L’objectif disparaît, pas les comptes rattachés.`)) return;
        demarrer(() => supprimerObjectif(id));
      }}
      aria-label={`Supprimer ${nom}`}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-text-subtle transition-colors hover:bg-surface-hover hover:text-negative disabled:opacity-50"
    >
      {enCours ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
