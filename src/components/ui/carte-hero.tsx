'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatEUR, formatPercent } from '@/lib/money';
import { useDiscretion } from '@/components/providers';
import { Montant } from './montant';

/**
 * Carte du chiffre principal d'un écran (docs/05 § composants clés).
 *
 * Une surface d'accent, un seul chiffre dessus. C'est le seul endroit de
 * l'interface où la couleur occupe une surface : ailleurs elle ne sert qu'à
 * désigner. Si deux cartes d'accent apparaissent sur un même écran, l'une des
 * deux n'est pas le chiffre principal.
 *
 * Le dégradé et la lueur vivent dans `.carte-accent` : la carte n'a pas à
 * connaître la recette, elle a à être la carte principale.
 *
 * La variation n'est pas colorée en vert ou en rouge ici : sur un aplat saturé
 * ces couleurs deviennent illisibles, et le signe suffit à lire le sens.
 */

/**
 * Une lecture possible du même patrimoine.
 *
 * Brut, net de dettes, net d'impôt latent : trois chiffres également vrais qui
 * répondent à trois questions différentes. Les empiler tous les trois en gros
 * ne renseigne personne ; on en montre un, et on laisse choisir lequel.
 */
export type MetriqueHero = {
  cle: string;
  label: string;
  valeurCents: number;
  /** Ce que ce chiffre veut dire, en une phrase. Affichée sous le montant. */
  precision?: string;
};

/**
 * Le chiffre monte jusqu'à sa valeur au lieu d'y être déjà.
 *
 * Sept dixièmes de seconde, en décélérant. Ce n'est pas un effet : c'est ce
 * qui fait qu'on *regarde* le chiffre au lieu de le voir. Au premier montage il
 * part de zéro ; quand on change de lecture — brut, net, net d'impôt — il va
 * de l'ancienne valeur à la nouvelle, et la différence entre les deux se voit
 * passer. Coupé pour qui a demandé moins de mouvement : le chiffre est alors
 * posé d'un coup, comme avant.
 *
 * Le premier rendu affiche la valeur finale — c'est ce que le serveur a
 * envoyé, et l'hydratation exige que le client le reproduise. L'animation ne
 * commence qu'après, pendant que la carte est encore en train d'apparaître.
 */
function useCompteur(cible: number): number {
  const [affiche, setAffiche] = useState(cible);
  const precedent = useRef<number | null>(null);

  useEffect(() => {
    const depart = precedent.current ?? 0;
    precedent.current = cible;

    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduit || depart === cible) {
      setAffiche(cible);
      return;
    }

    const debut = performance.now();
    const duree = 720;
    let trame = 0;
    const pas = (maintenant: number) => {
      const progression = Math.min(1, (maintenant - debut) / duree);
      const eased = 1 - (1 - progression) ** 3;
      setAffiche(Math.round(depart + (cible - depart) * eased));
      if (progression < 1) trame = requestAnimationFrame(pas);
    };
    trame = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(trame);
  }, [cible]);

  return affiche;
}

export function CarteHero({
  label,
  valeurCents,
  metriques,
  decimals = 2,
  variationCents,
  ratioVariation,
  mentionVariation,
  etat,
  aCote,
  children,
  className,
}: {
  /** Libellé du chiffre. Ignoré si `metriques` est fourni. */
  label: string;
  /** Valeur affichée. Ignorée si `metriques` est fourni. */
  valeurCents: number;
  /**
   * Plusieurs lectures du même chiffre. La première est affichée par défaut ;
   * le libellé devient alors un sélecteur.
   */
  metriques?: readonly MetriqueHero[];
  decimals?: number;
  /** Variation absolue sur la période, en centimes. */
  variationCents?: number;
  /** Ratio de la même variation : 0,052 pour 5,2 %. */
  ratioVariation?: number;
  /** Ce que couvre la variation — « sur la journée », « depuis janvier ». */
  mentionVariation?: string;
  /** Pastille d'état en haut à droite : fraîcheur des données, avertissement. */
  etat?: string;
  /** Chiffre secondaire, aligné à droite du chiffre principal. */
  aCote?: { label: string; valeurCents: number };
  children?: ReactNode;
  className?: string;
}) {
  const { discret } = useDiscretion();
  const [cleChoisie, setCleChoisie] = useState(metriques?.[0]?.cle ?? '');
  const choisie = metriques?.find((m) => m.cle === cleChoisie) ?? metriques?.[0];

  const libelle = choisie?.label ?? label;
  const montantCents = useCompteur(choisie?.valeurCents ?? valeurCents);

  return (
    <section
      className={cn(
        'carte-accent apparait p-6 sm:p-8',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {metriques && metriques.length > 1 ? (
          // Un <select> natif plutôt qu'un menu maison : il s'ouvre en
          // sélecteur du système sur mobile, se pilote au clavier sans code, et
          // annonce son état aux lecteurs d'écran. Les options portent leurs
          // propres couleurs — la liste est peinte par le système, sur fond
          // clair, où du blanc sur blanc serait invisible.
          <label className="group relative -m-1 inline-flex items-center gap-1 p-1">
            <span className="text-[13px] opacity-75">{libelle}</span>
            <ChevronDown aria-hidden className="size-3.5 opacity-75" />
            <select
              aria-label="Choisir le chiffre affiché"
              value={cleChoisie}
              onChange={(e) => setCleChoisie(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              {metriques.map((m) => (
                <option
                  key={m.cle}
                  value={m.cle}
                  style={{ color: 'var(--text)', background: 'var(--surface)' }}
                >
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="text-[13px] opacity-75">{libelle}</p>
        )}
        {etat && (
          <span className="puce bg-on-primary/15 text-on-primary">{etat}</span>
        )}
      </div>

      <div className="mt-2 sm:flex sm:items-end sm:justify-between sm:gap-8">
        <h1 className="chiffre-hero">
          <Montant
            cents={montantCents}
            decimals={decimals}
            decimalesDiscretes
            className="text-on-primary"
          />
        </h1>
        {/* Sous 640px le chiffre secondaire passe sous le principal, sur une
            seule ligne libelle-valeur : empile a droite, il donnait deux blocs
            mal alignes que rien ne reliait. */}
        {aCote && (
          <p className="mt-4 flex items-baseline justify-between gap-3 border-t border-on-primary/20 pt-3 sm:mt-0 sm:block sm:border-0 sm:pt-0 sm:text-right">
            <span className="text-[12.5px] opacity-75">{aCote.label}</span>
            <Montant
              cents={aCote.valeurCents}
              decimals={0}
              className="text-[18px] font-bold text-on-primary sm:mt-1 sm:block sm:text-[20px]"
            />
          </p>
        )}
      </div>

      {variationCents !== undefined && (
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="puce bg-on-primary/15 tabular-nums">
            {formatEUR(variationCents, { sign: 'always', decimals: 2, masked: discret })}
          </span>
          {/* La mention sort de la pastille : « aucune cotation depuis la
              derniere cloture » y formait un ruban large de tout l'ecran. */}
          {mentionVariation && (
            <span className="text-[12.5px] opacity-75">{mentionVariation}</span>
          )}
          {ratioVariation !== undefined && (
            <span className="puce bg-on-primary text-primary tabular-nums">
              {formatPercent(ratioVariation, { sign: 'always', masked: false })}
            </span>
          )}
        </div>
      )}

      {choisie?.precision && (
        <p className="mt-4 max-w-lg text-[13px] leading-relaxed opacity-75">
          {choisie.precision}
        </p>
      )}

      {children}
    </section>
  );
}
