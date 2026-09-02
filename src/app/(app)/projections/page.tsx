import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Calculator, Home, LineChart, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  title: 'Projections',
  description: 'Les quatre simulateurs, tous paramétrables par URL.',
};

const SIMULATEURS = [
  {
    href: '/outils/frais-acquisition',
    titre: 'Frais d’acquisition et capacité d’emprunt',
    description:
      'Le cash réel à sortir le jour de l’acte, par Région, et ce que coûte un locatif acheté avant sa résidence principale.',
    icone: Home,
    disponible: true,
  },
  {
    href: '/outils/interets-composes',
    titre: 'Intérêts composés',
    description:
      'Capital, versements, durée, rendement — avec la version nette de fiscalité belge.',
    icone: Calculator,
    disponible: true,
  },
  {
    href: '/outils/simulateur-patrimoine',
    titre: 'Simulateur de patrimoine',
    description:
      'Projection nominale et réelle, rente soutenable, année d’indépendance financière.',
    icone: LineChart,
    disponible: false,
  },
  {
    href: '/outils/rendement-locatif',
    titre: 'Rendement locatif belge',
    description:
      'Rendement brut, net de charges, net d’impôt, et cash-flow mensuel réel avec crédit.',
    icone: PiggyBank,
    disponible: false,
  },
];

export default function ProjectionsPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight">Projections</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-text-muted">
          Chaque simulateur encode son état dans l’URL : un lien partagé rejoue exactement la
          simulation. Et chacun affiche d’où viennent ses chiffres.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SIMULATEURS.map(({ href, titre, description, icone: Icone, disponible }) => {
          const contenu = (
            <>
              <div className="flex items-start justify-between gap-3">
                <Icone className={cn('size-5', disponible ? 'text-primary' : 'text-text-subtle')} />
                {!disponible && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-text-subtle">
                    Moteur prêt, écran à venir
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-display text-[16px] font-semibold">{titre}</h2>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-text-muted">
                {description}
              </p>
              {disponible && (
                <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                  Ouvrir
                  <ArrowRight className="size-3.5" />
                </span>
              )}
            </>
          );

          return disponible ? (
            <Link key={href} href={href} className="carte carte-interactive flex flex-col p-5">
              {contenu}
            </Link>
          ) : (
            <div key={href} className="carte flex flex-col p-5 opacity-70">
              {contenu}
            </div>
          );
        })}
      </div>

      <p className="text-[12px] leading-relaxed text-text-subtle">
        Les quatre moteurs de calcul sont écrits et testés dans{' '}
        <code className="text-text-muted">src/lib/finance</code>. Les deux écrans restants
        n’attendent que leur interface.
      </p>
    </div>
  );
}
