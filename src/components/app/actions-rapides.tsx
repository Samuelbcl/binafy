import Link from 'next/link';
import { ChartLineUp, FileArrowUp, Plus, Target } from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Teinte } from '@/components/ui/pastille-icone';
import { cn } from '@/lib/cn';

/**
 * Les quatre gestes du quotidien, sous le chiffre principal.
 *
 * Ajouter un actif, importer un extrait, poser un objectif, simuler : ils
 * étaient dispersés sur quatre pages. Réunis ici en tuiles pastel — chacune sa
 * couleur, la même que celle du sujet ailleurs dans l'app —, ils sont à un
 * pouce du premier écran. C'est la seule chose des maquettes de référence qui
 * change vraiment l'usage : le reste est de la matière.
 */
const ACTIONS: readonly { href: string; libelle: string; icone: Icon; teinte: Teinte }[] = [
  { href: '/patrimoine#ajouter', libelle: 'Ajouter', icone: Plus, teinte: 'violet' },
  { href: '/budget', libelle: 'Importer', icone: FileArrowUp, teinte: 'terre' },
  { href: '/objectifs/nouveau', libelle: 'Objectif', icone: Target, teinte: 'rose' },
  { href: '/projections', libelle: 'Simuler', icone: ChartLineUp, teinte: 'menthe' },
];

const CLASSE_TEINTE: Record<Teinte, string> = {
  violet: 'pastille-violet',
  menthe: 'pastille-menthe',
  ambre: 'pastille-ambre',
  rose: 'pastille-rose',
  azur: 'pastille-azur',
  lagune: 'pastille-lagune',
  terre: 'pastille-terre',
};

export function ActionsRapides({ className }: { className?: string }) {
  return (
    <ul className={cn('grid grid-cols-4 gap-3', className)}>
      {ACTIONS.map(({ href, libelle, icone: Icone, teinte }) => (
        <li key={href}>
          <Link href={href} className="group flex flex-col items-center gap-1.5">
            <span className={cn('tuile', CLASSE_TEINTE[teinte])}>
              <Icone weight="regular" className="size-6" />
            </span>
            <span className="text-[11.5px] font-medium text-text-muted transition-colors group-hover:text-text">
              {libelle}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
