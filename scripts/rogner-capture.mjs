// Rogne le haut d'une capture pleine page : une page de 9 000 px ne passe ni en
// pièce jointe ni en relecture, et son haut est ce qu'on juge en premier.
// Usage : node scripts/rogner-capture.mjs captures/x.png captures/x-haut.png 2600
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { readFileSync, statSync } from 'node:fs';

const [source, sortie, hauteur = '2600'] = process.argv.slice(2);
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 780, height: Number(hauteur) }, deviceScaleFactor: 0.6 });
// Pas de navigation directe vers l'image : ouverte seule, Chromium la reduit
// pour qu'elle tienne dans la fenetre, et le rognage n'en garderait qu'une
// vignette. Posee dans une page a sa largeur naturelle, elle reste a l'echelle.
// En donnee inline : une page vide n'a pas le droit de charger un fichier local.
const donnees = readFileSync(resolve(source)).toString('base64');
await page.setContent(
  `<img src="data:image/png;base64,${donnees}" style="display:block;width:780px;height:auto">`,
  { waitUntil: 'load' },
);
await page.screenshot({ path: sortie, clip: { x: 0, y: 0, width: 780, height: Number(hauteur) } });
await nav.close();
console.log((statSync(sortie).size / 1024) | 0, 'Ko');
