'use client';

import {
  Building2,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  Moon,
  Plus,
  Receipt,
  LogOut,
  Settings,
  Sun,
  Target,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDiscretion, useEstMonte } from '@/components/providers';
import { cn } from '@/lib/cn';
import { supabaseNavigateur } from '@/lib/db/client';
import { MarqueNestor } from '@/components/ui/marque';

const NAVIGATION = [
  { href: '/dashboard', libelle: 'Vue d’ensemble', icone: LayoutDashboard },
  { href: '/patrimoine', libelle: 'Patrimoine', icone: Wallet },
  { href: '/budget', libelle: 'Budget', icone: Receipt },
  { href: '/projections', libelle: 'Projections', icone: TrendingUp },
  { href: '/objectifs', libelle: 'Objectifs', icone: Target },
  { href: '/fiscalite', libelle: 'Fiscalité', icone: Building2 },
] as const;

function BoutonDiscretion() {
  const { discret, basculer } = useDiscretion();

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={discret}
      title={discret ? 'Afficher les montants' : 'Masquer les montants'}
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      {discret ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      <span className="sr-only">
        {discret ? 'Afficher les montants' : 'Masquer les montants'}
      </span>
    </button>
  );
}

function BoutonTheme() {
  const { resolvedTheme, setTheme } = useTheme();
  // Le thème résolu n'est connu qu'après hydratation : sans ce garde-fou, le
  // serveur et le client rendraient deux icônes différentes.
  const monte = useEstMonte();

  const sombre = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? 'light' : 'dark')}
      title={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      {monte && sombre ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      <span className="sr-only">Changer de thème</span>
    </button>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <MarqueNestor />
    </Link>
  );
}

function LiensNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAVIGATION.map(({ href, libelle, icone: Icone }) => {
        const actif = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={actif ? 'page' : undefined}
            className={cn(
              'flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 text-[14px] transition-colors',
              actif
                ? 'bg-primary-soft font-semibold text-primary'
                : 'text-text-muted hover:bg-surface-hover hover:text-text',
            )}
          >
            <Icone className="size-[18px] shrink-0" />
            {libelle}
          </Link>
        );
      })}
    </nav>
  );
}


/**
 * Barre d'onglets mobile (docs/05).
 *
 * Un menu hamburger en haut à gauche est le point le plus difficile à atteindre
 * au pouce sur un écran de 390 px. Les quatre destinations les plus consultées
 * descendent donc en bas, et le tiroir du haut garde le reste — projections,
 * objectifs, paramètres.
 */
const ONGLETS = [
  { href: '/dashboard', libelle: 'Accueil', icone: LayoutDashboard },
  { href: '/patrimoine', libelle: 'Patrimoine', icone: Wallet },
  { href: '/budget', libelle: 'Budget', icone: Receipt },
  { href: '/fiscalite', libelle: 'Fiscalité', icone: Building2 },
] as const;

function BarreOnglets() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-border bg-surface px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden"
    >
      {ONGLETS.slice(0, 2).map(({ href, libelle, icone: Icone }) => (
        <OngletLien key={href} href={href} libelle={libelle} Icone={Icone} pathname={pathname} />
      ))}

      <Link
        href="/patrimoine#ajouter"
        className="grid size-13 shrink-0 place-items-center rounded-full bg-action text-on-action transition-colors hover:bg-action-hover"
      >
        <Plus className="size-[22px]" />
        <span className="sr-only">Ajouter un actif</span>
      </Link>

      {ONGLETS.slice(2).map(({ href, libelle, icone: Icone }) => (
        <OngletLien key={href} href={href} libelle={libelle} Icone={Icone} pathname={pathname} />
      ))}
    </nav>
  );
}

function OngletLien({
  href,
  libelle,
  Icone,
  pathname,
}: {
  href: string;
  libelle: string;
  Icone: typeof LayoutDashboard;
  pathname: string;
}) {
  const actif = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={actif ? 'page' : undefined}
      className={cn(
        'flex w-16 flex-col items-center gap-1 py-1 transition-colors',
        actif ? 'text-primary' : 'text-text-subtle hover:text-text',
      )}
    >
      <Icone className="size-[21px]" />
      <span className={cn('text-[10px]', actif ? 'font-bold' : 'font-medium')}>{libelle}</span>
    </Link>
  );
}

function BoutonDeconnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function deconnecter() {
    setEnCours(true);
    try {
      await supabaseNavigateur().auth.signOut();
      // `refresh()` vide le cache des Server Components : sans lui, les données
      // du compte précédent resteraient affichées.
      router.replace('/connexion');
      router.refresh();
    } catch {
      setEnCours(false);
    }
  }

  return (
    <button
      type="button"
      onClick={deconnecter}
      disabled={enCours}
      className="flex min-h-11 w-full items-center gap-3 rounded-[var(--radius)] px-3 text-[14px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text disabled:opacity-60"
    >
      <LogOut className="size-[18px]" />
      Se déconnecter
    </button>
  );
}

export function AppShell({
  children,
  email = null,
  modeDemo = true,
}: {
  children: React.ReactNode;
  /** Email de l'utilisateur connecté, `null` en mode démo. */
  email?: string | null;
  modeDemo?: boolean;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — fixe à partir de lg, tiroir en dessous. */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-border bg-surface px-4 py-5 transition-transform lg:translate-x-0',
          menuOuvert ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOuvert(false)}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted lg:hidden"
          >
            <X className="size-[18px]" />
            <span className="sr-only">Fermer le menu</span>
          </button>
        </div>

        <div className="mt-7 flex-1">
          <LiensNavigation onNavigate={() => setMenuOuvert(false)} />
        </div>

        <div className="border-t border-border pt-3">
          <Link
            href="/parametres"
            onClick={() => setMenuOuvert(false)}
            className="flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 text-[14px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Settings className="size-[18px]" />
            Paramètres
          </Link>
          {email ? (
            <>
              <p className="truncate px-3 pt-3 text-[11px] text-text-subtle" title={email}>
                {email}
              </p>
              <div className="pt-1">
                <BoutonDeconnexion />
              </div>
            </>
          ) : (
            <p className="px-3 pt-3 text-[11px] leading-relaxed text-text-subtle">
              {modeDemo ? (
                <>
                  Mode démo — données fictives.
                  <br />
                  Aucune donnée réelle n’est stockée.
                </>
              ) : (
                <>Session absente.</>
              )}
            </p>
          )}
        </div>
      </aside>

      {menuOuvert && (
        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMenuOuvert(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-border bg-bg/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOuvert(true)}
            className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted lg:hidden"
          >
            <Menu className="size-[18px]" />
            <span className="sr-only">Ouvrir le menu</span>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <BoutonDiscretion />
            <BoutonTheme />
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
        <BarreOnglets />
      </div>
    </div>
  );
}
