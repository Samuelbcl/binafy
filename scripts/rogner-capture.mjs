// Rogne le haut d'une capture pleine page : une page de 9 000 px ne passe ni en
// pièce jointe ni en relecture, et son haut est ce qu'on juge en premier.
// Usage : node scripts/rogner-capture.mjs captures/x.png captures/x-haut.png 2600
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';

const [source, sortie, hauteur = '2600'] = process.argv.slice(2);
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 780, height: Number(hauteur) }, deviceScaleFactor: 0.6 });
await page.goto(pathToFileURL(resolve(source)).href);
await page.screenshot({ path: sortie, clip: { x: 0, y: 0, width: 780, height: Number(hauteur) } });
await nav.close();
console.log((statSync(sortie).size / 1024) | 0, 'Ko');
