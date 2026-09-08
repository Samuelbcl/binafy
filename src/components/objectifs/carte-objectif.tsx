import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Montant } from '@/components/ui/montant';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { etatObjectif, mensualiser, type EtatObjectif } from '@/lib/finance/objectifs';
import { formatEUR } from '@/lib/money';
import { libelleDans, libelleMois } from '@/lib/objectifs/dates';
import { ICONES_OBJECTIF, type Objectif } from '@/lib/objectifs/types';
import { SceneObjectif } from './scene-objectif';

/**
 * Carte d'un objectif.
 *
 * Trois lignes, toujours dans cet ordre : qui il est (icône, nom, état), où il
 * en est (ce qui est là, la cible), et ce qui le sépare de la cible — une date
 * ou un montant par mois, jamais un jugement. La barre est segmentée : on
 * compte les traits comme on compte des mois, et un objectif à moitié fait se
 * *voit* à moitié fait.
 */

/* La bande prend la teinte de l'objectif par la même variable que la pastille. */
const CLASSE_TEINTE_BANDE: Record<Objectif['teinte'], string> = {
  violet: 'pastille-violet',
  menthe: 'pastille-menthe',
  ambre: 'pastille-ambre',
  rose: 'pastille-rose',
  azur: 'pastille-azur',
  lagune: 'pastille-lagune',
  terre: 'pastille-terre',
};

const PUCE: Record<EtatObjectif, { libelle: string; classe: string; barre: string }> = {
  atteint: { libelle: 'Atteint', classe: 'bg-positive/15 text-positive', barre: 'text-positive' },
  en_route: { libelle: 'En route', classe: 'bg-primary-soft text-primary', barre: 'text-primary' },
  en_retard: { libelle: 'En retard', classe: 'bg-warning/15 text-warning', barre: 'text-warning' },
  sans_rythme: { libelle: 'Sans rythme', classe: 'bg-surface-2 text-text-muted', barre: 'text-text-subtle' },
};

function phraseEtat(
  objectif: Objectif,
  etat: ReturnType<typeof etatObjectif>,
  aujourdhui: Date,
): string {
  const echeance = objectif.echeance ? libelleMois(objectif.echeance) : null;
  switch (etat.etat) {
    case 'atteint':
      return echeance ? `Cible atteinte, avant l’échéance de ${echeance}.` : 'Cible atteinte.';
    case 'en_route': {
      const mensualite = mensualiser(objectif.contributionCents ?? 0, objectif.frequence ?? 'mois');
      const quand = libelleDans(etat.moisRestants ?? 0, aujourdhui);
      return echeance
        ? `À ${formatEUR(mensualite, { decimals: 0 })} par mois, atteint vers ${quand} — avant ${echeance}.`
        : `À ${formatEUR(mensualite, { decimals: 0 })} par mois, atteint vers ${quand}.`;
    }
    case 'en_retard':
      return `Il manque ${formatEUR(etat.manqueMensuelCents, { decimals: 0 })} par mois pour tenir ${echeance}.`;
    case 'sans_rythme':
      return echeance && etat.manqueMensuelCents > 0
        ? `${formatEUR(etat.manqueMensuelCents, { decimals: 0 })} par mois suffiraient pour ${echeance}.`
        : 'Ajoute un rythme de versement pour projeter une date.';
  }
}

export function CarteObjectif({
  objectif,
  compact = false,
  action,
  className,
}: {
  objectif: Objectif;
  /** Sur le tableau de bord : sans la phrase d'état, la barre suffit. */
  compact?: boolean;
  /** Commande alignée à droite de l'état — supprimer, modifier. */
  action?: ReactNode;
  className?: string;
}) {
  const aujourdhui = new Date();
  const etat = etatObjectif(objectif, aujourdhui);
  const puce = PUCE[etat.etat];
  const part = objectif.cibleCents > 0 ? Math.min(1, objectif.atteintCents / objectif.cibleCents) : 0;

  // `min-w-0` : dans une grille, une carte ne peut pas descendre sous la
  // largeur minimale de son contenu, et la ligne d'en-tête — quatre éléments
  // dont trois refusent de se couper — vaut plus que 390 px moins les marges.
  // Sans lui, la carte déborde de l'écran de dix pixels.
  return (
    <article id={objectif.id} className={cn('carte min-w-0 p-4 sm:p-5', className)}>
      {/* La scène en tête : ce qui manque à la maison se voit avant que la
          barre ne le chiffre. Sur le tableau de bord, une vignette suffit. */}
      {!compact && (
        <div className={cn('scene-bande mb-4', CLASSE_TEINTE_BANDE[objectif.teinte])}>
          <SceneObjectif
            icone={objectif.icone}
            teinte={objectif.teinte}
            progression={part}
            className="absolute inset-x-6 bottom-0 h-full w-auto"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <PastilleIcone icone={ICONES_OBJECTIF[objectif.icone]} teinte={objectif.teinte} />
        <h3 className="min-w-0 flex-1 truncate text-[15px] font-bold">{objectif.nom}</h3>
        <span className={cn('puce shrink-0', puce.classe)}>{puce.libelle}</span>
        {action}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <Montant
            cents={objectif.atteintCents}
            decimals={0}
            className="text-[17px] font-semibold tracking-[-0.01em]"
          />
          <p className="text-[13px] text-text-muted">
            sur <Montant cents={objectif.cibleCents} decimals={0} className="font-semibold text-text" />
          </p>
        </div>
        {compact && (
          <SceneObjectif
            icone={objectif.icone}
            teinte={objectif.teinte}
            progression={part}
            className="h-10 w-16 shrink-0"
          />
        )}
      </div>

      <div
        className={cn('barre-segmentee mt-2.5', puce.barre)}
        role="img"
        aria-label={`${objectif.nom} : ${formatEUR(objectif.atteintCents, { decimals: 0 })} sur ${formatEUR(objectif.cibleCents, { decimals: 0 })}`}
      >
        <span style={{ width: `${Math.max(part > 0 ? 2 : 0, part * 100)}%` }} />
      </div>

      {!compact && (
        <p className="mt-3 text-[12.5px] leading-snug text-text-muted">
          {phraseEtat(objectif, etat, aujourdhui)}
        </p>
      )}
    </article>
  );
}
