import type { CategorieGuide } from '@/lib/apprendre/types';

/**
 * Couverture d'un guide — un motif de nid, dessiné et non photographié.
 *
 * Un dev solo n'a ni photographe ni banque d'images, et les visuels de stock se
 * reconnaissent au premier coup d'œil. Le motif est donc **déduit du slug** :
 * chaque guide obtient une composition qui lui est propre et qui ne change
 * jamais, sans qu'on ait à produire un fichier. Deux guides ne se ressemblent
 * pas, et l'ensemble reste manifestement de la même famille.
 *
 * Les couleurs passent par les tokens : la couverture suit le thème clair ou
 * sombre sans traitement particulier.
 */

const TEINTE: Record<CategorieGuide, { trait: string; fond: string }> = {
  fiscalite: { trait: 'var(--data-1)', fond: 'var(--primary-soft)' },
  investir: { trait: 'var(--data-2)', fond: 'color-mix(in oklab, var(--data-2) 12%, var(--surface))' },
  immobilier: { trait: 'var(--data-3)', fond: 'color-mix(in oklab, var(--data-3) 14%, var(--surface))' },
  budget: { trait: 'var(--data-5)', fond: 'color-mix(in oklab, var(--data-5) 12%, var(--surface))' },
  independant: { trait: 'var(--data-4)', fond: 'color-mix(in oklab, var(--data-4) 12%, var(--surface))' },
};

/** Hachage stable d'une chaîne — même slug, même dessin, à jamais. */
function graine(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Suite déterministe tirée de la graine. */
function tirages(graineInitiale: number, combien: number): number[] {
  let x = graineInitiale || 1;
  return Array.from({ length: combien }, () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return Math.abs(x) / 2147483647;
  });
}

export function CouvertureGuide({
  slug,
  categorie,
  className,
  hauteur = 160,
}: {
  slug: string;
  categorie: CategorieGuide;
  className?: string;
  hauteur?: number;
}) {
  const { trait, fond } = TEINTE[categorie];
  const [a, b, c, d, e] = tirages(graine(slug), 5) as [
    number,
    number,
    number,
    number,
    number,
  ];

  // Le nid : des arcs emboîtés, tous centrés sous la ligne d'horizon, dont
  // l'ouverture et l'inclinaison varient d'un guide à l'autre.
  const centreX = 60 + a * 80;
  const inclinaison = -14 + b * 28;
  const arcs = Array.from({ length: 7 }, (_, i) => ({
    rayon: 26 + i * 15,
    opacite: 0.75 - i * 0.085,
    decalage: (c - 0.5) * i * 3,
  }));

  // L'élément posé dedans, unique par guide.
  const oeufX = centreX + (d - 0.5) * 30;
  const oeufR = 7 + e * 5;

  return (
    <div
      aria-hidden
      className={className}
      style={{ background: fond, height: hauteur, overflow: 'hidden' }}
    >
      <svg
        viewBox="0 0 200 160"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <g transform={`rotate(${inclinaison} ${centreX} 150)`}>
          {arcs.map((arc) => (
            <path
              key={arc.rayon}
              d={`M ${centreX - arc.rayon + arc.decalage} 150 A ${arc.rayon} ${arc.rayon * 0.82} 0 0 1 ${centreX + arc.rayon + arc.decalage} 150`}
              fill="none"
              stroke={trait}
              strokeOpacity={arc.opacite}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}
        </g>
        <circle cx={oeufX} cy={150 - oeufR - 2} r={oeufR} fill={trait} fillOpacity="0.9" />
      </svg>
    </div>
  );
}
