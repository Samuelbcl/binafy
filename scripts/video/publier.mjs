/**
 * Publie la vidéo d'un guide sur Supabase Storage (bucket public `videos`)
 * et l'inscrit dans src/lib/apprendre/videos.ts, que la page du guide lit.
 *
 * Les MP4 ne vont pas dans git : ils vivent dans le Storage, servis en
 * public, et l'application ne connaît que la liste des slugs publiés.
 *
 * Usage : node scripts/video/publier.mjs <slug>
 * Attend public/videos/<slug>.mp4 et, si présent, public/videos/<slug>.jpg (affiche).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage : node scripts/video/publier.mjs <slug>');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_SB || !SERVICE) {
  console.error('NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local');
  process.exit(1);
}

const entetes = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` };

// Le bucket, public, créé s'il n'existe pas.
const buckets = await (await fetch(`${URL_SB}/storage/v1/bucket`, { headers: entetes })).json();
if (!Array.isArray(buckets) || !buckets.some((b) => b.name === 'videos')) {
  const r = await fetch(`${URL_SB}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...entetes, 'Content-Type': 'application/json' },
    // Pas de limite propre : celle du projet s'applique (50 Mo sur l'offre gratuite).
    body: JSON.stringify({ id: 'videos', name: 'videos', public: true }),
  });
  if (!r.ok) {
    console.error('Création du bucket impossible :', r.status, await r.text());
    process.exit(1);
  }
  console.log('bucket videos créé (public)');
}

async function envoyer(nom, type) {
  const chemin = resolve('public/videos', nom);
  if (!existsSync(chemin)) return false;
  const r = await fetch(`${URL_SB}/storage/v1/object/videos/${nom}`, {
    method: 'POST',
    headers: { ...entetes, 'Content-Type': type, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
    body: readFileSync(chemin),
  });
  if (!r.ok) {
    console.error(`Envoi de ${nom} impossible :`, r.status, await r.text());
    process.exit(1);
  }
  console.log(`  ${nom} envoyé`);
  return true;
}

await envoyer(`${slug}.mp4`, 'video/mp4');
const affiche = await envoyer(`${slug}.jpg`, 'image/jpeg');

// La durée vient des temps synthétisés.
const timings = JSON.parse(readFileSync(resolve('video/public', slug, 'timings.json'), 'utf8'));
const duree = Math.round(timings.scenes.reduce((t, s) => t + s.dureeSecondes, 0));

// Le registre que lit l'application.
const cheminRegistre = resolve('src/lib/apprendre/videos.ts');
const registre = existsSync(cheminRegistre)
  ? JSON.parse(readFileSync(cheminRegistre, 'utf8').match(/= (\{[\s\S]*\}) as const/)[1])
  : {};
registre[slug] = { dureeSecondes: duree, affiche, publieLe: new Date().toISOString().slice(0, 10) };

writeFileSync(
  cheminRegistre,
  `/* Généré par scripts/video/publier.mjs — les vidéos publiées, par slug de guide. */

export const VIDEOS = ${JSON.stringify(registre, null, 2)} as const;

export type SlugVideo = keyof typeof VIDEOS;
`,
);
console.log(`${slug} : ${duree} s, publié — ${URL_SB}/storage/v1/object/public/videos/${slug}.mp4`);
