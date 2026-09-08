import Link from 'next/link';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { demonstration } from '@/lib/apprendre/demonstrations';
import type { BlocGuide } from '@/lib/apprendre/types';
import { PanneauExplication } from '@/components/ui/panneau-explication';

/**
 * Rendu d'un guide.
 *
 * Le seul point qui mérite attention : un bloc `demonstration` n'affiche pas un
 * texte, il **exécute le calculateur** et rend son détail par le même panneau
 * que l'application. Un guide ne peut donc pas afficher un chiffre que l'app
 * contredirait — et le lecteur voit d'où il sort, ligne à ligne, avec ses
 * sources.
 */

function Bloc({ bloc }: { bloc: BlocGuide }) {
  switch (bloc.type) {
    case 'titre':
      return (
        <h2 className="mt-12 scroll-mt-24 text-[22px] tracking-[-0.02em] first:mt-0">
          {bloc.texte}
        </h2>
      );

    case 'para':
      return <p className="mt-5 text-[16px] leading-[1.7] text-text">{bloc.texte}</p>;

    case 'liste':
      return (
        <ul className="mt-5 space-y-2.5">
          {bloc.items.map((item) => (
            <li key={item} className="flex gap-3 text-[16px] leading-[1.7]">
              <span
                aria-hidden
                className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'piege':
      return (
        <aside className="mt-8 rounded-[var(--radius-lg)] border border-warning/25 bg-warning/8 p-5">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-[18px] shrink-0 text-warning" />
            <h3 className="text-[15px] font-bold">{bloc.titre}</h3>
          </div>
          <p className="mt-3 text-[15px] leading-[1.65] text-text-muted">{bloc.texte}</p>
        </aside>
      );

    case 'note':
      return (
        <aside className="mt-8 rounded-[var(--radius-lg)] bg-surface-2 p-5">
          <div className="flex items-center gap-2.5">
            <Info className="size-[18px] shrink-0 text-text-muted" />
            <h3 className="text-[15px] font-bold">{bloc.titre}</h3>
          </div>
          <p className="mt-3 text-[15px] leading-[1.65] text-text-muted">{bloc.texte}</p>
        </aside>
      );

    case 'demonstration': {
      const demo = demonstration(bloc.cle);
      if (!demo) return null;
      return (
        <section className="mt-8">
          <h3 className="text-[15px] font-bold">{bloc.titre}</h3>
          {bloc.introduction && (
            <p className="mt-2 text-[15px] leading-[1.65] text-text-muted">
              {bloc.introduction}
            </p>
          )}
          <p className="mt-3 text-[15px] leading-[1.65] text-text-muted">{demo.enonce}</p>
          <PanneauExplication
            calcul={demo.resultat}
            titre="Le calcul, ligne par ligne"
            ouvertParDefaut
            className="mt-4"
          />
        </section>
      );
    }

    case 'outil':
      return (
        <Link
          href={bloc.href}
          className="carte carte-interactive mt-8 flex items-center gap-4 p-5"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold">{bloc.libelle}</span>
            <span className="mt-1 block text-[14px] leading-relaxed text-text-muted">
              {bloc.texte}
            </span>
          </span>
          <ArrowRight className="size-[18px] shrink-0 text-primary" />
        </Link>
      );
  }
}

export function RenduGuide({ blocs }: { blocs: readonly BlocGuide[] }) {
  return (
    <div>
      {blocs.map((bloc, i) => (
        <Bloc key={`${bloc.type}-${i}`} bloc={bloc} />
      ))}
    </div>
  );
}
