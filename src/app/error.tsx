'use client';

import Link from 'next/link';
import { useEffect } from 'react';

/**
 * Écran d'erreur.
 *
 * Aucun détail technique n'est montré : un message d'erreur d'une application
 * financière peut contenir un identifiant, une requête, parfois un montant.
 * On affiche l'identifiant de trace, rien de plus.
 */
export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalisé côté serveur par Next. Jamais de montant dans un journal.
    console.error('Erreur applicative', error.digest ?? 'sans identifiant');
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 text-center">
      <h1 className="font-display text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight">
        Quelque chose s’est mal passé
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-text-muted">
        Tes données n’ont pas été affectées. Réessaie dans un instant — si le problème
        persiste, écris-nous.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] bg-primary px-5 text-[14px] font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-5 text-[14px] font-medium transition-colors hover:bg-surface-hover"
        >
          Retour au tableau de bord
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 font-mono text-[11px] text-text-subtle">
          Référence : {error.digest}
        </p>
      )}
    </div>
  );
}
