import 'server-only';

import { detecterAbonnements, type AbonnementDetecte } from '../banking/categorisation';
import type { MoisBudget } from '../finance/epargne';
import { modeDemo } from '../env';
import { supabaseServeur, utilisateurCourant } from './serveur';

/**
 * Lecture du budget (doc 02 § module 3).
 *
 * Même principe que le patrimoine : une porte d'entrée unique qui rend les
 * données réelles quand une session existe, et le jeu de démo sinon.
 */

export type LigneCategorie = {
  cle: string;
  nom: string;
  couleur: string;
  type: 'revenu' | 'depense' | 'investissement' | 'transfert';
  montantCents: number;
};

export type FluxSankey = {
  source: string;
  cible: string;
  valeurCents: number;
  couleur: string;
};

export type Budget = {
  mois: MoisBudget[];
  /** Catégories du dernier mois complet. */
  categories: LigneCategorie[];
  abonnements: AbonnementDetecte[];
  /** Nombre de transactions en base — zéro déclenche l'état vide. */
  nombreTransactions: number;
  imports: {
    id: string;
    nomFichier: string;
    lignesImportees: number;
    lignesIgnorees: number;
    creeLe: string;
  }[];
  demo: boolean;
};

/** Agrège les transactions en mois, catégories et abonnements. */
export async function chargerBudgetReel(): Promise<Budget | null> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return null;

  const supabase = await supabaseServeur();

  // 24 mois : de quoi calculer un taux lissé sur 12 mois et le comparer à
  // l'année précédente.
  const depuis = new Date();
  depuis.setUTCFullYear(depuis.getUTCFullYear() - 2);
  const dateDepuis = depuis.toISOString().slice(0, 10);

  const [resTransactions, resImports] = await Promise.all([
    supabase
      .from('transactions')
      .select('date, montant_cents, libelle, exclue_du_budget, categories(cle, nom, couleur, type)')
      .gte('date', dateDepuis)
      .order('date', { ascending: true }),
    supabase
      .from('imports')
      .select('id, nom_fichier, lignes_importees, lignes_ignorees, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (resTransactions.error) {
    throw new Error(`Lecture des transactions : ${resTransactions.error.message}`);
  }

  const transactions = resTransactions.data ?? [];

  type CategorieJointe = {
    cle: string | null;
    nom: string;
    couleur: string | null;
    type: 'revenu' | 'depense' | 'investissement' | 'transfert';
  } | null;

  // ── Agrégation par mois ────────────────────────────────────
  const parMois = new Map<string, MoisBudget>();

  for (const t of transactions) {
    // Un transfert entre ses propres comptes n'est ni un revenu ni une dépense :
    // le compter fausserait le taux d'épargne dans les deux sens.
    if (t.exclue_du_budget) continue;

    const mois = t.date.slice(0, 7);
    const entree = parMois.get(mois) ?? {
      mois,
      revenusCents: 0,
      depensesCents: 0,
      investiCents: 0,
    };

    const montant = Number(t.montant_cents);
    const categorie = t.categories as CategorieJointe;

    if (categorie?.type === 'investissement') {
      // L'investissement n'est pas une dépense : c'est de l'épargne dirigée.
      entree.investiCents += Math.abs(montant);
    } else if (montant >= 0) {
      entree.revenusCents += montant;
    } else {
      entree.depensesCents += -montant;
    }

    parMois.set(mois, entree);
  }

  const mois = [...parMois.values()].sort((a, b) => a.mois.localeCompare(b.mois));

  // ── Catégories du dernier mois ─────────────────────────────
  const dernierMois = mois[mois.length - 1]?.mois;
  const parCategorie = new Map<string, LigneCategorie>();

  if (dernierMois) {
    for (const t of transactions) {
      if (t.exclue_du_budget) continue;
      if (t.date.slice(0, 7) !== dernierMois) continue;

      const categorie = t.categories as CategorieJointe;
      if (!categorie || categorie.type !== 'depense') continue;

      const cle = categorie.cle ?? categorie.nom;
      const ligne = parCategorie.get(cle) ?? {
        cle,
        nom: categorie.nom,
        couleur: categorie.couleur ?? 'var(--data-8)',
        type: categorie.type,
        montantCents: 0,
      };
      ligne.montantCents += Math.abs(Number(t.montant_cents));
      parCategorie.set(cle, ligne);
    }
  }

  const categories = [...parCategorie.values()].sort(
    (a, b) => b.montantCents - a.montantCents,
  );

  // ── Abonnements ────────────────────────────────────────────
  const abonnements = detecterAbonnements(
    transactions.map((t) => ({
      libelle: t.libelle,
      montantCents: Number(t.montant_cents),
      date: t.date,
    })),
  );

  return {
    mois,
    categories,
    abonnements,
    nombreTransactions: transactions.length,
    imports: (resImports.data ?? []).map((i) => ({
      id: i.id,
      nomFichier: i.nom_fichier,
      lignesImportees: i.lignes_importees,
      lignesIgnorees: i.lignes_ignorees,
      creeLe: i.created_at,
    })),
    demo: false,
  };
}

/** Porte d'entrée unique des écrans. */
export async function chargerBudget(): Promise<Budget> {
  if (!modeDemo) {
    const reel = await chargerBudgetReel();
    // Un compte sans transaction doit voir l'état vide, pas des chiffres fictifs
    // qu'il prendrait pour les siens.
    if (reel) return reel;
  }

  const { budgetDemo, CATEGORIES_DEMO, ABONNEMENTS_DEMO } = await import('../demo/donnees');

  return {
    mois: budgetDemo(),
    categories: CATEGORIES_DEMO.map((c) => ({
      cle: c.nom.toLowerCase(),
      nom: c.nom,
      couleur: c.couleur,
      type: 'depense' as const,
      montantCents: c.montantCents,
    })),
    abonnements: ABONNEMENTS_DEMO.map((a) => ({
      libelle: a.nom,
      montantMensuelCents: a.montantMensuelCents,
      occurrences: 12,
      coutAnnuelCents: a.montantMensuelCents * 12,
    })),
    nombreTransactions: 1,
    imports: [],
    demo: true,
  };
}

/**
 * Construit les flux du diagramme de Sankey : revenus → grandes masses →
 * catégories de dépenses.
 */
export function construireFluxSankey(budget: Budget): FluxSankey[] {
  const dernier = budget.mois[budget.mois.length - 1];
  if (!dernier) return [];

  const flux: FluxSankey[] = [];
  const revenus = dernier.revenusCents;
  if (revenus <= 0) return [];

  const depenses = dernier.depensesCents;
  const investi = dernier.investiCents;
  const epargne = Math.max(0, revenus - depenses - investi);

  if (depenses > 0) {
    flux.push({
      source: 'Revenus',
      cible: 'Dépenses',
      valeurCents: depenses,
      couleur: 'var(--data-5)',
    });
  }
  if (investi > 0) {
    flux.push({
      source: 'Revenus',
      cible: 'Investi',
      valeurCents: investi,
      couleur: 'var(--data-1)',
    });
  }
  if (epargne > 0) {
    flux.push({
      source: 'Revenus',
      cible: 'Épargné',
      valeurCents: epargne,
      couleur: 'var(--data-3)',
    });
  }

  // Second niveau : le détail des dépenses. On limite aux principales pour que
  // le diagramme reste lisible ; le reste est regroupé.
  const principales = budget.categories.slice(0, 7);
  const reste = budget.categories.slice(7).reduce((s, c) => s + c.montantCents, 0);

  for (const categorie of principales) {
    if (categorie.montantCents <= 0) continue;
    flux.push({
      source: 'Dépenses',
      cible: categorie.nom,
      valeurCents: categorie.montantCents,
      couleur: categorie.couleur,
    });
  }

  if (reste > 0) {
    flux.push({
      source: 'Dépenses',
      cible: 'Autres',
      valeurCents: reste,
      couleur: 'var(--data-8)',
    });
  }

  return flux;
}
