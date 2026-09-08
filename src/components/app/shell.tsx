'use client';

import { Eye, EyeOff, LogOut, Menu, Moon, Plus, Settings, Sun, X } from 'lucide-react';
import {
  BookOpen,
  Buildings,
  Calculator,
  Receipt,
  SquaresFour,
  Target,
  TrendUp,
  Wallet,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { useDiscretion, useEstMonte } from '@/components/providers';
import { cn } from '@/lib/cn';
import { supabaseNavigateur } from '@/lib/db/client';
import { MarqueNestor } from '@/components/ui/marque';

/**
 * Navigation de l'application, en deux groupes.
 *
 * Les outils et les guides n'existaient que sur le site public : une fois
 * connecté, on ne pouvait plus les atteindre. Or c'est connecté qu'on en a le
 * plus besoin — on lit un guide sur la TOB parce qu'on vient de voir une ligne
 * de TOB dans son propre portefeuille. Ils deviennent donc un groupe à part
 * entière de la barre latérale, pas une ligne perdue dans les paramètres.
 */
const NAVIGATION = [
  {
    titre: 'Mon patrimoine',
    liens: [
      { href: '/dashboard', libelle: 'Vue d’ensemble', icone: SquaresFour },
      { href: '/patrimoine', libelle: 'Patrimoine', icone: Wallet },
      { href: '/budget', libelle: 'Budget', icone: Receipt },
      { href: '/projections', libelle: 'Projections', icone: TrendUp },
      { href: '/objectifs', libelle: 'Objectifs', icone: Target },
      { href: '/fiscalite', libelle: 'Fiscalité', icone: Buildings },
    ],
  },
  {
    titre: 'Comprendre',
    liens: [
      { href: '/apprendre', libelle: 'Apprendre', icone: BookOpen },
      { href: '/outils', libelle: 'Outils', icone: Calculator },
    ],
  },
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

  // Avant l'hydratation, on ignore le theme : `sombre` reste faux, et tout ce
  // qui en depend — l'icone comme l'infobulle — doit passer par `monte`. Sans
  // ca, l'infobulle differe entre serveur et client et React signale une
  // divergence a chaque chargement en sombre.
  const sombre = monte && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(sombre ? 'light' : 'dark')}
      title={sombre ? 'Passer en thème clair' : 'Passer en thème sombre'}
      className="inline-flex size-11 items-center justify-center rounded-[var(--radius)] text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      {sombre ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      <span className="sr-only">Changer de thème</span>
    </button>
  );
}

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      {/* Sobre : la carte d'accent est a soixante pixels, et deux surfaces
          violettes sur le meme ecran ne designent plus rien. */}
      <MarqueNestor ton="sobre" />
    </Link>
  );
}

function LiensNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6">
      {NAVIGATION.map((groupe) => (
        <div key={groupe.titre} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1.5 text-[11.5px] font-semibold text-text-subtle">
            {groupe.titre}
          </p>
          {groupe.liens.map(({ href, libelle, icone: Icone }) => {
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
                <Icone weight={actif ? 'fill' : 'regular'} className="size-5 shrink-0" />
                {libelle}
              </Link>
            );
          })}
        </div>
      ))}
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
  { href: '/dashboard', libelle: 'Accueil', icone: SquaresFour },
  { href: '/patrimoine', libelle: 'Patrimoine', icone: Wallet },
  { href: '/budget', libelle: 'Budget', icone: Receipt },
  { href: '/fiscalite', libelle: 'Fiscalité', icone: Buildings },
  { href: '/apprendre', libelle: 'Apprendre', icone: BookOpen },
] as const;

/**
 * La barre est detachee du bord et flotte en verre depoli. L'onglet actif
 * remonte dans une bulle qui glisse d'un onglet a l'autre — et la barre se
 * creuse autour d'elle : la position de la bulle est une variable CSS enregistree
 * (`--bulle-x`), donc le masque qui decoupe l'encoche suit le meme mouvement
 * que la bulle, avec la meme courbe. Un seul element bouge ; tout le reste
 * en decoule.
 */
function BarreOnglets() {
  const pathname = usePathname();
  const indexActif = ONGLETS.findIndex(
    (o) => pathname === o.href || pathname.startsWith(`${o.href}/`),
  );
  const part = 100 / ONGLETS.length;
  const bulleX = `${(indexActif < 0 ? 0 : indexActif) * part + part / 2}%`;

  return (
    <nav
      aria-label="Navigation principale"
      className="barre-onglets fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden"
      style={{ '--bulle-x': bulleX } as CSSProperties}
      data-sans-bulle={indexActif < 0 ? '' : undefined}
    >
      <span aria-hidden className="bulle-onglet" />
      {ONGLETS.map(({ href, libelle, icone: Icone }) => (
        <OngletLien key={href} href={href} libelle={libelle} Icone={Icone} pathname={pathname} />
      ))}
    </nav>
  );
}

/**
 * Ajout d'un actif.
 *
 * Occupait le centre de la barre d'onglets, ce qui coûtait une destination et
 * envoyait vers `/patrimoine#ajouter` même depuis le budget. En bouton flottant,
 * il reste sous le pouce sans manger de place, et la cinquième destination
 * revient à l'apprentissage.
 */
function BoutonAjout() {
  const pathname = usePathname();
  // Sur les objectifs, le « + » cree un objectif ; partout ailleurs, un actif.
  // Et sur l'ecran de creation lui-meme, il n'a rien a proposer.
  const objectifs = pathname.startsWith('/objectifs');
  if (pathname === '/objectifs/nouveau') return null;

  return (
    <Link
      href={objectifs ? '/objectifs/nouveau' : '/patrimoine#ajouter'}
      className="bouton-flottant fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden"
    >
      <Plus className="size-6" />
      <span className="sr-only">{objectifs ? 'Nouvel objectif' : 'Ajouter un actif'}</span>
    </Link>
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
  Icone: Icon;
  pathname: string;
}) {
  const actif = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={actif ? 'page' : undefined}
      className={cn(
        'onglet relative z-10 flex flex-col items-center justify-end gap-1 pb-2',
        actif ? 'text-primary' : 'text-text-subtle hover:text-text',
      )}
    >
      {/* L'icone monte dans la bulle quand l'onglet est actif : pleine et
          blanche sur le violet ; au trait sinon, a sa place dans la barre. */}
      <span
        className={cn(
          'grid size-11 place-items-center transition-[transform,color] duration-[480ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]',
          actif ? '-translate-y-8 text-white' : 'translate-y-0',
        )}
      >
        <Icone weight={actif ? 'fill' : 'regular'} className="size-6" />
      </span>
      <span className="text-[10.5px] font-medium">{libelle}</span>
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

          {/* La marque sur chaque ecran mobile. La barre laterale la porte a
              partir de lg ; en dessous, sans elle, l'en-tete n'etait qu'une
              rangee d'icones qui ne disait pas ou l'on etait. */}
          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <BoutonDiscretion />
            <BoutonTheme />
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-32 sm:px-6 lg:px-8 lg:pb-8">{children}</main>
        <BoutonAjout />
        <BarreOnglets />
      </div>
    </div>
  );
}
