/**
 * Vérifie le job d'instantanés quotidiens de bout en bout.
 *
 * Crée un compte de test avec un actif et un passif, appelle la route de cron
 * comme Vercel le ferait, et contrôle que les snapshots sont bien écrits avec
 * les bons montants. Nettoie derrière lui quoi qu'il arrive.
 *
 * Le serveur doit tourner. Usage :
 *   npm run build && npx next start -p 3400
 *   node --env-file=.env.local scripts/verifier-cron.mjs http://localhost:3400
 */
import { createClient } from '@supabase/supabase-js';

const base = process.argv[2] ?? 'http://localhost:3000';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.CRON_SECRET;

if (!url || !service || !secret) {
  console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ou CRON_SECRET manquant.');
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let echecs = 0;
function verifier(intitule, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) echecs++;
  console.log(`  ${ok ? '✓' : '✗'}  ${intitule}${detail ? ` — ${detail}` : ''}`);
}

const suffixe = Date.now();
let idUtilisateur = null;

try {
  // ── Le secret protège-t-il la route ? ──────────────────────
  const sansSecret = await fetch(`${base}/api/cron/snapshots`);
  verifier('sans secret, la route refuse', sansSecret.status === 401, `HTTP ${sansSecret.status}`);

  const mauvaisSecret = await fetch(`${base}/api/cron/snapshots`, {
    headers: { Authorization: 'Bearer mauvais-secret-de-la-bonne-longueur-xxxxxxxxxxxxxxxxxxx' },
  });
  verifier(
    'avec un mauvais secret, la route refuse',
    mauvaisSecret.status === 401,
    `HTTP ${mauvaisSecret.status}`,
  );

  // ── Compte de test avec un patrimoine connu ────────────────
  const { data: cree, error: erreurCompte } = await admin.auth.admin.createUser({
    email: `test-cron-${suffixe}@nestor.invalid`,
    password: `Mdp-${suffixe}-C!`,
    email_confirm: true,
  });
  if (erreurCompte) throw new Error(`Création du compte : ${erreurCompte.message}`);
  idUtilisateur = cree.user.id;

  // 10 000 € sur un compte, 4 000 € d'ETF avec une base à 3 000 €.
  const { error: erreurActifs } = await admin.from('assets').insert([
    {
      user_id: idUtilisateur,
      nom: 'Compte test',
      classe: 'compte_courant',
      solde_cents: 1_000_000,
      est_manuel: true,
    },
    {
      user_id: idUtilisateur,
      nom: 'ETF test',
      classe: 'etf',
      quantite: 1,
      valeur_unitaire_cents: 400_000,
      prix_acquisition_cents: 300_000,
      date_acquisition: '2026-03-01',
      inscrit_en_belgique: false,
      est_manuel: true,
    },
  ]);
  if (erreurActifs) throw new Error(`Insertion des actifs : ${erreurActifs.message}`);

  // Un prêt de 2 400 € sur 36 mois à 6,9 %, démarré il y a longtemps : soldé.
  const { error: erreurPassif } = await admin.from('liabilities').insert({
    user_id: idUtilisateur,
    nom: 'Prêt test',
    type: 'pret_temperament',
    capital_initial_cents: 240_000,
    capital_restant_cents: 0,
    taux_annuel: 6.9,
    duree_mois: 36,
    date_debut: '2020-01-01',
    mensualite_cents: 7_420,
  });
  if (erreurPassif) throw new Error(`Insertion du passif : ${erreurPassif.message}`);

  // ── Exécution du job ───────────────────────────────────────
  const reponse = await fetch(`${base}/api/cron/snapshots`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const resultat = await reponse.json();

  verifier('avec le bon secret, le job s’exécute', reponse.status === 200, `HTTP ${reponse.status}`);
  verifier('aucune erreur remontée', (resultat.erreurs?.length ?? 0) === 0, JSON.stringify(resultat.erreurs ?? []));

  // ── Contrôle des snapshots écrits ──────────────────────────
  const { data: net } = await admin
    .from('net_worth_snapshots')
    .select('*')
    .eq('user_id', idUtilisateur)
    .maybeSingle();

  verifier('un instantané de patrimoine net est écrit', Boolean(net));

  if (net) {
    // 1 000 000 + 400 000 = 1 400 000 centimes d'actifs.
    verifier('les actifs sont justes', Number(net.actifs_cents) === 1_400_000, `${net.actifs_cents}`);
    // Le prêt est arrivé à terme : capital restant dû nul.
    verifier('le passif soldé vaut zéro', Number(net.passifs_cents) === 0, `${net.passifs_cents}`);
    verifier('le net est cohérent', Number(net.net_cents) === 1_400_000, `${net.net_cents}`);
    // Plus-value de 100 000 c (1 000 €), sous l'exonération : taxe nulle.
    // Reste la TOB de sortie : 400 000 × 0,12 % = 480 centimes.
    verifier(
      'l’impôt latent ne retient que la TOB sous l’exonération',
      Number(net.impot_latent_cents) === 480,
      `${net.impot_latent_cents} centimes`,
    );
  }

  const { data: parActif } = await admin
    .from('asset_snapshots')
    .select('valeur_cents, assets!inner(user_id)')
    .eq('assets.user_id', idUtilisateur);

  verifier('un instantané par actif est écrit', parActif?.length === 2, `${parActif?.length ?? 0}/2`);

  // ── Idempotence : relancer ne duplique pas ─────────────────
  await fetch(`${base}/api/cron/snapshots`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const { count } = await admin
    .from('net_worth_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', idUtilisateur);

  verifier('relancer le job ne duplique pas', count === 1, `${count} ligne(s)`);
} catch (erreur) {
  console.error('\nÉchec :', erreur.message);
  echecs++;
} finally {
  if (idUtilisateur) {
    await admin.auth.admin.deleteUser(idUtilisateur).catch(() => {});
    console.log('\nCompte de test supprimé.');
  }
}

console.log(echecs === 0 ? '\nJob de snapshots vérifié.\n' : `\n${echecs} échec(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
