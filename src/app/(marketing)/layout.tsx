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
          <nav aria-label="Navigation du site" className="flex items-center gap-1.5">
            <Link
              href="/apprendre"
              className="inline-flex min-h-11 items-center rounded-full px-4 text-[13.5px] font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              Apprendre
            </Link>
            <Link
              href="/outils/frais-acquisition"
              className="inline-flex min-h-11 items-center rounded-full px-4 text-[13.5px] font-medium text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
            >
              Outils
            </Link>
            <Link href="/connexion" className="bouton-principal ml-1.5">
              Créer mon compte
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
          <nav aria-label="Liens de pied de page" className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { href: '/apprendre', libelle: 'Apprendre' },
              { href: '/outils/frais-acquisition', libelle: 'Frais d’acquisition' },
              { href: '/outils/interets-composes', libelle: 'Intérêts composés' },
              { href: '/outils/simulateur-patrimoine', libelle: 'Simulateur de patrimoine' },
              { href: '/outils/rendement-locatif', libelle: 'Rendement locatif' },
              { href: '/confidentialite', libelle: 'Confidentialité' },
              { href: '/conditions', libelle: 'Conditions' },
              { href: '/mentions-legales', libelle: 'Mentions légales' },
            ].map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="text-[13px] text-text-muted transition-colors hover:text-primary"
              >
                {lien.libelle}
              </Link>
            ))}
          </nav>

          <p className="mt-5 text-[12px] leading-relaxed text-text-subtle">
            Nestor informe, il ne conseille pas. Aucun texte de ce site ne constitue un conseil
            en investissement au sens de la réglementation FSMA, ni un conseil fiscal. Les
            simulations reposent sur des paramètres fiscaux belges dont la source et la date de
            vérification sont affichées sous chaque calcul.
          </p>
          <p className="mt-2 text-[12px] text-text-subtle">
            Biancola Studio, Liège — données hébergées dans l’Union européenne.
          </p>
        </div>
      </footer>
    </div>
  );
}
