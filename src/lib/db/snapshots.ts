import 'server-only';

import { capitalRestantDu } from '../finance/credit';
import { supportTOBParDefaut, type ClasseActif } from '../patrimoine/types';
import { TAX_PARAMS_2026 } from '../tax/parametres';
import { calculerImpotLatent } from '../tax/plus-values';
import { supabaseAdmin } from './serveur';

/**
 * Instantanés quotidiens du patrimoine (doc 03 § cotations).
 *
 * L'historique se reconstruit à partir de ces snapshots, il n'est jamais
 * recalculé à la volée. C'est ce qui permet à la courbe de rester juste même
 * après qu'un actif a été modifié ou archivé : on garde ce qui était vrai ce
 * jour-là, pas ce qu'on en déduirait aujourd'hui.
 *
 * Tourne avec la clé de service, donc hors RLS : c'est un job, pas une requête
 * utilisateur. Il ne doit jamais être appelé depuis une route publique sans
 * vérification du secret de cron.
 */

export type ResultatSnapshots = {
  date: string;
  utilisateursTraites: number;
  actifsSnapshotes: number;
  erreurs: string[];
};

/** Date du jour en Europe/Brussels, au format ISO court. */
export function dateDuJourBruxelles(maintenant = new Date()): string {
  // On formate dans le fuseau belge : un job qui tourne à 02:00 UTC ne doit pas
  // écrire le snapshot de la veille.
  const formateur = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formateur.format(maintenant);
}

function valeurActif(ligne: {
  solde_cents: number | null;
  quantite: number | null;
  valeur_unitaire_cents: number | null;
}): number {
  if (ligne.solde_cents != null) return Number(ligne.solde_cents);
  if (ligne.quantite != null && ligne.valeur_unitaire_cents != null) {
    return Math.round(Number(ligne.quantite) * Number(ligne.valeur_unitaire_cents));
  }
  return 0;
}

function moisEcoulesDepuis(dateDebut: string, maintenant = new Date()): number {
  const debut = new Date(`${dateDebut}T00:00:00Z`);
  return Math.max(
    0,
    (maintenant.getUTCFullYear() - debut.getUTCFullYear()) * 12 +
      (maintenant.getUTCMonth() - debut.getUTCMonth()),
  );
}

/**
 * Écrit un instantané par actif et un instantané de patrimoine net par
 * utilisateur. Idempotent : relancer le même jour met à jour, ne duplique pas.
 */
export async function ecrireSnapshotsQuotidiens(
  maintenant = new Date(),
): Promise<ResultatSnapshots> {
  const supabase = supabaseAdmin();
  const date = dateDuJourBruxelles(maintenant);
  const erreurs: string[] = [];

  const { data: profils, error: erreurProfils } = await supabase.from('profiles').select('id');
  if (erreurProfils) throw new Error(`Lecture des profils : ${erreurProfils.message}`);

  let actifsSnapshotes = 0;
  let utilisateursTraites = 0;

  for (const profil of profils ?? []) {
    try {
      const [resActifs, resPassifs, resHolders] = await Promise.all([
        supabase
          .from('assets')
          // Une seule chaîne littérale : le client infère les colonnes depuis
          // le texte du select, une concaténation lui fait perdre le type.
          .select(
            'id, nom, classe, solde_cents, quantite, valeur_unitaire_cents, prix_acquisition_cents, valeur_reference_2025_cents, date_acquisition, capitalisant, inscrit_en_belgique',
          )
          .eq('user_id', profil.id)
          .eq('archive', false),
        supabase
          .from('liabilities')
          .select('capital_initial_cents, taux_annuel, duree_mois, date_debut')
          .eq('user_id', profil.id),
        supabase
          .from('asset_holders')
          .select('asset_id, quote_part, holders!inner(user_id, est_utilisateur)')
          .eq('holders.user_id', profil.id)
          .eq('holders.est_utilisateur', true),
      ]);

      if (resActifs.error) throw new Error(resActifs.error.message);

      const actifs = resActifs.data ?? [];
      if (actifs.length === 0 && (resPassifs.data ?? []).length === 0) continue;

      const quotesParts = new Map<string, number>();
      for (const h of resHolders.data ?? []) {
        quotesParts.set(h.asset_id, Number(h.quote_part));
      }

      // ── Instantané par actif : valeur intégrale du bien ─────
      const lignesActifs = actifs.map((a) => ({
        asset_id: a.id,
        date,
        valeur_cents: valeurActif(a),
      }));

      if (lignesActifs.length > 0) {
        const { error } = await supabase
          .from('asset_snapshots')
          .upsert(lignesActifs, { onConflict: 'asset_id,date' });
        if (error) throw new Error(`asset_snapshots : ${error.message}`);
        actifsSnapshotes += lignesActifs.length;
      }

      // ── Totaux ménage et quote-part ────────────────────────
      let actifsMenage = 0;
      let actifsQuotePart = 0;

      for (const a of actifs) {
        const valeur = valeurActif(a);
        actifsMenage += valeur;
        actifsQuotePart += Math.round(valeur * ((quotesParts.get(a.id) ?? 100) / 100));
      }

      const passifsMenage = (resPassifs.data ?? []).reduce(
        (somme, p) =>
          somme +
          capitalRestantDu(
            Number(p.capital_initial_cents),
            Number(p.taux_annuel),
            p.duree_mois,
            moisEcoulesDepuis(p.date_debut, maintenant),
          ),
        0,
      );

      // ── Impôt latent du jour ───────────────────────────────
      const impotLatent = calculerImpotLatent(
        {
          positions: actifs.map((a) => {
            const classe = a.classe as ClasseActif;
            const valeur = valeurActif(a);
            return {
              id: a.id,
              nom: a.nom,
              valeurActuelleCents: Math.round(
                valeur * ((quotesParts.get(a.id) ?? 100) / 100),
              ),
              prixAcquisitionCents:
                a.prix_acquisition_cents != null ? Number(a.prix_acquisition_cents) : null,
              valeurReference2025Cents:
                a.valeur_reference_2025_cents != null
                  ? Number(a.valeur_reference_2025_cents)
                  : null,
              dateAcquisition: a.date_acquisition,
              supportTOB: supportTOBParDefaut({
                classe,
                inscritEnBelgique: a.inscrit_en_belgique,
                capitalisant: a.capitalisant,
              }),
            };
          }),
        },
        TAX_PARAMS_2026,
      );

      const { error: erreurNet } = await supabase.from('net_worth_snapshots').upsert(
        {
          user_id: profil.id,
          date,
          actifs_cents: actifsMenage,
          passifs_cents: passifsMenage,
          net_cents: actifsMenage - passifsMenage,
          actifs_quote_part_cents: actifsQuotePart,
          passifs_quote_part_cents: passifsMenage,
          net_quote_part_cents: actifsQuotePart - passifsMenage,
          impot_latent_cents: impotLatent.result.impotLatentCents,
        },
        { onConflict: 'user_id,date' },
      );

      if (erreurNet) throw new Error(`net_worth_snapshots : ${erreurNet.message}`);

      utilisateursTraites++;
    } catch (erreur) {
      // Un utilisateur en échec ne doit pas empêcher les autres d'être traités.
      // Aucun montant dans le message : un montant dans un journal est une fuite.
      erreurs.push(
        `utilisateur ${profil.id.slice(0, 8)}… : ${
          erreur instanceof Error ? erreur.message : 'erreur inconnue'
        }`,
      );
    }
  }

  return { date, utilisateursTraites, actifsSnapshotes, erreurs };
}
