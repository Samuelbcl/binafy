import Link from 'next/link';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="grid size-8 place-items-center rounded-[10px] bg-primary font-display text-[15px] font-bold text-on-primary"
            >
              N
            </span>
            <span className="font-display text-[17px] font-semibold tracking-tight">Nestor</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center rounded-[var(--radius)] border border-border px-4 text-[13px] font-medium transition-colors hover:bg-surface-hover"
          >
            Voir la démo
          </Link>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
          <p className="text-[12px] leading-relaxed text-text-subtle">
            Nestor informe, il ne conseille pas. Aucun texte de ce site ne constitue un conseil
            en investissement au sens de la réglementation FSMA. Biancola Studio, Liège.
          </p>
        </div>
      </footer>
    </div>
  );
}
