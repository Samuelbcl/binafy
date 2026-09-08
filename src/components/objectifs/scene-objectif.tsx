import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Teinte } from '@/components/ui/pastille-icone';
import type { IconeObjectif } from '@/lib/objectifs/types';

/**
 * La scène vivante d'un objectif.
 *
 * Une barre dit « 62 % ». Une maison à laquelle il manque le toit dit la même
 * chose, et on s'en souvient. Chaque scène est une illustration dont l'état
 * dépend de la progression : les briques se posent une à une, l'avion avance
 * d'étape en étape, le soleil monte. La progression pilote des **étapes
 * discrètes**, jamais un morphing : on doit pouvoir dire ce qui manque.
 *
 * L'ordre des étapes raconte le sujet, et la dernière est la récompense — la
 * fumée sur la cheminée, le drapeau à l'arrivée — qui n'apparaît qu'à 100 %.
 * Au montage, les étapes se posent l'une après l'autre ; quand la progression
 * change (le curseur du parcours de création), les nouvelles étapes se posent
 * de la même façon. Une seule règle CSS (`.scene-etape`) porte ce mouvement.
 *
 * Décorative : la progression est déjà dite en texte et en barre. La scène
 * n'a pas à être lue, elle a à être vue.
 */

type Etape = { rang: number; enfant: ReactNode };

/** Une étape visible si son rang est atteint. Le rang décide aussi du délai. */
function Etapes({ etapes, atteint }: { etapes: readonly Etape[]; atteint: number }) {
  return (
    <>
      {etapes.map(({ rang, enfant }) => (
        <g
          key={rang}
          className={cn('scene-etape', rang < atteint && 'scene-etape-posee')}
          style={{ '--rang': Math.min(rang, 18) } as CSSProperties}
        >
          {enfant}
        </g>
      ))}
    </>
  );
}

/** Combien d'étapes sur `total` sont atteintes à cette progression. La dernière
 *  ne l'est qu'à 100 % : la récompense ne s'arrondit pas. */
function etapesAtteintes(progression: number, total: number): number {
  const p = Math.max(0, Math.min(1, progression));
  if (p >= 1) return total;
  return Math.min(total - 1, Math.floor(p * total));
}

// ── La maison ─────────────────────────────────────────────────────────────
// Vingt-quatre briques en six rangs, puis le toit, la porte, les fenêtres, et
// la fumée pour finir.
function Maison({ progression }: { progression: number }) {
  const etapes: Etape[] = [];
  const rangs = 6;
  const parRang = 4;
  for (let r = 0; r < rangs; r++) {
    for (let c = 0; c < parRang; c++) {
      const decale = r % 2 === 1;
      const x = 44 + c * 18 + (decale ? 9 : 0);
      const largeur = decale && c === parRang - 1 ? 9 : decale && c === 0 ? 18 : 18;
      const y = 88 - (r + 1) * 8;
      etapes.push({
        rang: r * parRang + c,
        enfant: (
          <rect
            x={decale && c === 0 ? 44 : x}
            y={y}
            width={decale && c === 0 ? 9 : Math.min(largeur, 116 - (decale && c === 0 ? 44 : x))}
            height={7}
            rx={1}
            fill="var(--teinte)"
            opacity={(r + c) % 2 === 0 ? 1 : 0.62}
          />
        ),
      });
    }
  }
  const n = etapes.length;
  etapes.push({
    rang: n,
    enfant: (
      <g>
        <path d="M38 42 L80 12 L122 42 Z" fill="var(--teinte)" opacity={0.9} />
        <rect x={98} y={20} width={8} height={16} fill="var(--teinte)" opacity={0.7} />
      </g>
    ),
  });
  etapes.push({
    rang: n + 1,
    enfant: <rect x={72} y={64} width={16} height={24} rx={2} fill="var(--surface)" />,
  });
  etapes.push({
    rang: n + 2,
    enfant: (
      <g fill="var(--surface)">
        <rect x={52} y={50} width={12} height={10} rx={1.5} />
        <rect x={96} y={50} width={12} height={10} rx={1.5} />
      </g>
    ),
  });
  etapes.push({
    rang: n + 3,
    enfant: (
      <g fill="var(--text-subtle)" opacity={0.6}>
        <circle cx={103} cy={14} r={2.5} />
        <circle cx={107} cy={9} r={3} />
        <circle cx={112} cy={4} r={3.5} />
      </g>
    ),
  });

  return (
    <>
      <line x1={12} y1={88.5} x2={148} y2={88.5} stroke="var(--text-subtle)" strokeOpacity={0.35} />
      <Etapes etapes={etapes} atteint={etapesAtteintes(progression, etapes.length)} />
    </>
  );
}

// ── Le matelas ────────────────────────────────────────────────────────────
// L'oreiller d'abord — c'est lui qui fait lire « lit » —, puis six couches
// qui s'empilent, éclairées par le haut comme les jetons, et l'écusson quand
// il est complet.
function Matelas({ progression }: { progression: number }) {
  const etapes: Etape[] = [];
  const couches = 6;
  etapes.push({
    rang: 0,
    enfant: (
      <rect x={48} y={22} width={30} height={8} rx={4} fill="var(--surface)" stroke="var(--teinte)" strokeOpacity={0.7} strokeWidth={1.4} />
    ),
  });
  for (let i = 0; i < couches; i++) {
    const h = 9;
    const y = 86 - (i + 1) * h;
    const x = 30 + i * 1.5;
    const w = 100 - i * 3;
    etapes.push({
      rang: i + 1,
      enfant: (
        <g>
          <rect
            x={x}
            y={y}
            width={w}
            height={h - 1.5}
            rx={3.5}
            fill="var(--teinte)"
            opacity={i % 2 === 0 ? 0.72 : 0.5}
          />
          <rect x={x + 3} y={y} width={w - 6} height={1.8} rx={0.9} fill="var(--teinte)" />
        </g>
      ),
    });
  }
  etapes.push({
    rang: couches + 1,
    enfant: (
      <g transform="translate(112 18)">
        <path d="M0 -9 L9 -5.5 V1 C9 6.5 4.5 10 0 12 C-4.5 10 -9 6.5 -9 1 V-5.5 Z" fill="var(--teinte)" />
        <path d="M-4 1 L-1 4 L4.5 -2.5" fill="none" stroke="var(--surface)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ),
  });

  return (
    <>
      <line x1={12} y1={86.5} x2={148} y2={86.5} stroke="var(--text-subtle)" strokeOpacity={0.35} />
      <Etapes etapes={etapes} atteint={etapesAtteintes(progression, etapes.length)} />
    </>
  );
}

// ── Le voyage ─────────────────────────────────────────────────────────────
// Dix escales le long d'un arc ; l'avion est à la dernière atteinte ; le
// fanion de l'arrivée ne se plante qu'au bout.
function pointArc(t: number): { x: number; y: number; angle: number } {
  const p0 = { x: 16, y: 82 };
  const p1 = { x: 80, y: -6 };
  const p2 = { x: 144, y: 46 };
  const u = 1 - t;
  const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
}

function Voyage({ progression }: { progression: number }) {
  const escales = 10;
  const total = escales + 1;
  const atteint = etapesAtteintes(progression, total);
  const etapes: Etape[] = [];
  for (let i = 0; i < escales; i++) {
    const { x, y } = pointArc((i + 1) / escales);
    etapes.push({
      rang: i,
      enfant: <circle cx={x} cy={y} r={2.6} fill="var(--teinte)" />,
    });
  }
  etapes.push({
    rang: escales,
    enfant: (
      <g transform="translate(144 46)">
        <line x1={0} y1={0} x2={0} y2={-18} stroke="var(--teinte)" strokeWidth={1.6} />
        <path d="M0 -18 L12 -14 L0 -10 Z" fill="var(--teinte)" />
      </g>
    ),
  });

  const t = Math.max(0, Math.min(escales, atteint)) / escales;
  const avion = pointArc(Math.max(0.001, t));

  return (
    <>
      <path d="M16 82 Q80 -6 144 46" fill="none" stroke="var(--teinte)" strokeOpacity={0.3} strokeWidth={1.4} strokeDasharray="3 4" />
      <g fill="var(--text-subtle)" opacity={0.28}>
        <ellipse cx={40} cy={30} rx={12} ry={5} />
        <ellipse cx={118} cy={78} rx={14} ry={5.5} />
      </g>
      <Etapes etapes={etapes} atteint={atteint} />
      <g
        className="scene-avion"
        style={{ transform: `translate(${avion.x}px, ${avion.y}px) rotate(${avion.angle}deg)` }}
      >
        <path d="M-7 0 L7 -1.5 L7 1.5 Z M-1 0 L-4 -6 L-1.5 -6 L2 -1 Z M-1 0 L-4 6 L-1.5 6 L2 1 Z" fill="var(--text)" />
      </g>
    </>
  );
}

// ── Le soleil ─────────────────────────────────────────────────────────────
// Le disque monte au-dessus de l'horizon en dix paliers ; les rayons
// s'allument ensuite un à un.
function Soleil({ progression }: { progression: number }) {
  const paliers = 10;
  const rayons = 8;
  const total = paliers + rayons;
  const atteint = etapesAtteintes(progression, total);
  const montee = Math.min(paliers, atteint) / paliers;
  const cy = 86 - montee * 40; // de 86 (sous l'horizon) à 46

  const etapes: Etape[] = [];
  for (let i = 0; i < rayons; i++) {
    const a = (-150 + i * (300 / (rayons - 1))) * (Math.PI / 180);
    etapes.push({
      rang: paliers + i,
      enfant: (
        <line
          x1={80 + Math.cos(a) * 22}
          y1={46 + Math.sin(a) * 22}
          x2={80 + Math.cos(a) * 30}
          y2={46 + Math.sin(a) * 30}
          stroke="var(--teinte)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ),
    });
  }

  return (
    <>
      <defs>
        <clipPath id="scene-ciel">
          <rect x={0} y={0} width={160} height={70} />
        </clipPath>
      </defs>
      <g clipPath="url(#scene-ciel)">
        <circle className="scene-soleil" cx={80} cy={cy} r={16} fill="var(--teinte)" />
      </g>
      <line x1={8} y1={70} x2={152} y2={70} stroke="var(--text-subtle)" strokeOpacity={0.45} />
      <g fill="none" stroke="var(--teinte)" strokeOpacity={0.35} strokeWidth={1.4} strokeLinecap="round">
        <path d="M20 80 q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" />
        <path d="M30 88 q6 -3 12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0 t12 0" />
      </g>
      <Etapes etapes={etapes} atteint={atteint} />
    </>
  );
}

// ── Le bocal ──────────────────────────────────────────────────────────────
// Pour tout ce qui n'a pas encore sa scène : des pièces qui s'empilent dans un
// bocal, et le couvercle quand il est plein.
function Bocal({ progression }: { progression: number }) {
  const pieces = 9;
  const total = pieces + 1;
  const atteint = etapesAtteintes(progression, total);
  const etapes: Etape[] = [];
  for (let i = 0; i < pieces; i++) {
    const y = 84 - i * 5.5;
    const decale = i % 2 === 0 ? 0 : 3;
    etapes.push({
      rang: i,
      enfant: (
        <ellipse
          cx={80 + decale}
          cy={y}
          rx={17}
          ry={3.4}
          fill="var(--teinte)"
          opacity={i % 2 === 0 ? 1 : 0.62}
        />
      ),
    });
  }
  etapes.push({
    rang: pieces,
    enfant: <rect x={58} y={20} width={44} height={8} rx={3} fill="var(--teinte)" />,
  });

  return (
    <>
      <path
        d="M60 30 h40 v4 q6 2 6 8 v40 q0 6 -6 6 h-40 q-6 0 -6 -6 v-40 q0 -6 6 -8 z"
        fill="none"
        stroke="var(--text-subtle)"
        strokeOpacity={0.5}
        strokeWidth={1.4}
      />
      <Etapes etapes={etapes} atteint={atteint} />
    </>
  );
}

const SCENES: Partial<Record<IconeObjectif, (p: { progression: number }) => ReactNode>> = {
  maison: Maison,
  bouclier: Matelas,
  avion: Voyage,
  soleil: Soleil,
};

const CLASSE_TEINTE: Record<Teinte, string> = {
  violet: 'pastille-violet',
  menthe: 'pastille-menthe',
  ambre: 'pastille-ambre',
  rose: 'pastille-rose',
  azur: 'pastille-azur',
  lagune: 'pastille-lagune',
  terre: 'pastille-terre',
};

export function SceneObjectif({
  icone,
  teinte,
  progression,
  className,
}: {
  icone: IconeObjectif;
  teinte: Teinte;
  /** De 0 à 1. Au-delà de 1, la scène est complète. */
  progression: number;
  className?: string;
}) {
  const Scene = SCENES[icone] ?? Bocal;
  return (
    <svg
      viewBox="0 0 160 100"
      aria-hidden
      className={cn('scene-objectif', CLASSE_TEINTE[teinte], className)}
    >
      <Scene progression={progression} />
    </svg>
  );
}
