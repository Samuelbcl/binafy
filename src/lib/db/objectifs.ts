import 'server-only';

import { euros } from '../money';
import { echeanceDans } from '../finance/objectifs';
import {
  schemaParametresObjectif,
  type Objectif,
  type TypeObjectif,
} from '../objectifs/types';
import { valeurQuotePart, type Actif } from '../patrimoine/types';
import { supabaseServeur, utilisateurCourant } from './serveur';

/**
 * Chargement des objectifs.
 *
 * Même porte d'entrée que le patrimoine : `chargerObjectifs()` rend un exemple
 * tant qu'aucune session n'existe, et les objectifs réels ensuite. On lui passe
 * les actifs déjà chargés plutôt que de les relire — la valeur d'un objectif
 * est celle de ses actifs rattachés, et ces actifs sont déjà en mémoire.
 */

/**
 * L'exemple de la démo : un matelas de sécurité en cours, rattaché au compte
 * d'épargne. Un objectif atteint ne montrerait rien du parcours.
 */
function objectifsDemo(actifs: readonly Actif[]): Objectif[] {
  const epargne = actifs.find((a) => a.classe === 'compte_epargne');
  const aujourdhui = new Date();
  return [
    {
      id: 'demo-matelas',
      nom: 'Mon matelas de sécurité',
      type: 'precaution',
      icone: 'bouclier',
      teinte: 'menthe',
      cibleCents: euros(8_400),
      echeance: echeanceDans(12, aujourdhui),
      contributionCents: euros(150),
      frequence: 'mois',
      actifsLies: epargne ? [epargne.id] : [],
      atteintCents: epargne ? valeurQuotePart(epargne) : 0,
      creeLe: aujourdhui.toISOString(),
    },
  ];
}

export async function chargerObjectifs(
  actifs: readonly Actif[],
): Promise<{ objectifs: Objectif[]; demo: boolean }> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { objectifs: objectifsDemo(actifs), demo: true };

  const supabase = await supabaseServeur();
  const { data, error } = await supabase
    .from('goals')
    .select('id, nom, type, montant_cible_cents, echeance, parametres, created_at, goal_assets(asset_id)')
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Chargement des objectifs : ${error.message}`);

  const valeurParActif = new Map(actifs.map((a) => [a.id, valeurQuotePart(a)]));

  const objectifs = (data ?? []).map((ligne): Objectif => {
    const parametres = schemaParametresObjectif.parse(ligne.parametres ?? {});
    const lies = (ligne.goal_assets ?? []).map((g) => g.asset_id);

    return {
      id: ligne.id,
      nom: ligne.nom,
      type: ligne.type as TypeObjectif,
      icone: parametres.icone,
      teinte: parametres.teinte,
      cibleCents: ligne.montant_cible_cents != null ? Number(ligne.montant_cible_cents) : 0,
      echeance: ligne.echeance,
      contributionCents: parametres.contribution_cents,
      frequence: parametres.frequence,
      actifsLies: lies,
      // Un actif archivé ou supprimé ne compte plus : il n'est plus dans la liste.
      atteintCents: lies.reduce((somme, id) => somme + (valeurParActif.get(id) ?? 0), 0),
      creeLe: ligne.created_at,
    };
  });

  return { objectifs, demo: false };
}
