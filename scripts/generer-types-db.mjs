/**
 * Génère les types TypeScript depuis le schéma réel de la base.
 *
 * Passe par l'API Management plutôt que par `supabase gen types`, qui exige une
 * connexion directe à Postgres et donc le mot de passe de la base.
 *
 * À relancer après chaque migration : c'est ce qui garantit que le code et la
 * base ne divergent pas.
 *
 * Usage : node --env-file=.env.local scripts/generer-types-db.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const urlProjet = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!token || !urlProjet) {
  console.error(
    'SUPABASE_ACCESS_TOKEN ou NEXT_PUBLIC_SUPABASE_URL absent.\n' +
      'Lance avec : node --env-file=.env.local scripts/generer-types-db.mjs',
  );
  process.exit(1);
}

const ref = new URL(urlProjet).hostname.split('.')[0];

const reponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/types/typescript`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!reponse.ok) {
  console.error(`HTTP ${reponse.status}\n${(await reponse.text()).slice(0, 500)}`);
  process.exit(1);
}

const { types } = await reponse.json();

const entete = [
  '/**',
  ' * Types de la base, générés depuis le schéma réel.',
  ' *',
  ' * ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.',
  ' * Régénérer : node --env-file=.env.local scripts/generer-types-db.mjs',
  ' *',
  " * Les montants sont des bigint en Postgres. PostgREST les sérialise en number,",
  " * ce qui reste exact jusqu'à 2^53 — très au-delà de ce qu'un patrimoine",
  ' * personnel atteint en centimes.',
  ' */',
  '',
  '',
].join('\n');

const chemin = resolve(racine, 'src/lib/db/types.ts');
writeFileSync(chemin, entete + types, 'utf8');

const tables = [...types.matchAll(/^      (\w+): \{$/gm)].map((m) => m[1]);
console.log(`src/lib/db/types.ts écrit — ${types.split('\n').length} lignes`);
console.log(`${new Set(tables).size} entrées de schéma typées`);
