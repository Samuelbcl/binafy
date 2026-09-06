'use server';

import { supprimerCompte, type ResultatSuppression } from '@/lib/db/rgpd';

/**
 * Suppression du compte.
 *
 * L'action ne redirige pas elle-même : le client doit d'abord fermer sa
 * session locale, sinon il garderait un cookie pointant vers un compte qui
 * n'existe plus.
 */
export async function demanderSuppression(
  _precedent: unknown,
  donnees: FormData,
): Promise<ResultatSuppression> {
  const confirmation = String(donnees.get('confirmation') ?? '');
  return supprimerCompte(confirmation);
}
