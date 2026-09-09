/**
 * Génère, pour chaque scène d'une narration, un fond vidéo sur mesure :
 * une image de départ (FLUX 2 Max, texte → image) puis son animation
 * (Higgsfield, image → vidéo de 5 s), via Pixazo — la même clé pour les deux.
 *
 * Coût par scène, tarif Pixazo : ~0,07 $ l'image + 0,135 $ le clip (dop-lite),
 * soit ~1,5 $ par guide de sept scènes. Un clip de 5 s couvre une scène de
 * 6 à 12 s en étant ralenti par Remotion (voir video/Guide.tsx) : un seul clip
 * par scène suffit, et c'est ce qui tient les sept guides dans quinze dollars.
 *
 * Clé dans .env.local : PIXAZO_API_KEY (https://api-console.pixazo.ai/api_keys)
 * Usage : node scripts/video/generer-fonds.mjs <slug> [--modele=dop-lite|dop-turbo|dop-preview]
 * Écrit video/public/<slug>/scene-<n>.jpg et scene-<n>.mp4, met à jour timings.json
 * (champ `fond` et `fondDureeSecondes`) et note chaque appel dans couts.json.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage : node scripts/video/generer-fonds.mjs <slug> [--modele=dop-lite]');
  process.exit(1);
}
const modele = (process.argv.find((a) => a.startsWith('--modele=')) ?? '--modele=dop-lite').split('=')[1];

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const CLE = env.PIXAZO_API_KEY;
if (!CLE) {
  console.error('PIXAZO_API_KEY manquante dans .env.local');
  process.exit(1);
}
const entetes = { 'Ocp-Apim-Subscription-Key': CLE, 'Content-Type': 'application/json' };

const dossier = resolve('video/public', slug);
const cheminTimings = resolve(dossier, 'timings.json');
const timings = JSON.parse(readFileSync(cheminTimings, 'utf8'));
const narration = JSON.parse(readFileSync(resolve('video/narrations', `${slug}.json`), 'utf8'));
const cheminCouts = resolve(dossier, 'couts.json');
const couts = existsSync(cheminCouts) ? JSON.parse(readFileSync(cheminCouts, 'utf8')) : [];

/** Le style commun à toutes les scènes : on le répète, il fait l'unité du film. */
const STYLE =
  'cinematic photograph, vertical 9:16 composition, soft natural light, shallow depth of field, muted warm palette with a hint of lavender, no text, no logos, no watermark, photorealistic';

/** Soumet une requête et attend son résultat. */
async function lancer(url, corps, libelle) {
  const r = await fetch(url, { method: 'POST', headers: entetes, body: JSON.stringify(corps) });
  if (!r.ok) throw new Error(`${libelle} : ${r.status} ${await r.text()}`);
  const { request_id, polling_url } = await r.json();
  const statutUrl = polling_url ?? `https://gateway.pixazo.ai/v2/requests/status/${request_id}`;
  for (let i = 0; i < 180; i++) {
    await new Promise((res) => setTimeout(res, 5000));
    const s = await fetch(statutUrl, { headers: { 'Ocp-Apim-Subscription-Key': CLE } });
    const j = await s.json();
    if (['COMPLETED', 'SUCCEEDED', 'SUCCESS', 'DONE'].includes(j.status)) return j;
    if (['FAILED', 'ERROR', 'CANCELLED'].includes(j.status)) throw new Error(`${libelle} : ${JSON.stringify(j).slice(0, 300)}`);
  }
  throw new Error(`${libelle} : délai dépassé`);
}

/** La première URL de fichier du type voulu dans une réponse, où qu'elle soit. */
function urlDans(reponse, extension) {
  const m = JSON.stringify(reponse).match(new RegExp(`https?:\\\\/\\\\/[^"]+\\\\.${extension}[^"]*|https?://[^"]+\\.${extension}[^"]*`));
  return m ? m[0].replace(/\\\//g, '/') : null;
}

async function telecharger(url, chemin) {
  const b = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(chemin, b);
  return b.length;
}

// Les scenes se generent en parallele : chaque clip prend plusieurs minutes,
// et rien ne les fait dependre l'une de l'autre.
await Promise.all(timings.scenes.map(genererScene));

async function genererScene(scene) {
  const source = narration.scenes[scene.index - 1] ?? {};
  const cibleMp4 = resolve(dossier, `scene-${scene.index}.mp4`);
  const cibleJpg = resolve(dossier, `scene-${scene.index}.jpg`);

  if (existsSync(cibleMp4)) {
    scene.fond = `scene-${scene.index}.mp4`;
    console.log(`  scène ${scene.index} : déjà là`);
    return;
  }

  // 1. L'image de départ. Le prompt d'image vient de la narration (en anglais,
  //    les modèles y sont meilleurs) ; à défaut, la requête de recherche.
  const promptImage = `${source.image ?? source.requete ?? timings.titre}. ${STYLE}`;
  if (!existsSync(cibleJpg)) {
    const rep = await lancer(
      'https://gateway.pixazo.ai/flux-2-max/v1/flux-2-max-request',
      { prompt: promptImage, image_size: 'portrait_16_9', output_format: 'jpeg', safety_tolerance: 2 },
      `image scène ${scene.index}`,
    );
    const url = urlDans(rep, 'jpe?g') ?? urlDans(rep, 'png');
    if (!url) throw new Error(`image scène ${scene.index} : pas d'URL dans ${JSON.stringify(rep).slice(0, 300)}`);
    const octets = await telecharger(url, cibleJpg);
    couts.push({ scene: scene.index, type: 'image', modele: 'flux-2-max', octets, quand: new Date().toISOString() });
    console.log(`  scène ${scene.index} : image ${(octets / 1024) | 0} Ko`);
  }

  // 2. L'animation. L'image doit être joignable par URL : on la publie dans le
  //    Storage public sous essais/, à côté des vidéos.
  const urlImage = await publierImage(cibleJpg, `${slug}-scene-${scene.index}.jpg`);
  const promptVideo = `${source.mouvement ?? 'slow cinematic push-in, gentle handheld feel, subtle ambient motion'}. Keep the composition, no text.`;
  const rep = await lancer(
    'https://gateway.pixazo.ai/ai-model-api/v1/image-to-video',
    { model: modele, prompt: promptVideo, input_images: [urlImage], enhance_prompt: true },
    `vidéo scène ${scene.index}`,
  );
  const url = urlDans(rep, 'mp4');
  if (!url) throw new Error(`vidéo scène ${scene.index} : pas d'URL dans ${JSON.stringify(rep).slice(0, 300)}`);
  const octets = await telecharger(url, cibleMp4);
  couts.push({ scene: scene.index, type: 'video', modele, octets, quand: new Date().toISOString() });
  scene.fond = `scene-${scene.index}.mp4`;
  scene.fondDureeSecondes = 5;
  console.log(`  scène ${scene.index} : clip ${(octets / 1024) | 0} Ko`);
  writeFileSync(cheminTimings, JSON.stringify(timings, null, 2));
  writeFileSync(cheminCouts, JSON.stringify(couts, null, 2));
}

writeFileSync(cheminTimings, JSON.stringify(timings, null, 2));
writeFileSync(cheminCouts, JSON.stringify(couts, null, 2));
console.log(`${slug} : fonds générés — ${couts.length} appels au total, détail dans couts.json`);

/** Dépose l'image de départ dans le Storage public (bucket videos, dossier essais). */
async function publierImage(chemin, nom) {
  const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
  const r = await fetch(`${URL_SB}/storage/v1/object/videos/essais/${nom}`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' },
    body: readFileSync(chemin),
  });
  if (!r.ok) throw new Error(`publication de ${nom} : ${r.status} ${await r.text()}`);
  return `${URL_SB}/storage/v1/object/public/videos/essais/${nom}`;
}
