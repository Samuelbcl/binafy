// Captures mobiles de Nestor a 390 x 844, avec une session reelle.
// Le compte de test est supprime a la fin, quoi qu'il arrive.
import { readFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

// `--clair` capture le meme parcours en theme clair. Le sombre est le defaut
// de l'application ; le clair reste la moitie de l'interface, et sans ces
// captures ses defauts ne se voient jamais.
const CLAIR = process.argv.includes('--clair');
const SORTIE = process.argv.filter((a) => !a.startsWith('--'))[2] ?? 'captures';
mkdirSync(SORTIE, { recursive: true });

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
const BASE = 'http://localhost:3000';

const admin = (chemin, init = {}) =>
  fetch(`${URL_SB}${chemin}`, {
    ...init,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

const PAGES = [
  ['accueil', '/'],
  ['connexion', '/connexion'],
  ['outils-index', '/outils'],
  ['outil-capacite', '/outils/capacite-emprunt'],
  ['outil-budget', '/outils/budget'],
  ['outil-independant', '/outils/independant-complementaire'],
  ['outil-frais', '/outils/frais-acquisition'],
  ['apprendre-index', '/apprendre'],
  ['apprendre-guide', '/apprendre/fiscalite-etf-belgique'],
  ['app-dashboard', '/dashboard'],
  ['app-patrimoine', '/patrimoine'],
  ['app-budget', '/budget'],
  ['app-fiscalite', '/fiscalite'],
  ['app-projections', '/projections'],
  ['app-objectifs', '/objectifs'],
  ['app-objectifs-matelas', '/objectifs?onglet=matelas'],
  ['app-objectif-nouveau', '/objectifs/nouveau'],
  ['app-parametres', '/parametres'],
];

let userId = null;

try {
  const MOTDEPASSE = `capture-${Math.random().toString(36).slice(2)}-2026`;
  const c = await admin('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: MOTDEPASSE, email_confirm: true }),
  });
  const utilisateur = await c.json();
  if (!c.ok) throw new Error(`creation ${c.status}`);
  userId = utilisateur.id;

  const v = await fetch(`${URL_SB}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: MOTDEPASSE }),
  });
  const sess = await v.json();
  if (!sess.access_token) throw new Error('pas de session');

  // Des donnees, sinon on ne capture que des ecrans vides.
  const CLES = [
    'user_id', 'nom', 'classe', 'solde_cents', 'quantite', 'valeur_unitaire_cents',
    'compte_epargne_reglemente', 'taux_base', 'prime_fidelite', 'capitalisant',
    'prix_acquisition_cents', 'valeur_reference_2025_cents',
  ];
  const complet = (o) => Object.fromEntries(CLES.map((k) => [k, o[k] ?? null]));
  await fetch(`${URL_SB}/rest/v1/assets`, {
    method: 'POST',
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(
      [
        { user_id: userId, nom: "Compte d'epargne Belfius", classe: 'compte_epargne', solde_cents: 680000, compte_epargne_reglemente: true, taux_base: 0.9, prime_fidelite: 0.6 },
        { user_id: userId, nom: 'Compte a vue KBC', classe: 'compte_courant', solde_cents: 234000 },
        { user_id: userId, nom: 'iShares Core MSCI World', classe: 'etf', quantite: 32, valeur_unitaire_cents: 10637, capitalisant: true, prix_acquisition_cents: 288000, valeur_reference_2025_cents: 310000 },
        { user_id: userId, nom: 'Colruyt', classe: 'action', quantite: 18, valeur_unitaire_cents: 4478, prix_acquisition_cents: 89400, valeur_reference_2025_cents: 85000 },
      ].map(complet),
    ),
  });

  const ref = new URL(URL_SB).hostname.split('.')[0];
  const session = {
    access_token: sess.access_token,
    refresh_token: sess.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: 'bearer',
    user: sess.user,
  };
  const valeur = 'base64-' + Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  const morceaux = [];
  for (let i = 0; i < valeur.length; i += 3180) morceaux.push(valeur.slice(i, i + 3180));
  const cookies = (morceaux.length === 1
    ? [{ name: `sb-${ref}-auth-token`, value: morceaux[0] }]
    : morceaux.map((m, i) => ({ name: `sb-${ref}-auth-token.${i}`, value: m }))
  ).map((c) => ({ ...c, domain: 'localhost', path: '/' }));

  // Un objectif en cours, rattache au compte d'epargne : sans lui, la page
  // Objectifs et la zone du tableau de bord ne montrent que l'etat vide.
  const lignesActifs = await (await fetch(`${URL_SB}/rest/v1/assets?user_id=eq.${userId}&select=id,classe`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  })).json();
  const epargne = Array.isArray(lignesActifs) ? lignesActifs.find((a) => a.classe === 'compte_epargne') : null;
  const dans = (mois) => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + mois, 1)).toISOString().slice(0, 10);
  };
  const objectifs = await (await fetch(`${URL_SB}/rest/v1/goals`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify([
      { user_id: userId, nom: 'Mon matelas de securite', type: 'precaution', montant_cible_cents: 840000, echeance: dans(10),
        parametres: { icone: 'bouclier', teinte: 'menthe', contribution_cents: 15000, frequence: 'mois', inspiration: 'matelas' } },
      { user_id: userId, nom: 'Un grand voyage', type: 'libre', montant_cible_cents: 350000, echeance: dans(18),
        parametres: { icone: 'avion', teinte: 'lagune', contribution_cents: 100000, frequence: 'annee', inspiration: 'voyage' } },
    ]),
  })).json();
  if (epargne && Array.isArray(objectifs) && objectifs[0]) {
    await fetch(`${URL_SB}/rest/v1/goal_assets`, {
      method: 'POST',
      headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify([{ goal_id: objectifs[0].id, asset_id: epargne.id }]),
    });
  }

  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fr-BE',
    colorScheme: CLAIR ? 'light' : 'dark',
  });
  await contexte.addCookies(cookies);
  // Le theme par defaut de l'app est le sombre, meme quand le systeme est
  // clair : `colorScheme` ne suffit donc pas, il faut ecrire le choix que
  // next-themes relit au demarrage.
  if (CLAIR) await contexte.addInitScript(() => localStorage.setItem('theme', 'light'));
  const page = await contexte.newPage();

  const debordements = [];

  for (const [nom, chemin] of PAGES) {
    await page.goto(`${BASE}${chemin}`, { waitUntil: 'networkidle', timeout: 30_000 });
    await page.waitForTimeout(400);

    // Debordement horizontal : le symptome le plus frequent en mobile.
    const trop = await page.evaluate(() => {
      const large = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
      if (!large) return null;
      const coupables = [];
      // Un element rogne par un ancetre `overflow: hidden` n'elargit pas le
      // document : sans ce filtre, chaque motif decoratif remonte en faux positif.
      const rogne = (el) => {
        for (let p = el.parentElement; p; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (o.overflowX !== 'visible' || o.overflow !== 'visible') return true;
        }
        return false;
      };

      // Seul le cote droit elargit le document : un tiroir range a gauche par
      // une translation negative n'y change rien. Les elements rognes sont
      // gardes a part — quand rien d'autre ne depasse, c'est l'un d'eux qui
      // s'echappe de son rogneur (position absolue, transformation).
      const suspects = [];
      for (const el of document.querySelectorAll('*')) {
        const r = el.getBoundingClientRect();
        if (r.right <= window.innerWidth + 1) continue;
        const ligne = `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 90)} → ${Math.round(r.left)}..${Math.round(r.right)}`;
        if (rogne(el)) suspects.push(ligne);
        else coupables.push(ligne);
        if (coupables.length >= 5) break;
      }
      return {
        largeur: document.documentElement.scrollWidth,
        coupables: coupables.length > 0 ? coupables : suspects.slice(0, 5).map((l) => `(rogne) ${l}`),
      };
    });
    if (trop) debordements.push([chemin, trop]);

    // SONDE=chemin (sans barre : Git Bash la convertirait en chemin Windows) :
    // quand aucun rectangle ne depasse et que la page deborde
    // quand meme, on cherche le coupable par elimination — on masque chaque
    // element a son tour et on regarde si la largeur retombe.
    if (trop && process.env.SONDE && chemin.includes(process.env.SONDE)) {
      const responsables = await page.evaluate(() => {
        const ok = () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1;
        const trouves = [];
        for (const el of document.querySelectorAll('main *')) {
          const avant = el.style.display;
          el.style.display = 'none';
          const repare = ok();
          el.style.display = avant;
          if (repare) trouves.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 100)}`);
          if (trouves.length >= 14) break;
        }
        return trouves;
      });
      console.log('  sonde', chemin, ':');
      for (const r of responsables) console.log('     ', r);
    }

    await page.screenshot({
      path: `${SORTIE}/${nom}${CLAIR ? '-clair' : ''}.png`,
      fullPage: true,
    });
    console.log(`  ${nom} <- ${chemin}`);
  }

  await navigateur.close();

  console.log('');
  if (debordements.length === 0) {
    console.log('aucun debordement horizontal');
  } else {
    console.log('DEBORDEMENTS HORIZONTAUX');
    for (const [chemin, d] of debordements) {
      console.log(`  ${chemin} — largeur ${d.largeur}px`);
      for (const c of d.coupables) console.log(`      ${c}`);
    }
  }
} finally {
  if (userId) {
    await admin(`/auth/v1/admin/users/${userId}`, { method: 'DELETE' });
    console.log('\ncompte de test supprime');
  }
}
