/**
 * Extrait de Solar (480 Design, CC BY 4.0) les seules icônes que Nestor
 * utilise, et les écrit dans `src/lib/icones/solar.ts`.
 *
 * Pourquoi un fichier généré plutôt qu'un paquet React : le paquet officiel
 * pèse cinquante mégaoctets et passe par un contexte React, donc pas de
 * rendu côté serveur ; le JSON Iconify complet fait des mégaoctets qu'on ne
 * veut pas dans le bundle du client. Quarante corps de SVG dans un module,
 * c'est quelques kilo-octets, et ça se rend partout — serveur, client, e-mail.
 *
 * Usage : node scripts/generer-icones.mjs
 * Ajouter une icône : son nom Solar dans BASES ci-dessous, puis relancer.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const { icons } = JSON.parse(
  readFileSync(new URL('../node_modules/@iconify-json/solar/icons.json', import.meta.url), 'utf8'),
);

/** Les noms de base ; chaque icône est extraite en trois styles. */
const BASES = [
  // Navigation
  'home-smile', 'wallet-money', 'bill-list', 'buildings-2', 'book-2',
  'calculator-minimalistic', 'chart-2', 'settings', 'target',
  // Outils publics
  'home-2', 'document-text', 'hand-money', 'graph-up', 'wallet',
  // Zones d'écran
  'banknote', 'bell', 'money-bag', 'safe-2', 'pie-chart-2',
  // Objectifs
  'shield-check', 'sun-2', 'square-academic-cap', 'wheel', 'hearts',
  'suitcase-tag', 'compass', 'star', 'balloon',
  // Catégories du budget
  'cart-large-2', 'refresh', 'chef-hat', 'ticket', 'heart-pulse', 'dumbbell',
  'bolt', 'phone-calling', 'gift', 'tag',
  // Gestes
  'add-circle', 'file-send',
];

const STYLES = ['bold-duotone', 'bold', 'linear'];

const sortie = {};
const manquantes = [];
for (const base of BASES) {
  for (const style of STYLES) {
    const cle = `${base}-${style}`;
    const icone = icons[cle];
    if (!icone) {
      manquantes.push(cle);
      continue;
    }
    sortie[cle] = { body: icone.body, width: icone.width ?? 24, height: icone.height ?? 24 };
  }
}
if (manquantes.length > 0) {
  console.error('Icônes absentes de Solar :', manquantes.join(', '));
  process.exit(1);
}

const lignes = Object.entries(sortie)
  .map(([cle, { body, width, height }]) =>
    `  '${cle}': { body: ${JSON.stringify(body)}, width: ${width}, height: ${height} },`,
  )
  .join('\n');

const fichier = `/* Généré par scripts/generer-icones.mjs — ne pas modifier à la main.
 * Icônes Solar (480 Design), licence CC BY 4.0 : https://www.figma.com/community/file/1166831539721848736
 */

export const BASES_ICONES = ${JSON.stringify(BASES)} as const;
export type BaseIcone = (typeof BASES_ICONES)[number];
export type StyleIcone = 'bold-duotone' | 'bold' | 'linear';

export const ICONES = {
${lignes}
} as const;

export type NomIcone = keyof typeof ICONES;
`;

mkdirSync(new URL('../src/lib/icones/', import.meta.url), { recursive: true });
writeFileSync(new URL('../src/lib/icones/solar.ts', import.meta.url), fichier);
console.log(`${Object.keys(sortie).length} icônes écrites dans src/lib/icones/solar.ts`);
