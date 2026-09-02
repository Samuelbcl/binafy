/**
 * Concatène les migrations et le seed en un seul fichier SQL.
 *
 * Utile pour appliquer le schéma via le SQL Editor du tableau de bord Supabase
 * quand le CLI n'est pas connecté. Le fichier produit est dérivé : il n'est pas
 * versionné, on le régénère.
 *
 * Usage : node scripts/generer-sql-complet.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..');
const dossierMigrations = join(racine, 'supabase', 'migrations');

const migrations = readdirSync(dossierMigrations)
  .filter((f) => f.endsWith('.sql'))
  .sort();

const morceaux = [
  `-- ═════════════════════════════════════════════════════════════
-- Nestor — schéma complet
--
-- ⚠️ FICHIER GÉNÉRÉ — ne pas éditer, ne pas commiter.
-- Régénérer : node scripts/generer-sql-complet.mjs
--
-- À coller dans le SQL Editor du tableau de bord Supabase, en une fois.
-- Le script est idempotent sur le seed (upsert) mais PAS sur les migrations :
-- ne l'exécuter qu'une seule fois sur une base vierge.
-- ═════════════════════════════════════════════════════════════

`,
];

for (const fichier of migrations) {
  morceaux.push(
    `\n-- ─── ${fichier} ${'─'.repeat(Math.max(0, 50 - fichier.length))}\n\n`,
    readFileSync(join(dossierMigrations, fichier), 'utf8'),
    '\n',
  );
}

const seed = join(racine, 'supabase', 'seed', 'tax_parameters_2026.sql');
morceaux.push(
  `\n-- ─── seed : paramètres fiscaux ─────────────────────────────\n\n`,
  readFileSync(seed, 'utf8'),
);

const sortie = join(racine, 'supabase', 'schema-complet.generated.sql');
const contenu = morceaux.join('');
writeFileSync(sortie, contenu, 'utf8');

const lignes = contenu.split('\n').length;
console.log(`${migrations.length} migrations + seed → supabase/schema-complet.generated.sql`);
console.log(`${lignes} lignes, ${(contenu.length / 1024).toFixed(1)} Ko`);
