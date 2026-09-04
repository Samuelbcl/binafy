import 'server-only';

import { capitalRestantDu } from '../finance/credit';
import {
  supportTOBParDefaut,
  type Actif,
  type ClasseActif,
  type Passif,
  type Patrimoine,
  type PointHistorique,
  type TypePassif,
} from '../patrimoine/types';
import { modeDemo } from '../env';
import { supabaseServeur, utilisateurCourant } from './serveur';
import type { Database } from './types';

/**
 * Chargement du patrimoine depuis Supabase.
 *
 * Une seule porte d'entrée pour les écrans : `chargerPatrimoine()`. Elle rend
 * les données de démo tant qu'aucune session n'existe, et les données réelles
 * ensuite. Les pages ne savent pas d'où viennent les chiffres, et c'est voulu.
 */

type LigneActif = Database['public']['Tables']['assets']['Row'];
type LignePassif = Database['public']['Tables']['liabilities']['Row'];

/**
 * Valeur d'un actif : un compte porte un solde, une position porte une quantité
 * et une valeur unitaire.
 */
function valeurDe(ligne: LigneActif): number {
  if (ligne.solde_cents != null) return Number(ligne.solde_cents);
  if (ligne.quantite != null && ligne.valeur_unitaire_cents != null) {
    return Math.round(Number(ligne.quantite) * Number(ligne.valeur_unitaire_cents));
  }
  return 0;
}

function versActif(
  ligne: LigneActif,
  institution: string | null,
  quotePart: number,
): Actif {
  const classe = ligne.classe as ClasseActif;

  return {
    id: ligne.id,
    nom: ligne.nom,
    institution,
    classe,
    valeurCents: valeurDe(ligne),
    // La variation du jour vient de la comparaison de deux snapshots ; tant que
    // le job quotidien n'a pas tourné, elle est nulle plutôt qu'inventée.
    variationJourCents: 0,
    quantite: ligne.quantite != null ? Number(ligne.quantite) : null,
    isin: ligne.isin,
    prixAcquisitionCents:
      ligne.prix_acquisition_cents != null ? Number(ligne.prix_acquisition_cents) : null,
    valeurReference2025Cents:
      ligne.valeur_reference_2025_cents != null
        ? Number(ligne.valeur_reference_2025_cents)
        : null,
    dateAcquisition: ligne.date_acquisition,
    supportTOB: supportTOBParDefaut({
      classe,
      inscritEnBelgique: ligne.inscrit_en_belgique,
      capitalisant: ligne.capitalisant,
    }),
    quotePart,
    capitalisant: ligne.capitalisant,
    inscritEnBelgique: ligne.inscrit_en_belgique,
    compteEpargneReglemente: ligne.compte_epargne_reglemente,
    tauxBase: ligne.taux_base != null ? Number(ligne.taux_base) : null,
    primeFidelite: ligne.prime_fidelite != null ? Number(ligne.prime_fidelite) : null,
    revenuCadastralCents:
      ligne.revenu_cadastral_cents != null ? Number(ligne.revenu_cadastral_cents) : null,
    usageBien: ligne.usage_bien as Actif['usageBien'],
  };
}

function moisEcoulesDepuis(dateDebut: string, aujourdhui = new Date()): number {
  const debut = new Date(`${dateDebut}T00:00:00Z`);
  return Math.max(
    0,
    (aujourdhui.getUTCFullYear() - debut.getUTCFullYear()) * 12 +
      (aujourdhui.getUTCMonth() - debut.getUTCMonth()),
  );
}

function versPassif(ligne: LignePassif): Passif {
  const capitalInitial = Number(ligne.capital_initial_cents);
  const taux = Number(ligne.taux_annuel);

  // Le capital restant dû se recalcule depuis le tableau d'amortissement plutôt
  // que de se fier à une colonne qu'il faudrait penser à mettre à jour.
  const recalcule = capitalRestantDu(
    capitalInitial,
    taux,
    ligne.duree_mois,
    moisEcoulesDepuis(ligne.date_debut),
  );

  return {
    id: ligne.id,
    nom: ligne.nom,
    type: ligne.type as TypePassif,
    capitalRestantCents: recalcule,
    capitalInitialCents: capitalInitial,
    tauxAnnuel: taux,
    dureeMois: ligne.duree_mois,
    dateDebut: ligne.date_debut,
    mensualiteCents: Number(ligne.mensualite_cents),
  };
}

/**
 * Patrimoine de l'utilisateur connecté.
 * Renvoie `null` s'il n'y a pas de session : l'appelant décide alors du repli.
 */
export async function chargerPatrimoineReel(): Promise<Patrimoine | null> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return null;

  const supabase = await supabaseServeur();

  // Trois requêtes en parallèle plutôt qu'en chaîne : elles sont indépendantes.
  const [resActifs, resPassifs, resHistorique] = await Promise.all([
    supabase
      .from('assets')
      .select('*, institutions(nom), asset_holders(quote_part, holders(est_utilisateur))')
      .eq('archive', false)
      .order('nom'),
    supabase.from('liabilities').select('*').order('nom'),
    supabase
      .from('net_worth_snapshots')
      .select('date, actifs_cents, passifs_cents, net_cents')
      .order('date', { ascending: true })
      .limit(400),
  ]);

  if (resActifs.error) throw new Error(`Lecture des actifs : ${resActifs.error.message}`);
  if (resPassifs.error) throw new Error(`Lecture des passifs : ${resPassifs.error.message}`);

  type LigneJointe = LigneActif & {
    institutions: { nom: string } | null;
    asset_holders: { quote_part: number; holders: { est_utilisateur: boolean } | null }[] | null;
  };

  const actifs = ((resActifs.data ?? []) as LigneJointe[]).map((ligne) => {
    // Quote-part de l'utilisateur lui-même. Sans détenteur déclaré, on considère
    // qu'il détient tout — c'est le cas de la très grande majorité des lignes.
    const part = ligne.asset_holders?.find((h) => h.holders?.est_utilisateur)?.quote_part;
    return versActif(ligne, ligne.institutions?.nom ?? null, part != null ? Number(part) : 100);
  });

  const passifs = (resPassifs.data ?? []).map(versPassif);

  const historique: PointHistorique[] = (resHistorique.data ?? []).map((s) => ({
    date: s.date,
    actifsCents: Number(s.actifs_cents),
    passifsCents: Number(s.passifs_cents),
    netCents: Number(s.net_cents),
  }));

  return { actifs, passifs, historique, demo: false };
}

/**
 * Porte d'entrée unique des écrans.
 *
 * En mode démo ou sans session, renvoie le jeu fictif ; sinon les données
 * réelles. Le module de démo est importé à la demande pour qu'il ne parte pas
 * dans le bundle d'une instance configurée.
 */
export async function chargerPatrimoine(): Promise<Patrimoine> {
  if (!modeDemo) {
    const reel = await chargerPatrimoineReel();
    if (reel) return reel;
  }

  const { patrimoineDemo } = await import('../demo/donnees');
  return patrimoineDemo();
}
