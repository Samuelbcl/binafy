import Link from 'next/link';

export default function PageIntrouvable() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-12 text-center">
      <p className="font-mono text-[13px] tabular-nums text-text-subtle">404</p>
      <h1 className="mt-3 font-display text-[clamp(1.5rem,4vw,2rem)] font-semibold tracking-tight">
        Cette page n’existe pas
      </h1>
      <p className="mt-3 max-w-md text-[14px] leading-relaxed text-text-muted">
        Le lien est peut-être périmé, ou l’adresse comporte une faute de frappe.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="bouton-principal"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/outils/frais-acquisition"
          className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-5 text-[14px] font-medium transition-colors hover:bg-surface-hover"
        >
          Voir les outils
        </Link>
      </div>
    </div>
  );
}
