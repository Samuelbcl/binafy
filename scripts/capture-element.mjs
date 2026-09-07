/**
 * Capture un seul élément d'un écran authentifié, en grand.
 *
 * Les captures pleine page servent à juger la structure ; elles écrasent le
 * détail d'un composant. Celui-ci cadre sur un élément et le rend lisible —
 * utile quand on vient d'écrire un contrôle interactif et qu'on veut voir à
 * quoi il ressemble vraiment.
 *
 * Usage : node scripts/capture-element.mjs /fiscalite "texte du titre" sortie.png
 */
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [chemin = '/dashboard', ancre = '', sortie = 'captures/element.png'] = process.argv.slice(2);
mkdirSync('captures', { recursive: true });

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

const URL_SB = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = `capture-${Date.now()}@nestor.test`;
const MOTDEPASSE = `capture-${Math.random().toString(36).slice(2)}-2026`;

const admin = (c, init = {}) =>
  fetch(`${URL_SB}${c}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

let userId = null;
try {
  const c = await admin('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: MOTDEPASSE, email_confirm: true }),
  });
  userId = (await c.json()).id;

  const v = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: MOTDEPASSE }),
  });
  const sess = await v.json();

  const ref = new URL(URL_SB).hostname.split('.')[0];
  const valeur =
    'base64-' +
    Buffer.from(
      JSON.stringify({
        access_token: sess.access_token,
        refresh_token: sess.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: sess.user,
      }),
      'utf8',
    ).toString('base64url');
  const morceaux = [];
  for (let i = 0; i < valeur.length; i += 3180) morceaux.push(valeur.slice(i, i + 3180));
  const cookies = (
    morceaux.length === 1
      ? [{ name: `sb-${ref}-auth-token`, value: morceaux[0] }]
      : morceaux.map((m, i) => ({ name: `sb-${ref}-auth-token.${i}`, value: m }))
  ).map((c) => ({ ...c, domain: 'localhost', path: '/' }));

  const nav = await chromium.launch();
  const ctx = await nav.newContext({
    viewport: { width: 420, height: 900 },
    deviceScaleFactor: 2,
    locale: 'fr-BE',
  });
  await ctx.addCookies(cookies);
  const page = await ctx.newPage();
  await page.goto(`http://localhost:3000${chemin}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const cible = ancre
    ? page.locator('div.carte', { hasText: ancre }).first()
    : page.locator('main');
  await cible.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await cible.screenshot({ path: sortie });
  console.log('capture :', sortie);
  await nav.close();
} finally {
  if (userId) await admin(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' });
}
