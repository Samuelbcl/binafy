import Link from 'next/link';
import { Icone } from '@/components/ui/icone';
import type { BaseIcone } from '@/lib/icones/solar';
import type { Teinte } from '@/components/ui/pastille-icone';
import { cn } from '@/lib/cn';

/**
 * Les trois gestes du quotidien, sous le chiffre principal.
 *
 * Ajouter un actif, importer un extrait, apprendre : ils étaient dispersés sur
 * trois pages. Réunis ici en tuiles pastel — chacune sa
 * couleur, la même que celle du sujet ailleurs dans l'app —, ils sont à un
 * pouce du premier écran. C'est la seule chose des maquettes de référence qui
 * change vraiment l'usage : le reste est de la matière.
 */
const ACTIONS: readonly { href: string; libelle: string; icone: BaseIcone; teinte: Teinte }[] = [
  { href: '/patrimoine#ajouter', libelle: 'Ajouter', icone: 'add-circle', teinte: 'violet' },
  { href: '/budget', libelle: 'Importer', icone: 'file-send', teinte: 'terre' },
  { href: '/apprendre', libelle: 'Apprendre', icone: 'book-2', teinte: 'azur' },
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
    <ul className={cn('grid grid-cols-3 gap-3', className)}>
      {ACTIONS.map(({ href, libelle, icone, teinte }) => (
        <li key={href}>
          <Link href={href} className="group flex flex-col items-center gap-1.5">
            <span className={cn('tuile', CLASSE_TEINTE[teinte])}>
              <Icone nom={icone} style="bold-duotone" className="size-6" />
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
