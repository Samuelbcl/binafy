import 'server-only';

import { supabaseAdmin, supabaseServeur, utilisateurCourant } from './serveur';

/**
 * Portabilité et effacement (RGPD, doc 03 § sécurité).
 *
 * Implémentés dès le départ et non rajoutés après : un export bâclé sur une
 * base déjà remplie oublie toujours une table, et le droit à l'effacement ne
 * se rattrape pas.
 *
 * L'export couvre toutes les tables où l'utilisateur a des données. Ajouter
 * une table au schéma sans l'ajouter ici serait un manquement : la liste est
 * volontairement explicite plutôt que déduite, pour qu'un oubli se voie.
 */

/** Les tables exportées, dans l'ordre de lecture. */
const TABLES_EXPORT = [
  'profiles',
  'holders',
  'assets',
  'asset_holders',
  'asset_transactions',
  'liabilities',
  'asset_snapshots',
  'net_worth_snapshots',
  'categories',
  'transactions',
  'categorisation_rules',
  'goals',
  'goal_assets',
  'imports',
  'tax_events',
  'simulations',
  'bank_connections',
] as const;

export type ExportRGPD = {
  meta: {
    genereLe: string;
    format: string;
    utilisateur: { id: string; email: string | null };
    avertissement: string;
  };
  donnees: Record<string, unknown[]>;
};

/**
 * Export complet des données de l'utilisateur connecté, en JSON.
 *
 * Les lectures passent par le client authentifié : la RLS garantit qu'on
 * n'exporte jamais que ses propres données, même en cas d'erreur de filtre.
 */
export async function exporterDonnees(): Promise<ExportRGPD | null> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return null;

  const supabase = await supabaseServeur();
  const donnees: Record<string, unknown[]> = {};

  for (const table of TABLES_EXPORT) {
    const { data, error } = await supabase.from(table).select('*');

    if (error) {
      // Une table illisible ne doit pas vider tout l'export : on le signale
      // dans le fichier lui-même plutôt que de livrer un JSON silencieusement
      // incomplet.
      donnees[table] = [{ _erreur: error.message }];
      continue;
    }

    donnees[table] = data ?? [];
  }

  // Les jetons bancaires chiffrés n'ont aucune valeur pour l'utilisateur et
  // tout intérêt pour un attaquant : ils ne sortent jamais, même vers leur
  // propriétaire.
  donnees.bank_connections = (donnees.bank_connections ?? []).map((ligne) => {
    const { access_token_chiffre, ...reste } = ligne as Record<string, unknown>;
    void access_token_chiffre;
    return reste;
  });

  return {
    meta: {
      genereLe: new Date().toISOString(),
      format: 'nestor-export-v1',
      utilisateur: { id: utilisateur.id, email: utilisateur.email ?? null },
      avertissement:
        'Ce fichier contient des données financières personnelles. Conserve-le en lieu sûr et ' +
        'ne le partage pas. Les montants sont exprimés en centimes.',
    },
    donnees,
  };
}

export type ResultatSuppression = { ok: true } | { ok: false; message: string };

/**
 * Suppression définitive du compte et de toutes ses données.
 *
 * Le compte `auth.users` est supprimé en dernier : toutes les tables métier
 * référencent `profiles(id)` en `on delete cascade`, lui-même en cascade sur
 * `auth.users`. Une seule suppression suffit donc, mais on vérifie ensuite
 * qu'il ne reste rien plutôt que de le supposer.
 */
export async function supprimerCompte(
  confirmation: string,
): Promise<ResultatSuppression> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { ok: false, message: 'Session expirée. Reconnecte-toi.' };

  // Garde-fou : une suppression irréversible ne doit pas tenir à un seul clic.
  if (confirmation.trim().toUpperCase() !== 'SUPPRIMER') {
    return { ok: false, message: 'Tape SUPPRIMER pour confirmer.' };
  }

  const admin = supabaseAdmin();

  const { error } = await admin.auth.admin.deleteUser(utilisateur.id);
  if (error) {
    return { ok: false, message: `Suppression impossible : ${error.message}` };
  }

  // Contrôle : la cascade a-t-elle bien tout emporté ?
  const { count } = await admin
    .from('assets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', utilisateur.id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      message:
        'Le compte a été supprimé mais des données subsistent. Contacte-nous pour un effacement manuel.',
    };
  }

  return { ok: true };
}

/** Compte ce que l'utilisateur a en base, pour le lui montrer avant suppression. */
export async function resumerDonnees(): Promise<Record<string, number> | null> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return null;

  const supabase = await supabaseServeur();
  const resume: Record<string, number> = {};

  const tables = ['assets', 'liabilities', 'transactions', 'goals', 'net_worth_snapshots'] as const;

  await Promise.all(
    tables.map(async (table) => {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      resume[table] = count ?? 0;
    }),
  );

  return resume;
}
