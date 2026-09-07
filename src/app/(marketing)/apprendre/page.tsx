import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { CouvertureGuide } from '@/components/apprendre/couverture';
import { GUIDES } from '@/lib/apprendre/guides';
import { CATEGORIES, LIBELLE_NIVEAU } from '@/lib/apprendre/types';

export const metadata: Metadata = {
  title: 'Apprendre — la fiscalité belge de l’épargne et de l’investissement',
  description:
    'Des guides écrits à partir des sources officielles belges, avec les calculs faits par le même moteur que l’application, et la date de vérification affichée.',
  alternates: { canonical: '/apprendre' },
};

export default function ApprendrePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
      <header className="max-w-2xl">
        <h1 className="text-[clamp(2rem,5vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
          Apprendre
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-text-muted">
          Le sujet « fiscalité belge de l’épargne » est mal servi en français : les
          résultats de recherche sont dominés par des contenus qui parlent de PEA et
          d’assurance-vie, deux choses qui n’existent pas ici. Ces guides partent des
          sources officielles belges, et chaque chiffre affiché est calculé par le même
          moteur que l’application.
        </p>
      </header>

      <section className="mt-12">
        <h2 className="sr-only">Guides</h2>
        <ul className="grid gap-5 sm:grid-cols-2">
          {GUIDES.map((guide) => {
            const categorie = CATEGORIES.find((c) => c.cle === guide.categorie);
            return (
              <li key={guide.slug}>
                <Link
                  href={`/apprendre/${guide.slug}`}
                  className="carte carte-interactive group flex h-full flex-col overflow-hidden"
                >
                  <CouvertureGuide slug={guide.slug} categorie={guide.categorie} />
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-2 text-[12px] text-text-muted">
                      <span className="font-semibold text-primary">
                        {categorie?.libelle}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{LIBELLE_NIVEAU[guide.niveau]}</span>
                      <span aria-hidden>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {guide.dureeMinutes} min
                      </span>
                    </div>
                    <h3 className="mt-3 text-[18px] font-bold leading-snug tracking-[-0.015em]">
                      {guide.titre}
                    </h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-text-muted">
                      {guide.resume}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                      Lire
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-[18px] font-bold tracking-[-0.015em]">Ce qui arrive</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-muted">
          Les guides sont écrits dans l’ordre des sujets les plus mal traités ailleurs.
          Ceux-ci sont en préparation :
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            'Droits d’enregistrement en Wallonie : 3 % ou 12,5 %',
            'Devenir indépendant complémentaire en Belgique',
            'Rendement locatif réel : pourquoi on n’est pas taxé sur les loyers',
            'Compte d’épargne réglementé : taux de base et prime de fidélité',
            'Épargne-pension : les deux plafonds',
          ].map((titre) => (
            <li
              key={titre}
              className="rounded-[var(--radius-lg)] bg-surface-2 px-4 py-3 text-[14px] text-text-muted"
            >
              {titre}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14 max-w-2xl text-[13px] leading-relaxed text-text-subtle">
        Nestor informe, il ne conseille pas. Ces guides expliquent des règles et
        chiffrent ce que chaque option coûte ; ils ne recommandent aucun placement, aucun
        produit et aucun établissement.
      </p>
    </div>
  );
}
