/**
 * Génère supabase/seed/tax_parameters_2026.sql depuis le catalogue TypeScript.
 *
 * Le fichier TS et la table Postgres doivent porter exactement les mêmes valeurs.
 * Les régénérer plutôt que les retaper supprime toute possibilité de divergence.
 *
 * Usage : node scripts/generer-seed-fiscal.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
// Sur Windows, un chemin absolu doit passer par une URL file:// pour l'ESM.
const { PARAMETRES_2026 } = await import(
  pathToFileURL(resolve(ici, '../src/lib/tax/parametres.ts')).href,
);

const echapper = (s) => String(s).replaceAll("'", "''");

const lignes = PARAMETRES_2026.map((p) => {
  const region = p.region ? `'${p.region}'` : 'null';
  return `  ('${echapper(p.cle)}', ${p.annee}, ${region}, ${p.valeur}, '${p.unite}', '${echapper(p.libelle)}', '${echapper(p.sourceUrl)}', '${p.verifieLe}', ${p.verifie}, ${Boolean(p.hypothese)})`;
});

const verifies = PARAMETRES_2026.filter((p) => p.verifie).length;
// Les pratiques de marché et hypothèses de simulation ne sont pas des règles
// légales : les compter comme « à confirmer » promettrait une vérification qui
// n'existe pas.
const hypotheses = PARAMETRES_2026.filter((p) => p.hypothese).length;
const aConfirmer = PARAMETRES_2026.filter((p) => !p.verifie && !p.hypothese);

const sql = `-- ─────────────────────────────────────────────────────────────
-- Nestor — paramètres fiscaux belges ${PARAMETRES_2026[0].annee}
--
-- ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
-- Source : src/lib/tax/parametres.ts
-- Régénérer : node scripts/generer-seed-fiscal.mjs
--
-- ${PARAMETRES_2026.length} paramètres : ${verifies} confirmés à la source,
-- ${aConfirmer.length} règles légales en attente de vérification,
-- ${hypotheses} pratiques de marché ou hypothèses de simulation
-- (voir docs/11-parametres-a-verifier.md).
--
-- Mettre à jour un taux pour une nouvelle année = insérer des lignes ici,
-- jamais modifier du code.
-- ─────────────────────────────────────────────────────────────

insert into tax_parameters
  (cle, annee, region, valeur, unite, libelle, source_url, verifie_le, verifie, hypothese)
values
${lignes.join(',\n')}
on conflict (cle, annee, region) do update set
  valeur = excluded.valeur,
  unite = excluded.unite,
  libelle = excluded.libelle,
  source_url = excluded.source_url,
  verifie_le = excluded.verifie_le,
  verifie = excluded.verifie,
  hypothese = excluded.hypothese,
  updated_at = now();

-- Le catalogue fait autorité : un paramètre retiré du code doit disparaître de
-- la base, sinon il continuerait d'être lu sans que rien ne le signale.
delete from tax_parameters
where annee = ${PARAMETRES_2026[0].annee}
  and cle not in (${PARAMETRES_2026.map((p) => `'${echapper(p.cle)}'`).filter((v, i, a) => a.indexOf(v) === i).join(', ')});
`;

mkdirSync(resolve(ici, '../supabase/seed'), { recursive: true });
writeFileSync(resolve(ici, '../supabase/seed/tax_parameters_2026.sql'), sql, 'utf8');
console.log(
  `${PARAMETRES_2026.length} paramètres écrits — ${verifies} vérifiés, ` +
    `${aConfirmer.length} règles à confirmer, ${hypotheses} hypothèses`,
);

// ── Checklist de vérification (docs/11) ──────────────────────
const parGroupe = new Map();
for (const p of aConfirmer) {
  const groupe = p.cle.split('.')[0];
  if (!parGroupe.has(groupe)) parGroupe.set(groupe, []);
  parGroupe.get(groupe).push(p);
}

const SOURCES = {
  precompte_mobilier: 'SPF Finances — revenus mobiliers',
  epargne_reglementee: 'SPF Finances — comptes d’épargne réglementés',
  tob: 'SPF Finances — taxe sur les opérations de bourse',
  reynders: 'SPF Finances — plus-values de fonds obligataires',
  rc: 'Statbel — coefficient d’indexation du revenu cadastral',
  immobilier: 'SPF Finances — revenus immobiliers',
  droits_enregistrement: 'Région concernée (logement.wallonie.be, vlaanderen.be, fiscalite.brussels)',
  notaire: 'Barème légal des honoraires notariaux (notaire.be)',
  credit: 'Banque nationale de Belgique et pratique bancaire',
  ipp: 'SPF Finances — barème IPP indexé de l’année',
  independant: 'INASTI et caisses d’assurances sociales',
  tva: 'SPF Finances — régime de la franchise',
  epargne_pension: 'SPF Finances — avantages fiscaux',
  assurance: 'SPF Finances — taxe sur les primes',
  branche21: 'SPF Finances',
  hypothese: 'Hypothèse de simulation, pas un paramètre légal',
};

const sections = [...parGroupe.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([groupe, params]) => {
    const lignes = params
      .map(
        (p) =>
          `| \`${p.cle}\`${p.region ? ` (${p.region})` : ''} | ${p.valeur} ${p.unite} | ${p.libelle} |`,
      )
      .join('\n');
    return `### ${groupe}\n\nSource à consulter : ${SOURCES[groupe] ?? 'à déterminer'}\n\n| Clé | Valeur provisoire | Libellé |\n|---|---|---|\n${lignes}`;
  })
  .join('\n\n');

const doc = `# 11 — Paramètres fiscaux à vérifier

> **Fichier généré.** Régénérer avec \`node scripts/generer-seed-fiscal.mjs\`.
> Source : \`src/lib/tax/parametres.ts\`.

${PARAMETRES_2026.length} paramètres sont chargés pour ${PARAMETRES_2026[0].annee}.
**${verifies} sont confirmés** — leur valeur est chiffrée explicitement dans
\`docs/06-fiscalite-belge.md\`.
**${aConfirmer.length} règles légales attendent une confirmation** à la source officielle.
${hypotheses} autres valeurs sont des pratiques de marché ou des hypothèses de
simulation : elles ne relèvent d'aucun texte et ne figurent pas dans cette liste.

## Comment ça marche

Les valeurs non vérifiées sont des **ordres de grandeur**, nécessaires pour que
l’application calcule quelque chose. Elles portent \`verifie = false\`, et l’interface
affiche un avertissement sur tout résultat qui en dépend : on préfère le dire plutôt
que de laisser croire à une précision qu’on n’a pas.

Aucune de ces valeurs n’a été inventée silencieusement. Elles sont toutes ici.

## Procédure

Pour chaque paramètre ci-dessous :

1. ouvrir la source officielle indiquée ;
2. relever la valeur en vigueur pour l’année ${PARAMETRES_2026[0].annee} ;
3. corriger \`valeur\` dans \`src/lib/tax/parametres.ts\`, passer \`verifie: true\`
   et mettre \`verifieLe\` à la date du jour ;
4. régénérer le seed : \`node scripts/generer-seed-fiscal.mjs\` ;
5. relancer les tests : \`npm test\`.

Les tests du moteur fiscal encodent des cas métier chiffrés. Si une correction
en casse un, c’est le test qu’il faut relire d’abord : il documente peut-être la
bonne valeur.

## Liste par domaine

${sections}

## Rappel

Cette vérification est une tâche récurrente inscrite dans la roadmap : chaque
janvier, une session dédiée met à jour \`tax_parameters\` pour la nouvelle année
(\`docs/08-roadmap.md\` § entretien récurrent).
`;

writeFileSync(resolve(ici, '../docs/11-parametres-a-verifier.md'), doc, 'utf8');
console.log(`docs/11-parametres-a-verifier.md : ${aConfirmer.length} règles listées`);
