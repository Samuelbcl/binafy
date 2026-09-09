'use client';

import { Eye, EyeOff, LogOut, Menu, Moon, Plus, Settings, Sun, X } from 'lucide-react';
import { Icone } from '@/components/ui/icone';
import type { BaseIcone } from '@/lib/icones/solar';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, type CSSProperties, type PointerEvent as PointerEventReact } from 'react';
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
      { href: '/dashboard', libelle: 'Vue d’ensemble', icone: 'home-smile' },
      { href: '/patrimoine', libelle: 'Patrimoine', icone: 'wallet-money' },
      { href: '/budget', libelle: 'Budget', icone: 'bill-list' },
    ],
  },
  {
    titre: 'Comprendre',
    liens: [
      { href: '/apprendre', libelle: 'Apprendre', icone: 'book-2' },
      { href: '/outils', libelle: 'Outils', icone: 'calculator-minimalistic' },
    ],
  },
] as const;

const ONGLETS = [
  { href: '/dashboard', libelle: 'Accueil', icone: 'home-smile' },
  { href: '/patrimoine', libelle: 'Patrimoine', icone: 'wallet-money' },
  { href: '/budget', libelle: 'Budget', icone: 'bill-list' },
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
          {groupe.liens.map(({ href, libelle, icone }) => {
            const actif = pathname === href || pathname.startsWith(`${href}/`);
            // Sur telephone, le tiroir ne repete pas ce que la barre du bas
            // montre deja ; a partir de lg, la barre disparait et il porte tout.
            const dansOnglets = ONGLETS.some((o) => o.href === href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  'min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 text-[14px] transition-colors',
                  dansOnglets ? 'hidden lg:flex' : 'flex',
                  actif
                    ? 'bg-primary-soft font-semibold text-primary'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text',
                )}
              >
                <Icone nom={icone} style={actif ? 'bold' : 'linear'} className="size-5 shrink-0" />
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
 * Pour le moment, l'espace tient en trois écrans — accueil, patrimoine,
 * budget — et rien d'autre : Samuel veut avancer étape par étape, et chaque
 * écran de plus est un écran de moins bien fait. Fiscalité, projections et
 * objectifs restent dans le code, sans lien vers eux.
 *
 * Un menu hamburger en haut à gauche est le point le plus difficile à atteindre
 * au pouce sur un écran de 390 px. Les trois destinations descendent donc en bas. « Apprendre » n'en fait pas partie : il mène au site
 * public, et changer d'univers depuis la barre déroute. Il vit dans le tiroir,
 * avec les outils, les projections et les paramètres.
 */

/**
 * La barre d'onglets, en verre liquide.
 *
 * Detachee du bord, elle flotte en verre depoli, et l'onglet actif est sous
 * une lentille : une capsule de verre plus clair qui glisse d'un onglet a
 * l'autre en s'etirant au passage — c'est l'etirement qui fait le liquide,
 * pas un rebond. La lentille suit aussi le doigt : on peut la faire glisser
 * le long de la barre et la lacher sur un onglet.
 *
 * Deux choix techniques qui evitent les bugs de la version precedente : plus
 * de masque radial (Safari le combine mal avec le flou d'arriere-plan), et un
 * seul mouvement par element — la translation sur la lentille, l'etirement
 * sur son verre interieur. Deux courbes superposees sur le meme element, et
 * ca traine.
 *
 * La lentille se deplace des qu'on touche un onglet, sans attendre que la
 * page arrive : `vise` porte l'onglet choisi jusqu'a ce que l'URL le
 * confirme. Sinon la barre semble hesiter pendant le chargement.
 */
function BarreOnglets() {
  const pathname = usePathname();
  const router = useRouter();
  const nav = useRef<HTMLElement>(null);
  const n = ONGLETS.length;
  const indexActif = ONGLETS.findIndex(
    (o) => pathname === o.href || pathname.startsWith(`${o.href}/`),
  );

  // L'onglet vise porte l'URL depuis laquelle on l'a choisi : des que l'URL
  // change, il ne compte plus et l'onglet reel reprend la main. Pas d'effet
  // pour le remettre a zero — il devient caduc de lui-meme.
  const [vise, setVise] = useState<{ idx: number; depuis: string } | null>(null);
  const [glisse, setGlisse] = useState<number | null>(null);
  const aGlisse = useRef(false);
  const departX = useRef(0);

  const index = vise && vise.depuis === pathname ? vise.idx : indexActif;

  /** Largeur d'une case, en pixels — la barre a 6 px de marge interieure. */
  function largeurCase(el: HTMLElement) {
    return (el.clientWidth - 12) / n;
  }

  function surPointerDown(e: PointerEventReact<HTMLElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    departX.current = e.clientX;
    aGlisse.current = false;
  }

  function surPointerMove(e: PointerEventReact<HTMLElement>) {
    if (e.buttons === 0) return;
    if (!aGlisse.current && Math.abs(e.clientX - departX.current) < 8) return;
    aGlisse.current = true;
    const el = nav.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const l = largeurCase(el);
    // La lentille se centre sous le doigt, sans sortir de la barre.
    setGlisse(Math.max(0, Math.min(el.clientWidth - 12 - l, e.clientX - r.left - 6 - l / 2)));
  }

  function surPointerFin(e: PointerEventReact<HTMLElement>) {
    if (!aGlisse.current) return;
    const el = nav.current;
    if (el) {
      const r = el.getBoundingClientRect();
      const idx = Math.max(0, Math.min(n - 1, Math.floor((e.clientX - r.left - 6) / largeurCase(el))));
      const cible = ONGLETS[idx];
      if (cible && idx !== indexActif) {
        setVise({ idx, depuis: pathname });
        router.push(cible.href);
      }
    }
    setGlisse(null);
    // Le clic qui suit un glissement ne doit pas naviguer une deuxieme fois.
    window.setTimeout(() => {
      aGlisse.current = false;
    }, 0);
  }

  const transform =
    glisse !== null ? `translateX(${glisse}px)` : `translateX(${Math.max(0, index) * 100}%)`;

  return (
    <nav
      ref={nav}
      aria-label="Navigation principale"
      className="barre-onglets fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 lg:hidden"
      style={{ '--onglets': n } as CSSProperties}
      data-glisse={glisse !== null ? '' : undefined}
      onPointerDown={surPointerDown}
      onPointerMove={surPointerMove}
      onPointerUp={surPointerFin}
      onPointerCancel={surPointerFin}
    >
      {index >= 0 && (
        <span aria-hidden className="lentille" style={{ transform }}>
          {/* Remontee a chaque changement d'onglet : c'est ce qui rejoue l'etirement. */}
          <span key={index} className="lentille-verre" />
        </span>
      )}
      {ONGLETS.map(({ href, libelle, icone }, i) => (
        <OngletLien
          key={href}
          href={href}
          libelle={libelle}
          icone={icone}
          actif={i === index}
          onClick={(e) => {
            if (aGlisse.current) {
              e.preventDefault();
              return;
            }
            setVise({ idx: i, depuis: pathname });
          }}
        />
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
  return (
    <Link
      href="/patrimoine#ajouter"
      className="bouton-flottant fixed right-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30 lg:hidden"
    >
      <Plus className="size-6" />
      <span className="sr-only">Ajouter un actif</span>
    </Link>
  );
}

function OngletLien({
  href,
  libelle,
  icone,
  actif,
  onClick,
}: {
  href: string;
  libelle: string;
  icone: BaseIcone;
  actif: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      aria-current={actif ? 'page' : undefined}
      onClick={onClick}
      draggable={false}
      className={cn(
        'onglet relative z-10 flex h-full flex-col items-center justify-center gap-0.5 rounded-full transition-colors duration-300',
        actif ? 'text-text' : 'text-text-muted',
      )}
    >
      {/* Pleine quand on y est, au trait sinon : l'onglet actif se reconnait
          a la forme avant la couleur — et la lentille fait le reste. */}
      <Icone nom={icone} style={actif ? 'bold' : 'linear'} className="size-[22px]" />
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
