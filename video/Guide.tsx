import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/**
 * La vidéo d'un guide : une scène par phrase de la narration.
 *
 * Chaque scène pose une image ou un extrait vidéo de banque libre en fond,
 * un voile sombre par-dessus pour que le texte reste lisible, et la phrase en
 * grand — mot à mot, le mot prononcé s'allume au moment où la voix le dit, et
 * les mots-clés du guide sont en couleur. C'est ce qui fait qu'on suit sans
 * lire : l'œil est guidé par la voix.
 *
 * Format vertical, 1080 × 1920 : les guides se lisent sur téléphone.
 */

export type Mot = { mot: string; debut: number; duree: number };
export type Scene = {
  index: number;
  texte: string;
  motsCles: string[];
  audio: string;
  /** `scene-N.mp4` ou `scene-N.jpg`, déposé par chercher-images ou generer-fonds ; absent → fond de couleur. */
  fond?: string;
  /** Durée du clip de fond, s'il est plus court que la scène : il sera ralenti pour la couvrir. */
  fondDureeSecondes?: number;
  dureeSecondes: number;
  mots: Mot[];
};
export type Timings = { slug: string; titre: string; scenes: Scene[] };

export type GuideProps = { timings: Timings };

const VIOLET = '#7d52f7';
const ROSE = '#f472b6';

function normaliser(mot: string): string {
  return mot
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function SceneVue({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const cles = new Set(scene.motsCles.map(normaliser));
  let indexActif = -1;
  for (let i = 0; i < scene.mots.length; i++) if (t >= (scene.mots[i]?.debut ?? Infinity)) indexActif = i;

  // Une fenêtre de mots autour du mot prononcé : la phrase entière ne tient
  // pas à cette taille, et un mur de texte n'est plus un sous-titre.
  const taille = 7;
  const debutFenetre = Math.max(0, Math.min(indexActif - 2, scene.mots.length - taille));
  const fenetre = scene.mots.slice(debutFenetre, debutFenetre + taille);

  const entree = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const zoom = interpolate(t, [0, scene.dureeSecondes], [1, 1.08]);

  const estVideo = scene.fond?.endsWith('.mp4');
  // Un clip de cinq secondes couvre une scène de dix en jouant à mi-vitesse :
  // au ralenti, un mouvement de caméra lent reste un mouvement de caméra lent.
  const ralenti = scene.fondDureeSecondes
    ? Math.max(0.35, Math.min(1, scene.fondDureeSecondes / scene.dureeSecondes))
    : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0b0a12' }}>
      {/* Le fond, en lente avancée pour que même une photo respire. */}
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        {scene.fond ? (
          estVideo ? (
            <OffthreadVideo
              src={staticFile(scene.fond)}
              muted
              playbackRate={ralenti}
              style={{ width, height, objectFit: 'cover' }}
            />
          ) : (
            <Img src={staticFile(scene.fond)} style={{ width, height, objectFit: 'cover' }} />
          )
        ) : (
          <AbsoluteFill
            style={{
              background: `radial-gradient(120% 80% at 30% 10%, ${VIOLET}66, transparent 60%), radial-gradient(90% 60% at 90% 90%, ${ROSE}44, transparent 60%), #14122a`,
            }}
          />
        )}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(11,10,18,0.15) 0%, rgba(11,10,18,0.35) 45%, rgba(11,10,18,0.92) 100%)',
        }}
      />

      {/* La marque, discrète, en haut à gauche. */}
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 72,
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          opacity: entree,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            background: '#efe9ff',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <svg viewBox="0 0 24 24" width={40} height={40} fill="none" stroke="#6d3bef" strokeWidth={1.9} strokeLinecap="round">
            <path d="M3 11.5a9 9 0 0 0 18 0" />
            <path d="M6.5 11.5a5.5 5.5 0 0 0 11 0" />
            <circle cx="12" cy="8" r="2.4" fill="#6d3bef" stroke="none" />
          </svg>
        </div>
        <span style={{ color: 'white', fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>Nestor</span>
      </div>

      {/* Les sous-titres : le mot prononcé s'allume, les mots-clés sont en couleur. */}
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          bottom: 260,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 22px',
          rowGap: 10,
          opacity: entree,
        }}
      >
        {fenetre.map((m, i) => {
          const indexGlobal = debutFenetre + i;
          const actif = indexGlobal === indexActif;
          const passe = indexGlobal < indexActif;
          const cle = cles.has(normaliser(m.mot));
          return (
            <span
              key={`${indexGlobal}-${m.mot}`}
              style={{
                fontSize: 78,
                lineHeight: 1.15,
                fontWeight: cle || actif ? 800 : 600,
                color: cle ? ROSE : actif ? 'white' : passe ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)',
                transform: actif ? 'scale(1.06)' : 'scale(1)',
                transformOrigin: 'center bottom',
                textShadow: '0 4px 24px rgba(0,0,0,0.5)',
                transition: 'transform 80ms',
              }}
            >
              {m.mot}
            </span>
          );
        })}
      </div>

      <Audio src={staticFile(scene.audio)} />
    </AbsoluteFill>
  );
}

export function Guide({ timings }: GuideProps) {
  const { fps } = useVideoConfig();
  let depart = 0;
  return (
    <AbsoluteFill style={{ fontFamily: 'Nunito Sans, Segoe UI, Helvetica, Arial, sans-serif' }}>
      {timings.scenes.map((scene) => {
        const from = depart;
        const duree = Math.round(scene.dureeSecondes * fps);
        depart += duree;
        return (
          <Sequence key={scene.index} from={from} durationInFrames={duree}>
            <SceneVue scene={{ ...scene, audio: `${timings.slug}/${scene.audio}`, fond: scene.fond ? `${timings.slug}/${scene.fond}` : undefined }} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}

/** Durée totale, en images : la somme des scènes. */
export function dureeTotale(timings: Timings, fps: number): number {
  return timings.scenes.reduce((total, s) => total + Math.round(s.dureeSecondes * fps), 0);
}
