/**
 * Va chercher, pour chaque scène d'une narration, un extrait vidéo (ou à
 * défaut une photo) sur Pexels — banque libre, licence Pexels : usage
 * commercial autorisé, attribution appréciée mais non requise.
 *
 * Clé gratuite sur https://www.pexels.com/api/ — à mettre dans .env.local :
 *   PEXELS_API_KEY=...
 *
 * Usage : node scripts/video/chercher-images.mjs <slug>
 * Écrit video/public/<slug>/scene-<n>.mp4 (ou .jpg), met à jour timings.json
 * avec le champ `fond`, et note les crédits dans credits.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage : node scripts/video/chercher-images.mjs <slug>');
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
const CLE = env.PEXELS_API_KEY;
if (!CLE) {
  console.error('PEXELS_API_KEY manquante dans .env.local (clé gratuite : https://www.pexels.com/api/)');
  process.exit(1);
}

const dossier = resolve('video/public', slug);
const cheminTimings = resolve(dossier, 'timings.json');
const timings = JSON.parse(readFileSync(cheminTimings, 'utf8'));
const credits = [];

const entetes = { Authorization: CLE };

/** Un extrait vertical de 6 s ou plus, en HD ; sinon une photo verticale. */
async function trouver(requete, index) {
  const cibleMp4 = resolve(dossier, `scene-${index}.mp4`);
  const cibleJpg = resolve(dossier, `scene-${index}.jpg`);
  if (existsSync(cibleMp4)) return `scene-${index}.mp4`;
  if (existsSync(cibleJpg)) return `scene-${index}.jpg`;

  const rv = await fetch(
    `https://api.pexels.com/videos/search?query=${encodeURIComponent(requete)}&orientation=portrait&size=medium&per_page=5`,
    { headers: entetes },
  );
  if (rv.ok) {
    const { videos } = await rv.json();
    const video = (videos ?? []).find((v) => v.duration >= 6);
    if (video) {
      const fichier =
        video.video_files
          .filter((f) => f.file_type === 'video/mp4' && f.height >= f.width && f.height >= 1280)
          .sort((a, b) => a.height - b.height)[0] ?? video.video_files[0];
      const donnees = await (await fetch(fichier.link)).arrayBuffer();
      writeFileSync(cibleMp4, Buffer.from(donnees));
      credits.push({ scene: index, type: 'video', auteur: video.user?.name, url: video.url });
      return `scene-${index}.mp4`;
    }
  }

  const rp = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(requete)}&orientation=portrait&per_page=3`,
    { headers: entetes },
  );
  if (rp.ok) {
    const { photos } = await rp.json();
    const photo = photos?.[0];
    if (photo) {
      const donnees = await (await fetch(photo.src.large2x ?? photo.src.large)).arrayBuffer();
      writeFileSync(cibleJpg, Buffer.from(donnees));
      credits.push({ scene: index, type: 'photo', auteur: photo.photographer, url: photo.url });
      return `scene-${index}.jpg`;
    }
  }
  return null;
}

for (const scene of timings.scenes) {
  const fond = await trouver(scene.requete || timings.titre, scene.index);
  scene.fond = fond ?? undefined;
  console.log(`  scène ${scene.index} : ${fond ?? 'aucun fond trouvé'} (« ${scene.requete} »)`);
}

writeFileSync(cheminTimings, JSON.stringify(timings, null, 2));
writeFileSync(resolve(dossier, 'credits.json'), JSON.stringify(credits, null, 2));
console.log(`${credits.length} fonds téléchargés, crédits dans credits.json`);
