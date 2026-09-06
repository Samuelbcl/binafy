import { AlertTriangle } from 'lucide-react';

/**
 * Gabarit des pages légales.
 *
 * Un texte juridique se lit mal en pleine largeur : la colonne est bornée et
 * l'interlignage plus généreux que dans l'application.
 */

export function PageLegale({
  titre,
  miseAJour,
  aRelire = true,
  children,
}: {
  titre: string;
  miseAJour: string;
  /**
   * Signale que le texte n'a pas encore été relu par un juriste. Tant que
   * c'est le cas, mieux vaut le dire que de laisser croire le contraire.
   */
  aRelire?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-6 sm:py-16">
      <header>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] font-bold leading-tight tracking-[-0.02em]">
          {titre}
        </h1>
        <p className="mt-3 text-[13px] text-text-subtle">Dernière mise à jour : {miseAJour}</p>
      </header>

      {aRelire && (
        <div className="mt-6 flex gap-2.5 rounded-[var(--radius)] border border-warning/30 bg-warning/8 p-3.5">
          <AlertTriangle className="mt-px size-4 shrink-0 text-warning" />
          <p className="text-[12px] leading-relaxed text-text-muted">
            <span className="font-medium text-text">Document en cours de validation.</span> Ce
            texte décrit fidèlement le fonctionnement de Nestor, mais il n’a pas encore été relu
            par un juriste. Il sera mis à jour avant l’ouverture publique du service.
          </p>
        </div>
      )}

      <div className="legal mt-10 space-y-9">{children}</div>
    </div>
  );
}

export function Section({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-[18px] font-semibold tracking-tight">{titre}</h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-text-muted [&_a]:break-words [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_li]:pl-1 [&_strong]:text-text [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
