import { Composition, registerRoot, staticFile } from 'remotion';
import { Guide, dureeTotale, type GuideProps, type Timings } from './Guide';

/**
 * Point d'entrée Remotion.
 *
 * Une seule composition, « Guide », dont la durée dépend de la narration :
 * `calculateMetadata` lit les temps synthétisés (video/public/<slug>/timings.json)
 * et fixe le nombre d'images. Le slug vient des props de rendu :
 *   npx remotion render video/index.ts Guide public/videos/<slug>.mp4 --props='{"slug":"<slug>"}'
 */
const FPS = 30;

function Racine() {
  return (
    <Composition
      id="Guide"
      component={Guide}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={30 * 60}
      defaultProps={{ slug: 'matelas-de-securite-belgique' } as unknown as GuideProps}
      calculateMetadata={async ({ props }) => {
        const slug = (props as unknown as { slug: string }).slug;
        const reponse = await fetch(staticFile(`${slug}/timings.json`));
        const timings = (await reponse.json()) as Timings;
        return {
          durationInFrames: Math.max(FPS, dureeTotale(timings, FPS)),
          props: { timings },
        };
      }}
    />
  );
}

registerRoot(Racine);
