import { cn } from '@/lib/cn';
import { ICONES, type BaseIcone, type StyleIcone } from '@/lib/icones/solar';

/**
 * Une icône Solar, rendue en SVG en ligne.
 *
 * Les corps viennent d'un fichier généré (scripts/generer-icones.mjs) : pas de
 * paquet, pas de contexte, pas de chargement — ça se rend côté serveur comme
 * côté client. Trois styles : `bold-duotone` pour les pastilles (une forme
 * pleine en transparence sous le trait, ce qui fait qu'une icône ressemble à
 * un objet), `bold` pour ce qui est choisi ou actif, `linear` pour le repos.
 *
 * Décorative par défaut : elle double presque toujours un texte. `titre`
 * quand elle porte seule une information.
 */
export function Icone({
  nom,
  style = 'bold-duotone',
  className,
  titre,
}: {
  nom: BaseIcone;
  style?: StyleIcone;
  className?: string;
  titre?: string;
}) {
  const icone = ICONES[`${nom}-${style}`];
  return (
    <svg
      viewBox={`0 0 ${icone.width} ${icone.height}`}
      fill="none"
      className={cn('inline-block size-5 shrink-0', className)}
      {...(titre ? { role: 'img', 'aria-label': titre } : { 'aria-hidden': true })}
      dangerouslySetInnerHTML={{ __html: icone.body }}
    />
  );
}
