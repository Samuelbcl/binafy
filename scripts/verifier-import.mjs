/**
 * Vérifie l'import CSV de bout en bout, contre la base réelle.
 *
 * Crée un compte, importe un extrait au format belge, contrôle les montants,
 * la catégorisation et la déduplication, puis nettoie.
 *
 * Usage : node --env-file=.env.local scripts/verifier-import.mjs
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
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

try {
  const { data: cree, error } = await admin.auth.admin.createUser({
    email: `test-import-${suffixe}@nestor.invalid`,
    password: `Mdp-${suffixe}-I!`,
    email_confirm: true,
  });
  if (error) throw new Error(`Création du compte : ${error.message}`);
  idUtilisateur = cree.user.id;

  // ── Les catégories système sont-elles en place ? ───────────
  const { data: categories } = await admin
    .from('categories')
    .select('id, cle, nom, type')
    .is('user_id', null);

  verifier(
    'les catégories système sont chargées',
    (categories?.length ?? 0) === 24,
    `${categories?.length ?? 0}/24`,
  );

  const idParCle = new Map((categories ?? []).map((c) => [c.cle, c.id]));
  verifier('la catégorie « courses » existe', idParCle.has('courses'));
  verifier('la catégorie « salaire » existe', idParCle.has('salaire'));

  // ── Import simulé : on reproduit ce que fait la Server Action ─
  const { analyserCSV, dedupliquer, empreinteTransaction } = await import(
    '../src/lib/banking/csv.ts'
  );
  const { categoriser } = await import('../src/lib/banking/categorisation.ts');

  // Un extrait au format belge typique : point-virgule, virgule décimale,
  // libellé contenant une virgule, dates en JJ/MM/AAAA.
  const extrait = [
    'Date;Libellé;Montant;Contrepartie',
    '01/09/2026;"ACHAT COLRUYT, LIEGE";-87,32;COLRUYT GROUP',
    '02/09/2026;VIREMENT SALAIRE AOUT;2.480,00;EMPLOYEUR SA',
    '03/09/2026;PROXIMUS DOMICILIATION;-45,00;PROXIMUS NV',
    '04/09/2026;DEGIRO VERSEMENT;-250,00;DEGIRO',
    '05/09/2026;STIB ABONNEMENT;-49,50;STIB MIVB',
    'pas-une-date;LIGNE ILLISIBLE;-10,00;X',
  ].join('\n');

  const analyse = analyserCSV(extrait);
  verifier(
    'cinq transactions lues sur six lignes',
    analyse.transactions.length === 5,
    `${analyse.transactions.length}`,
  );
  verifier('la ligne invalide est rejetée', analyse.rejets.length === 1, analyse.rejets[0]?.raison ?? '');

  const { uniques } = dedupliquer(analyse.transactions, idUtilisateur);

  const lignes = uniques.map((t) => {
    const cle = categoriser(t, []).categorie;
    return {
      user_id: idUtilisateur,
      date: t.date,
      montant_cents: t.montantCents,
      libelle: t.libelle,
      contrepartie: t.contrepartie,
      empreinte: empreinteTransaction(t, idUtilisateur),
      category_id: cle ? (idParCle.get(cle) ?? null) : null,
      source: 'csv',
      exclue_du_budget: cle === 'transfert',
    };
  });

  const { error: erreurInsert } = await admin
    .from('transactions')
    .upsert(lignes, { onConflict: 'user_id,empreinte', ignoreDuplicates: true });
  verifier('les transactions sont enregistrées', !erreurInsert, erreurInsert?.message ?? '');

  // ── Contrôle des montants et des catégories ────────────────
  const { data: enBase } = await admin
    .from('transactions')
    .select('libelle, montant_cents, categories(cle)')
    .eq('user_id', idUtilisateur)
    .order('date');

  verifier('cinq transactions en base', enBase?.length === 5, `${enBase?.length ?? 0}`);

  const parLibelle = new Map((enBase ?? []).map((t) => [t.libelle, t]));

  const colruyt = parLibelle.get('ACHAT COLRUYT, LIEGE');
  verifier(
    'le libellé avec virgule n’a pas décalé les colonnes',
    Number(colruyt?.montant_cents) === -8732,
    `${colruyt?.montant_cents}`,
  );
  verifier('Colruyt est classé en courses', colruyt?.categories?.cle === 'courses', String(colruyt?.categories?.cle));

  const salaire = parLibelle.get('VIREMENT SALAIRE AOUT');
  verifier(
    'le montant à milliers pointés est juste',
    Number(salaire?.montant_cents) === 248000,
    `${salaire?.montant_cents}`,
  );
  verifier('le salaire est classé en revenu', salaire?.categories?.cle === 'salaire', String(salaire?.categories?.cle));

  verifier(
    'Proximus est classé en télécoms',
    parLibelle.get('PROXIMUS DOMICILIATION')?.categories?.cle === 'telecom',
  );
  verifier(
    'Degiro est classé en investissement, pas en dépense',
    parLibelle.get('DEGIRO VERSEMENT')?.categories?.cle === 'investissement',
  );
  verifier(
    'la STIB est classée en transport',
    parLibelle.get('STIB ABONNEMENT')?.categories?.cle === 'transport',
  );

  // ── Déduplication en base : réimporter ne double pas ───────
  const { error: erreurRe } = await admin
    .from('transactions')
    .upsert(lignes, { onConflict: 'user_id,empreinte', ignoreDuplicates: true });
  verifier('un réimport ne provoque pas d’erreur', !erreurRe, erreurRe?.message ?? '');

  const { count } = await admin
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', idUtilisateur);

  verifier('réimporter le même fichier ne double pas le budget', count === 5, `${count} lignes`);
} catch (erreur) {
  console.error('\nÉchec :', erreur.message);
  echecs++;
} finally {
  if (idUtilisateur) {
    await admin.auth.admin.deleteUser(idUtilisateur).catch(() => {});
    console.log('\nCompte de test supprimé.');
  }
}

console.log(echecs === 0 ? '\nImport CSV vérifié.\n' : `\n${echecs} échec(s).\n`);
process.exit(echecs === 0 ? 0 : 1);
