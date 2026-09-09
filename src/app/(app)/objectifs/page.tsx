import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { BoutonSupprimer } from '@/components/objectifs/bouton-supprimer';
import { CarteObjectif } from '@/components/objectifs/carte-objectif';
import { FriseObjectifs } from '@/components/objectifs/frise-objectifs';
import { EtatVide } from '@/components/ui/etat-vide';
import { Jauge } from '@/components/ui/jauge';
import { calculerEpargnePrecaution } from '@/lib/finance/epargne';
import { formatEUR } from '@/lib/money';
import { chargerContexteObjectifs } from '@/lib/objectifs/contexte';

export const metadata: Metadata = {
  title: 'Objectifs',
  description: 'Ce que tu vises, et où tu en es.',
};

/**
 * Module objectifs (doc 02 § module 5).
 *
 * Un titre, la frise, les cartes, et en bas le matelas de sécurité — l'objectif
 * qui passe avant tous les autres, dont la cible se calcule depuis les charges
 * fixes du budget. Rien d'autre : chaque carte dit déjà où on en est et ce qui
 * sépare de la cible.
 */
export default async function ObjectifsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { cree } = await searchParams;
  const ctx = await chargerContexteObjectifs();

  const precaution = calculerEpargnePrecaution({
    chargesFixesMensuellesCents: ctx.chargesFixesCents,
    moisDeCouverture: 4,
    dejaEpargneCents: ctx.epargneLiquideCents,
    capaciteEpargneMensuelleCents: ctx.capaciteMensuelleCents,
  });
  const matelas = ctx.objectifs.find((o) => o.type === 'precaution');

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="titre-degrade text-[30px] font-bold tracking-tight">Objectifs</h1>

      {cree === '1' && (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-[var(--radius)] bg-positive/12 px-4 py-3 text-[13.5px] font-medium text-positive"
        >
          <Check className="size-4 shrink-0" strokeWidth={2.5} />
          Objectif créé.
        </p>
      )}

      {ctx.objectifs.length === 0 ? (
        <section className="carte p-5 sm:p-6">
          <EtatVide
            titre="Ton premier objectif"
            texte="Commence par le matelas de sécurité : trois à six mois de charges, disponibles tout de suite."
            action={{ href: '/objectifs/nouveau?inspiration=matelas', libelle: 'Commencer' }}
          />
        </section>
      ) : (
        <>
          <FriseObjectifs objectifs={ctx.objectifs} />
          <div className="grid gap-3 sm:grid-cols-2">
            {ctx.objectifs.map((objectif) => (
              <CarteObjectif
                key={objectif.id}
                objectif={objectif}
                action={!ctx.demo && <BoutonSupprimer id={objectif.id} nom={objectif.nom} />}
              />
            ))}
          </div>
        </>
      )}

      {/* Le matelas de sécurité, en une carte. Chez d'autres, c'est payant. */}
      {!matelas && (
        <section className="carte p-5 sm:p-6">
          <h2 className="text-[20px] font-bold">Ton matelas de sécurité</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-text-muted">
            Trois à six mois de charges, de côté, avant tout le reste.
          </p>
          {ctx.chargesFixesCents > 0 && (
            <Jauge
              className="mt-4"
              label="Déjà de côté"
              valeurCents={ctx.epargneLiquideCents}
              cibleCents={precaution.result.cibleCents}
              ton="positif"
              precision={
                precaution.result.resteAConstituerCents === 0
                  ? 'Quatre mois de charges sont couverts.'
                  : `Encore ${formatEUR(precaution.result.resteAConstituerCents, { decimals: 0 })} pour couvrir quatre mois.`
              }
            />
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/objectifs/nouveau?inspiration=matelas" className="bouton-chaud">
              Créer cet objectif
            </Link>
            <Link href="/apprendre/matelas-de-securite-belgique" className="bouton-secondaire">
              Pourquoi
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
