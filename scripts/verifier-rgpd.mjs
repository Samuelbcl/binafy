/**
 * Vérifie la portabilité et l'effacement (RGPD) contre la base réelle.
 *
 * Crée un compte avec des données dans plusieurs tables, contrôle que la
 * suppression les emporte toutes, et qu'aucune ne survit à la cascade. Un
 * droit à l'effacement qui laisse des lignes derrière lui n'est pas respecté.
 *
 * Usage : node --env-file=.env.local scripts/verifier-rgpd.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error('Variables Supabase manquantes.');
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

/** Toutes les tables où un utilisateur peut avoir des données. */
const TABLES = [
  'profiles',
  'holders',
  'assets',
  'liabilities',
  'transactions',
  'goals',
  'imports',
  'tax_events',
  'simulations',
  'bank_connections',
  'net_worth_snapshots',
  'categorisation_rules',
];

try {
  const { data: cree, error } = await admin.auth.admin.createUser({
    email: `test-rgpd-${suffixe}@nestor.invalid`,
    password: `Mdp-${suffixe}-R!`,
    email_confirm: true,
  });
  if (error) throw new Error(`Création du compte : ${error.message}`);
  idUtilisateur = cree.user.id;

  // ── On remplit plusieurs tables ────────────────────────────
  const { data: actif } = await admin
    .from('assets')
    .insert({
      user_id: idUtilisateur,
      nom: 'Actif RGPD',
      classe: 'compte_courant',
      solde_cents: 500_000,
      est_manuel: true,
    })
    .select('id')
    .single();

  await admin.from('liabilities').insert({
    user_id: idUtilisateur,
    nom: 'Passif RGPD',
    type: 'pret_temperament',
    capital_initial_cents: 100_000,
    capital_restant_cents: 50_000,
    taux_annuel: 5,
    duree_mois: 24,
    date_debut: '2026-01-01',
    mensualite_cents: 4_400,
  });

  await admin.from('transactions').insert({
    user_id: idUtilisateur,
    date: '2026-09-01',
    montant_cents: -1_000,
    libelle: 'Transaction RGPD',
    empreinte: `${idUtilisateur}:test`,
    source: 'manuel',
  });

  await admin.from('goals').insert({
    user_id: idUtilisateur,
    nom: 'Objectif RGPD',
    type: 'libre',
    montant_cible_cents: 1_000_000,
  });

  await admin.from('net_worth_snapshots').insert({
    user_id: idUtilisateur,
    date: '2026-09-01',
    actifs_cents: 500_000,
    passifs_cents: 50_000,
    net_cents: 450_000,
  });

  if (actif) {
    await admin.from('asset_snapshots').insert({
      asset_id: actif.id,
      date: '2026-09-01',
      valeur_cents: 500_000,
    });
  }

  // ── Comptage avant suppression ─────────────────────────────
  const avant = {};
  for (const table of TABLES) {
    const { count } = await admin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(table === 'profiles' ? 'id' : 'user_id', idUtilisateur);
    avant[table] = count ?? 0;
  }

  const totalAvant = Object.values(avant).reduce((s, n) => s + n, 0);
  verifier('des données existent avant suppression', totalAvant >= 6, `${totalAvant} lignes`);
  verifier('le profil est présent', avant.profiles === 1);
  verifier('le détenteur « moi » est présent', avant.holders === 1);

  const { count: snapshotsAvant } = await admin
    .from('asset_snapshots')
    .select('*, assets!inner(user_id)', { count: 'exact', head: true })
    .eq('assets.user_id', idUtilisateur);
  verifier('un instantané d’actif est présent', snapshotsAvant === 1);

  // ── Suppression ────────────────────────────────────────────
  const { error: erreurSuppression } = await admin.auth.admin.deleteUser(idUtilisateur);
  verifier('la suppression du compte réussit', !erreurSuppression, erreurSuppression?.message ?? '');

  // ── Contrôle : plus rien ne doit subsister ─────────────────
  const restants = [];
  for (const table of TABLES) {
    const { count } = await admin
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq(table === 'profiles' ? 'id' : 'user_id', idUtilisateur);
    if ((count ?? 0) > 0) restants.push(`${table} (${count})`);
  }

  verifier(
    'aucune donnée ne survit à la cascade',
    restants.length === 0,
    restants.length > 0 ? restants.join(', ') : 'toutes les tables sont vides',
  );

  const { count: snapshotsApres } = await admin
    .from('asset_snapshots')
    .select('*, assets!inner(user_id)', { count: 'exact', head: true })
    .eq('assets.user_id', idUtilisateur);
  verifier('les instantanés d’actifs sont emportés', (snapshotsApres ?? 0) === 0);

  // Le compte d'authentification lui-même.
  const { data: recherche } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const survivant = recherche?.users.some((u) => u.id === idUtilisateur);
  verifier('le compte d’authentification est supprimé', !survivant);

  idUtilisateur = null;
} catch (erreur) {
  console.error('\nÉchec :', erreur.message);
  echecs++;
} finally {
  if (idUtilisateur) {
    await admin.auth.admin.deleteUser(idUtilisateur).catch(() => {});
    console.log('\nCompte de test nettoyé.');
  }
}

console.log(echecs === 0 ? '\nRGPD vérifié : effacement complet.\n' : `\n${echecs} échec(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
