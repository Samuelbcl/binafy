/**
 * Vérifie de bout en bout que la RLS isole réellement les utilisateurs.
 *
 * Crée deux comptes de test, écrit un actif chez le premier, et contrôle que le
 * second ne le voit pas. Une policy qu'on n'a pas tentée de contourner n'est
 * qu'une intention.
 *
 * Les comptes de test sont supprimés à la fin, quoi qu'il arrive.
 *
 * Usage : node --env-file=.env.local scripts/verifier-rls.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error('Variables Supabase manquantes. Lance avec --env-file=.env.local');
  process.exit(1);
}

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const suffixe = Date.now();
const comptes = [
  { email: `test-rls-a-${suffixe}@nestor.invalid`, motDePasse: `Mdp-${suffixe}-A!` },
  { email: `test-rls-b-${suffixe}@nestor.invalid`, motDePasse: `Mdp-${suffixe}-B!` },
];

const creees = [];
let echecs = 0;

function verifier(intitule, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) echecs++;
  console.log(`  ${ok ? '✓' : '✗'}  ${intitule}${detail ? ` — ${detail}` : ''}`);
}

try {
  // ── Création des comptes ───────────────────────────────────
  for (const compte of comptes) {
    const { data, error } = await admin.auth.admin.createUser({
      email: compte.email,
      password: compte.motDePasse,
      email_confirm: true,
    });
    if (error) throw new Error(`Création de ${compte.email} : ${error.message}`);
    creees.push(data.user.id);
    compte.id = data.user.id;
  }
  console.log(`\n${creees.length} comptes de test créés.\n`);

  // ── Le trigger crée-t-il bien profil et détenteur ? ────────
  const { data: profils } = await admin.from('profiles').select('id').in('id', creees);
  verifier(
    'le trigger crée un profil à l’inscription',
    profils?.length === 2,
    `${profils?.length ?? 0}/2`,
  );

  const { data: detenteurs } = await admin
    .from('holders')
    .select('user_id, est_utilisateur')
    .in('user_id', creees);
  verifier(
    'le trigger crée un détenteur « moi »',
    detenteurs?.length === 2 && detenteurs.every((d) => d.est_utilisateur),
    `${detenteurs?.length ?? 0}/2`,
  );

  // ── Sessions utilisateur ───────────────────────────────────
  const clients = [];
  for (const compte of comptes) {
    const client = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error } = await client.auth.signInWithPassword({
      email: compte.email,
      password: compte.motDePasse,
    });
    if (error) throw new Error(`Connexion de ${compte.email} : ${error.message}`);
    clients.push(client);
  }

  const [clientA, clientB] = clients;

  // ── A écrit chez lui ───────────────────────────────────────
  const { data: actifA, error: erreurEcriture } = await clientA
    .from('assets')
    .insert({
      user_id: comptes[0].id,
      nom: 'Compte de test RLS',
      classe: 'compte_courant',
      solde_cents: 123456,
      est_manuel: true,
    })
    .select('id')
    .single();

  verifier('un utilisateur peut écrire chez lui', !erreurEcriture, erreurEcriture?.message ?? '');

  // ── A se relit ─────────────────────────────────────────────
  const { data: luParA } = await clientA.from('assets').select('id, nom');
  verifier('il relit son propre actif', luParA?.length === 1, `${luParA?.length ?? 0} ligne(s)`);

  // ── B ne doit rien voir ────────────────────────────────────
  const { data: luParB } = await clientB.from('assets').select('id, nom');
  verifier(
    'un autre utilisateur ne voit rien',
    (luParB?.length ?? 0) === 0,
    `${luParB?.length ?? 0} ligne(s) visible(s)`,
  );

  // ── B ne doit pas pouvoir écrire chez A ────────────────────
  const { error: erreurUsurpation } = await clientB.from('assets').insert({
    user_id: comptes[0].id,
    nom: 'Injection',
    classe: 'autre',
    solde_cents: 1,
    est_manuel: true,
  });
  verifier('il ne peut pas écrire chez quelqu’un d’autre', Boolean(erreurUsurpation));

  // ── B ne doit pas pouvoir modifier l'actif de A ────────────
  if (actifA) {
    const { data: modifie } = await clientB
      .from('assets')
      .update({ nom: 'Détourné' })
      .eq('id', actifA.id)
      .select('id');
    verifier(
      'il ne peut pas modifier l’actif d’un autre',
      (modifie?.length ?? 0) === 0,
      `${modifie?.length ?? 0} ligne(s) modifiée(s)`,
    );

    const { data: supprime } = await clientB
      .from('assets')
      .delete()
      .eq('id', actifA.id)
      .select('id');
    verifier(
      'il ne peut pas supprimer l’actif d’un autre',
      (supprime?.length ?? 0) === 0,
      `${supprime?.length ?? 0} ligne(s) supprimée(s)`,
    );
  }

  // ── Les paramètres fiscaux sont lisibles une fois connecté ─
  const { data: params } = await clientA.from('tax_parameters').select('cle').limit(5);
  verifier(
    'les paramètres fiscaux sont lisibles une fois connecté',
    (params?.length ?? 0) > 0,
    `${params?.length ?? 0} ligne(s)`,
  );
} catch (erreur) {
  console.error('\nÉchec :', erreur.message);
  echecs++;
} finally {
  // Les comptes de test ne doivent jamais survivre à l'exécution.
  for (const id of creees) {
    await admin.auth.admin.deleteUser(id).catch(() => {});
  }
  console.log(`\n${creees.length} comptes de test supprimés.`);
}

console.log(echecs === 0 ? '\nRLS vérifiée : isolation effective.\n' : `\n${echecs} échec(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
