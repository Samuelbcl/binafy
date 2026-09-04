/**
 * Applique les migrations Supabase via l'API Management.
 *
 * Pourquoi pas `supabase db push` : celui-ci se connecte en direct à Postgres et
 * exige le mot de passe de la base. L'API Management, elle, n'a besoin que du
 * Personal Access Token — une chose de moins à faire circuler.
 *
 * Le script tient à jour `supabase_migrations.schema_migrations`, le registre que
 * le CLI consulte : `supabase db push` et `supabase migration list` restent donc
 * cohérents si tu repasses par eux plus tard.
 *
 * Idempotent : une migration déjà enregistrée est ignorée.
 *
 * Usage : node --env-file=.env.local scripts/appliquer-migrations.mjs [--seed]
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const urlProjet = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!token) {
  console.error(
    'SUPABASE_ACCESS_TOKEN est absent. Lance avec : node --env-file=.env.local scripts/appliquer-migrations.mjs',
  );
  process.exit(1);
}
if (!urlProjet) {
  console.error('NEXT_PUBLIC_SUPABASE_URL est absent.');
  process.exit(1);
}

/** Le ref du projet se lit dans l'URL : https://<ref>.supabase.co */
const ref = new URL(urlProjet).hostname.split('.')[0];

async function executer(sql, etiquette) {
  const reponse = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  });

  const corps = await reponse.text();
  if (!reponse.ok) {
    throw new Error(`${etiquette} — HTTP ${reponse.status}\n${corps.slice(0, 900)}`);
  }

  try {
    return JSON.parse(corps);
  } catch {
    return corps;
  }
}

// ── Registre des migrations ──────────────────────────────────
await executer(
  `create schema if not exists supabase_migrations;
   create table if not exists supabase_migrations.schema_migrations (
     version text primary key,
     statements text[],
     name text
   );`,
  'création du registre',
);

const dejaAppliquees = new Set(
  (
    await executer(
      'select version from supabase_migrations.schema_migrations order by version;',
      'lecture du registre',
    )
  ).map((l) => l.version),
);

// ── Application ──────────────────────────────────────────────
const dossier = join(racine, 'supabase', 'migrations');
const fichiers = readdirSync(dossier)
  .filter((f) => f.endsWith('.sql'))
  .sort();

let appliquees = 0;

for (const fichier of fichiers) {
  const version = fichier.split('_')[0];
  const nom = fichier.replace(/^\d+_/, '').replace(/\.sql$/, '');

  if (dejaAppliquees.has(version)) {
    console.log(`  ⏭  ${fichier} — déjà appliquée`);
    continue;
  }

  const sql = readFileSync(join(dossier, fichier), 'utf8');

  // Chaque migration est atomique : en cas d'échec au milieu, rien n'est appliqué,
  // sinon on se retrouverait avec un schéma à moitié créé et non rejouable.
  const enveloppe = `begin;\n${sql}\ncommit;`;

  try {
    await executer(enveloppe, fichier);
  } catch (erreur) {
    console.error(`\n  ✗  ${fichier}\n${erreur.message}\n`);
    process.exit(1);
  }

  // On enregistre après coup : une migration non enregistrée sera simplement
  // rejouée, alors qu'une migration enregistrée mais non appliquée serait
  // silencieusement sautée.
  await executer(
    `insert into supabase_migrations.schema_migrations (version, name, statements)
     values ('${version}', '${nom.replace(/'/g, "''")}', array[]::text[])
     on conflict (version) do nothing;`,
    `enregistrement de ${fichier}`,
  );

  console.log(`  ✓  ${fichier}`);
  appliquees++;
}

console.log(
  `\n${appliquees} migration(s) appliquée(s), ${fichiers.length - appliquees} déjà en place.`,
);

// ── Seed des paramètres fiscaux ──────────────────────────────
if (process.argv.includes('--seed')) {
  const seed = readFileSync(join(racine, 'supabase', 'seed', 'tax_parameters_2026.sql'), 'utf8');
  await executer(seed, 'seed fiscal');

  const [{ total, verifies }] = await executer(
    `select count(*)::int as total, count(*) filter (where verifie)::int as verifies
     from tax_parameters where annee = 2026;`,
    'vérification du seed',
  );
  console.log(`Seed fiscal : ${total} paramètres pour 2026, dont ${verifies} vérifiés.`);
}
