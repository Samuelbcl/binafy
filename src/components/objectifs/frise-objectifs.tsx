import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PastilleIcone } from '@/components/ui/pastille-icone';
import { moisJusqua } from '@/lib/finance/objectifs';
import { libelleMois } from '@/lib/objectifs/dates';
import { ICONES_OBJECTIF, type Objectif } from '@/lib/objectifs/types';

/**
 * Frise des échéances.
 *
 * Une liste d'objectifs dit *quoi* ; la frise dit *dans quel ordre* et *à
 * quelle distance*. Chaque objectif daté est posé sur une ligne qui va
 * d'aujourd'hui à la dernière échéance, avec les débuts d'année comme repères.
 * Un objectif sans échéance n'y figure pas : il n'a pas de place dans le temps,
 * et l'inventer serait mentir.
 */
export function FriseObjectifs({ objectifs }: { objectifs: readonly Objectif[] }) {
  const aujourdhui = new Date();
  const dates = objectifs
    .filter((o): o is Objectif & { echeance: string } => o.echeance !== null)
    .map((o) => ({ objectif: o, mois: moisJusqua(o.echeance, aujourdhui) }))
    .sort((a, b) => a.mois - b.mois);

  if (dates.length === 0) return null;

  // Au moins un an de frise, sinon trois mois d'écart prendraient tout l'écran
  // et sembleraient loin. Un peu de marge à droite pour que la dernière
  // pastille ne touche pas le bord.
  const total = Math.max(12, (dates[dates.length - 1]?.mois ?? 0) + 2);
  const position = (mois: number) => `${(mois / total) * 100}%`;

  // Les débuts d'année qui tombent dans la fenêtre.
  const janviers: { mois: number; annee: number }[] = [];
  for (let m = 1; m <= total; m++) {
    const d = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth() + m, 1));
    if (d.getUTCMonth() === 0) janviers.push({ mois: m, annee: d.getUTCFullYear() });
  }

  return (
    <div className="carte overflow-hidden px-5 pt-5 pb-4 sm:px-6" aria-label="Frise des échéances">
      <div className="relative h-16">
        {/* Le fil du temps. */}
        <div className="absolute inset-x-0 bottom-3 border-t border-dashed border-text-subtle/40" />
        <span className="absolute bottom-3 left-0 size-2 -translate-y-1/2 rounded-full bg-text" />

        {janviers.map((j) => (
          <span
            key={j.annee}
            className="absolute bottom-3 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-text-subtle"
            style={{ left: position(j.mois) }}
          />
        ))}

        {dates.map(({ objectif, mois }, i) => {
          const atteint = objectif.atteintCents >= objectif.cibleCents;
          // Deux échéances proches se marcheraient dessus : on alterne la hauteur.
          const proche = i > 0 && mois - (dates[i - 1]?.mois ?? 0) < total * 0.08;
          return (
            <div
              key={objectif.id}
              className="absolute -translate-x-1/2"
              style={{ left: position(mois), bottom: proche ? '2.25rem' : '1.25rem' }}
              title={`${objectif.nom} — ${libelleMois(objectif.echeance)}`}
            >
              <div className="relative">
                <PastilleIcone
                  icone={ICONES_OBJECTIF[objectif.icone]}
                  teinte={objectif.teinte}
                  libelle={`${objectif.nom}, ${libelleMois(objectif.echeance)}`}
                  taille="petite"
                />
                {atteint && (
                  <span className="absolute -right-1 -bottom-1 grid size-4 place-items-center rounded-full bg-positive text-white ring-2 ring-surface">
                    <Check className="size-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-1 h-4 text-[11px] text-text-subtle">
        {/* Toujours nomme : un repere sans libelle oblige a deviner. Quand le
            premier janvier est proche, le mot monte au-dessus du fil. */}
        <span
          className={cn('absolute left-0', (janviers[0]?.mois ?? total) / total <= 0.3 && '-top-[2.4rem]')}
        >
          aujourd’hui
        </span>
        {janviers.map((j) => (
          <span
            key={j.annee}
            className="absolute -translate-x-1/2 tabular-nums"
            style={{ left: position(j.mois) }}
          >
            {j.annee}
          </span>
        ))}
      </div>
    </div>
  );
}
