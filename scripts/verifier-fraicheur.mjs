/**
 * Dit quelles valeurs fiscales ont dépassé leur durée de validité.
 *
 * Le catalogue ne se dégrade pas parce qu'on l'a mal écrit, mais parce que la
 * Belgique indexe ses montants chaque année : une valeur exacte le jour où on
 * la pose devient fausse toute seule. Ce script met une date sur ce
 * pourrissement au lieu de le laisser passer inaperçu.
 *
 * Usage :
 *   node scripts/verifier-fraicheur.mjs            # à la date du jour
 *   node scripts/verifier-fraicheur.mjs 2027-03-15 # à une date donnée
 *
 * Sort en code 1 si au moins une valeur est à revoir : utilisable en CI ou dans
 * un cron mensuel, pour que la dérive se signale d'elle-même.
 */
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ici = dirname(fileURLToPath(import.meta.url));
const url = (rel) => pathToFileURL(resolve(ici, rel)).href;

const { PARAMETRES_2026 } = await import(url('../src/lib/tax/parametres.ts'));
const { JOURS_PEREMPTION, aRevoir, joursDepuisVerification, peremptionDe } = await import(
  url('../src/lib/tax/types.ts')
);

const aujourdhui = process.argv[2] ?? new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(aujourdhui)) {
  console.error(`Date invalide : « ${aujourdhui} ». Attendu AAAA-MM-JJ.`);
  process.exit(2);
}

const LIBELLE = {
  annuelle: 'indexé chaque année',
  legale: 'fixé par la loi',
  commerciale: 'tarif de marché',
  stable: 'convention de calcul',
};

const enrichis = PARAMETRES_2026.map((p) => ({
  p,
  rythme: peremptionDe(p),
  jours: joursDepuisVerification(p, aujourdhui),
  perime: aRevoir(p, aujourdhui),
}));

const perimes = enrichis.filter((e) => e.perime).sort((a, b) => (b.jours ?? 1e9) - (a.jours ?? 1e9));

// Ce qui arrive à échéance dans les deux mois : de quoi préparer la revue avant
// qu'un chiffre faux ne s'affiche.
const bientot = enrichis
  .filter((e) => !e.perime && e.jours !== null)
  .filter((e) => JOURS_PEREMPTION[e.rythme] - e.jours <= 60)
  .sort((a, b) => JOURS_PEREMPTION[a.rythme] - a.jours - (JOURS_PEREMPTION[b.rythme] - b.jours));

console.log(`Catalogue fiscal au ${aujourdhui} — ${PARAMETRES_2026.length} paramètres\n`);

const parRythme = {};
for (const e of enrichis) parRythme[e.rythme] = (parRythme[e.rythme] ?? 0) + 1;
for (const [rythme, n] of Object.entries(parRythme).sort()) {
  console.log(`  ${String(n).padStart(3)} ${LIBELLE[rythme]} — revue tous les ${JOURS_PEREMPTION[rythme]} jours`);
}

if (perimes.length > 0) {
  console.log(`\nÀ REVOIR — ${perimes.length} valeur(s) au-delà de leur durée de validité\n`);
  for (const { p, rythme, jours } of perimes) {
    const age = jours === null ? 'jamais vérifiée' : `${jours} j`;
    console.log(`  ${p.cle}`);
    console.log(`      ${p.valeur} ${p.unite} · ${LIBELLE[rythme]} · ${age} · ${p.sourceUrl}`);
  }
}

if (bientot.length > 0) {
  console.log(`\nÀ ÉCHÉANCE SOUS DEUX MOIS — ${bientot.length} valeur(s)\n`);
  for (const { p, rythme, jours } of bientot) {
    console.log(`  ${p.cle} — dans ${JOURS_PEREMPTION[rythme] - jours} j`);
  }
}

if (perimes.length === 0 && bientot.length === 0) {
  console.log('\nAucune valeur à revoir, aucune échéance sous deux mois.');
}

process.exit(perimes.length > 0 ? 1 : 0);
