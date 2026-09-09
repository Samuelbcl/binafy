import { VIDEOS } from '@/lib/apprendre/videos';
import { envClient } from '@/lib/env';
import { cn } from '@/lib/cn';

/**
 * La vidéo d'un guide, en tête de page.
 *
 * Elle condense le guide en une minute : une voix, des images, la phrase qui
 * s'allume mot à mot. Elle est servie depuis le Storage public de Supabase ;
 * l'application ne connaît que la liste des slugs publiés
 * (`src/lib/apprendre/videos.ts`, écrite par scripts/video/publier.mjs).
 * Un guide sans vidéo n'affiche rien — pas de cadre vide.
 *
 * Verticale, comme le téléphone qui la lira : sur un écran large, elle reste
 * à sa taille naturelle plutôt que de s'étaler.
 */
export function VideoGuide({ slug, className }: { slug: string; className?: string }) {
  const video = (VIDEOS as Record<string, { dureeSecondes: number; affiche: boolean } | undefined>)[slug];
  const base = envClient.NEXT_PUBLIC_SUPABASE_URL;
  if (!video || !base) return null;

  const url = `${base}/storage/v1/object/public/videos/${slug}`;
  const minutes = Math.floor(video.dureeSecondes / 60);
  const secondes = video.dureeSecondes % 60;

  return (
    <figure className={cn('mx-auto w-full max-w-[360px]', className)}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={video.affiche ? `${url}.jpg` : undefined}
        className="aspect-[9/16] w-full rounded-[var(--radius-lg)] bg-[#0b0a12] shadow-[var(--shadow-card)]"
      >
        <source src={`${url}.mp4`} type="video/mp4" />
      </video>
      <figcaption className="mt-2 text-center text-[12.5px] text-text-muted">
        Le guide en {minutes > 0 ? `${minutes} min ${secondes.toString().padStart(2, '0')}` : `${secondes} s`}
      </figcaption>
    </figure>
  );
}
