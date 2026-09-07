import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { OUTILS } from '@/lib/outils';

const TITRE = 'Outils gratuits — fiscalité et patrimoine belges';
const DESCRIPTION =
  'Sept calculateurs qui appliquent la fiscalité belge : frais d’acte par Région, capacité d’emprunt, rendement locatif net d’impôt, indépendant complémentaire. Sans compte, sans e-mail.';

export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  alternates: { canonical: '/outils' },
  openGraph: { title: TITRE, description: DESCRIPTION, url: '/outils' },
};

export default function OutilsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
      <header className="max-w-2xl">
        <p className="label-kpi">Sans compte, sans e-mail</p>
        <h1 className="mt-3 text-[clamp(1.85rem,4.5vw,2.6rem)] font-extrabold leading-[1.1] tracking-[-0.03em]">
          Les outils
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-text-muted">
          Chacun applique les règles belges plutôt que les françaises, montre le détail de son
          calcul, et cite ses sources avec leur date de vérification. L’état de chaque simulation
          tient dans l’URL : un lien se partage et se rejoue tel quel.
        </p>
      </header>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {OUTILS.map(({ href, titre, description, icone, teinte }) => (
          <li key={href}>
            <Link href={href} className="carte carte-interactive group flex h-full flex-col p-5">
              <PastilleIcone icone={icone} teinte={teinte} />
              <h2 className="mt-4 text-[16px] font-bold">{titre}</h2>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-text-muted">
                {description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                Ouvrir
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="carte mt-12 p-6 sm:p-8">
        <h2 className="text-[18px] font-bold tracking-[-0.01em]">
          Pourquoi ils sont gratuits et sans compte
        </h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-text-muted">
          Un calculateur qui demande une adresse e-mail avant de rendre son résultat n’est pas un
          outil, c’est un formulaire. Ceux-ci répondent d’abord. Si le résultat t’a servi, l’étape
          suivante est de suivre tes vrais chiffres dans l’application — mais c’est ton choix, pas
          un péage.
        </p>
      </section>
    </div>
  );
}
