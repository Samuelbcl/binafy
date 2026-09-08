import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Plus, Upload } from 'lucide-react';
import { ShieldCheck } from '@phosphor-icons/react/dist/ssr';
import { BoutonSupprimer } from '@/components/objectifs/bouton-supprimer';
import { CarteObjectif } from '@/components/objectifs/carte-objectif';
import { FriseObjectifs } from '@/components/objectifs/frise-objectifs';
import { EtatVide } from '@/components/ui/etat-vide';
import { Jauge } from '@/components/ui/jauge';
import { PanneauExplication } from '@/components/ui/panneau-explication';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { cn } from '@/lib/cn';
import { calculerEpargnePrecaution } from '@/lib/finance/epargne';
import { etatObjectif } from '@/lib/finance/objectifs';
import { formatEUR } from '@/lib/money';
import { chargerContexteObjectifs } from '@/lib/objectifs/contexte';

export const metadata: Metadata = {
  title: 'Objectifs',
  description: 'Transformer une intention floue en date.',
};

/**
 * Module objectifs (doc 02 § module 5).
 *
 * Deux onglets. *Objectifs* : ce que tu vises, posé sur une frise, avec pour
 * chacun où tu en es et ce qui te sépare de la cible. *Matelas de sécurité* :
 * l'objectif qui passe avant tous les autres, dont la cible se **calcule**
 * depuis les charges fixes du budget au lieu de se deviner — et le guide qui
 * explique pourquoi, gratuit et sans compte.
 *
 * Aucun jugement, aucune félicitation : un objectif est atteint, en route, en
 * retard ou sans rythme, et chaque état vient avec le chiffre qui le prouve.
 */
export default async function ObjectifsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { onglet, cree } = await searchParams;
  const ongletActif = onglet === 'matelas' ? 'matelas' : 'objectifs';
  const vientDeCreer = cree === '1';
  const ctx = await chargerContexteObjectifs();
  const aujourdhui = new Date();

  const etats = ctx.objectifs.map((o) => etatObjectif(o, aujourdhui).etat);
  const atteints = etats.filter((e) => e === 'atteint').length;
  const enRetard = etats.filter((e) => e === 'en_retard').length;
  const sansRythme = etats.filter((e) => e === 'sans_rythme').length;

  const precaution = calculerEpargnePrecaution({
    chargesFixesMensuellesCents: ctx.chargesFixesCents,
    moisDeCouverture: 4,
    dejaEpargneCents: ctx.epargneLiquideCents,
    capaciteEpargneMensuelleCents: ctx.capaciteMensuelleCents,
  });
  const matelas = ctx.objectifs.find((o) => o.type === 'precaution');

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titre-degrade font-display text-[28px] tracking-tight">
            Objectifs
          </h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-text-muted">
            Transformer une intention floue en date. Chaque objectif dit où tu en es, et ce qui
            te sépare de la cible — une date ou un montant par mois, jamais un jugement.
          </p>
        </div>
        <Link href="/objectifs/nouveau" className="bouton-chaud">
          <Plus className="size-4" />
          Nouvel objectif
        </Link>
      </header>

      {/* Deux onglets, dans l'URL : un lien se partage et revient au bon endroit. */}
      <nav aria-label="Sections" className="mt-6 flex gap-6 border-b border-text-subtle/25">
        <Onglet href="/objectifs" actif={ongletActif === 'objectifs'}>
          Objectifs
        </Onglet>
        <Onglet href="/objectifs?onglet=matelas" actif={ongletActif === 'matelas'}>
          Matelas de sécurité
        </Onglet>
      </nav>

      {ongletActif === 'objectifs' ? (
        <div className="apparait mt-6 space-y-4">
          {vientDeCreer && (
            <p
              role="status"
              className="flex items-center gap-2.5 rounded-[var(--radius)] bg-positive/12 px-4 py-3 text-[13.5px] font-medium text-positive"
            >
              <Check className="size-4 shrink-0" strokeWidth={2.5} />
              Objectif créé. Il apparaît aussi sur ta vue d’ensemble.
            </p>
          )}
          {ctx.objectifs.length === 0 ? (
            <section className="carte p-5 sm:p-6">
              <EtatVide
                titre="Ton premier objectif t’attend"
                texte="Une cible, une date, un rythme : Nestor projette le reste et te dit si ça tient. Le matelas de sécurité est le bon premier — trois à six mois de charges fixes, disponibles tout de suite."
                action={{ href: '/objectifs/nouveau?inspiration=matelas', libelle: 'Commencer par le matelas' }}
              >
                <Link
                  href="/objectifs/nouveau"
                  className="mt-1 text-[13px] text-text-muted underline underline-offset-2 hover:text-text"
                >
                  ou créer un autre objectif
                </Link>
              </EtatVide>
            </section>
          ) : (
            <>
              <FriseObjectifs objectifs={ctx.objectifs} />

              {/* L'état d'ensemble, en une ligne factuelle. */}
              <p className="px-1 text-[13px] text-text-muted">
                {ctx.objectifs.length} objectif{ctx.objectifs.length > 1 ? 's' : ''}
                {atteints > 0 && (
                  <>
                    {' · '}
                    <span className="text-positive">{atteints} atteint{atteints > 1 ? 's' : ''}</span>
                  </>
                )}
                {enRetard > 0 && (
                  <>
                    {' · '}
                    <span className="text-warning">{enRetard} en retard</span>
                  </>
                )}
                {sansRythme > 0 && <>{' · '}{sansRythme} sans rythme</>}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {ctx.objectifs.map((objectif) => (
                  <CarteObjectif
                    key={objectif.id}
                    objectif={objectif}
                    action={!ctx.demo && <BoutonSupprimer id={objectif.id} nom={objectif.nom} />}
                  />
                ))}
              </div>

              {ctx.demo && (
                <p className="text-[12px] leading-relaxed text-text-subtle">
                  Exemple de la démo. Connecte-toi pour créer les tiens et les retrouver à
                  chaque visite.
                </p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="apparait mt-6 space-y-4">
          <section className="carte p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <PastilleIcone icone={ShieldCheck} teinte="menthe" taille="grande" />
              <div className="min-w-0">
                <h2 className="text-[17px] tracking-[-0.01em]">
                  Le premier objectif, avant tout le reste
                </h2>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-text-muted">
                  Trois à six mois de charges fixes, disponibles tout de suite, sur un compte
                  d’épargne réglementé. Pas pour rapporter : pour qu’un imprévu ne t’oblige
                  jamais à vendre au mauvais moment ni à emprunter au mauvais taux. Sans lui,
                  chaque autre objectif est une promesse qu’un pneu crevé peut casser.
                </p>
              </div>
            </div>
          </section>

          {ctx.chargesFixesCents > 0 ? (
            <>
              <Jauge
                label="Matelas constitué"
                valeurCents={ctx.epargneLiquideCents}
                cibleCents={precaution.result.cibleCents}
                ton="positif"
                precision={
                  precaution.result.resteAConstituerCents === 0
                    ? `Quatre mois de charges fixes sont couverts. Le guide dit comment le garder disponible.`
                    : precaution.result.moisRestants
                      ? `Encore ${formatEUR(precaution.result.resteAConstituerCents, { decimals: 0 })} : environ ${precaution.result.moisRestants} mois à ta capacité d’épargne constatée.`
                      : `Encore ${formatEUR(precaution.result.resteAConstituerCents, { decimals: 0 })} pour couvrir quatre mois.`
                }
              />
              <PanneauExplication calcul={precaution} titre="Comment la cible est calculée" />
            </>
          ) : (
            <section className="carte p-5 sm:p-6">
              <p className="text-[14px] font-semibold">La cible se calcule depuis ton budget</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">
                Importe un extrait bancaire : Nestor repère tes charges fixes — logement,
                transport, abonnements — et en déduit le matelas qu’il te faut. Sans budget, tu
                peux quand même le fixer toi-même.
              </p>
              <Link href="/budget" className="bouton-secondaire mt-4">
                <Upload className="size-4" />
                Importer un extrait
              </Link>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            {matelas ? (
              <Link href={`/objectifs#${matelas.id}`} className="bouton-secondaire">
                Voir mon objectif matelas
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <Link href="/objectifs/nouveau?inspiration=matelas" className="bouton-chaud">
                <Plus className="size-4" />
                Créer cet objectif
              </Link>
            )}
            <Link href="/apprendre/matelas-de-securite-belgique" className="bouton-secondaire">
              <BookOpen className="size-4" />
              Lire le guide
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Onglet({ href, actif, children }: { href: string; actif: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={actif ? 'page' : undefined}
      className={cn(
        '-mb-px border-b-2 pb-3 text-[14px] font-semibold transition-colors',
        actif ? 'border-ambre text-text' : 'border-transparent text-text-muted hover:text-text',
      )}
    >
      {children}
    </Link>
  );
}
