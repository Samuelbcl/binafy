import 'server-only';

import { PROFIL_DEMO } from '../demo/donnees';
import { supabaseServeur, utilisateurCourant } from './serveur';

/**
 * Le prénom, pour s'adresser à la personne.
 *
 * Il vient de `profiles.prenom`, rempli à l'inscription depuis les métadonnées
 * du compte. Sans session, celui de la démo ; sans prénom renseigné, `null` —
 * et l'écran dit « Bonjour » tout seul plutôt qu'un « Bonjour, » suspendu.
 */
export async function chargerPrenom(): Promise<string | null> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return PROFIL_DEMO.prenom;

  const supabase = await supabaseServeur();
  const { data } = await supabase
    .from('profiles')
    .select('prenom')
    .eq('id', utilisateur.id)
    .maybeSingle();

  const prenom = data?.prenom?.trim();
  return prenom ? prenom : null;
}
