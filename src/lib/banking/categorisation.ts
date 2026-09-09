/**
 * Catégorisation automatique des transactions belges (doc 02 § module 3).
 *
 * Une table de règles sur les libellés belges courants couvre l'essentiel des
 * cas. On commence par là plutôt que par un modèle : c'est déterministe,
 * explicable, corrigeable par l'utilisateur, et ça ne coûte rien à faire tourner.
 *
 * Ordre d'application : les règles de l'utilisateur d'abord, les règles globales
 * ensuite. Une correction manuelle doit toujours l'emporter.
 */

export type TypeCategorie = 'revenu' | 'depense' | 'investissement' | 'transfert';

export type CategorieSysteme = {
  cle: string;
  nom: string;
  type: TypeCategorie;
  couleur: string;
};

/** Les catégories proposées par défaut, en français belge. */
export const CATEGORIES_SYSTEME: readonly CategorieSysteme[] = [
  { cle: 'salaire', nom: 'Salaire', type: 'revenu', couleur: 'var(--data-3)' },
  { cle: 'revenus_independant', nom: 'Revenus d’indépendant', type: 'revenu', couleur: 'var(--data-6)' },
  { cle: 'allocations', nom: 'Allocations', type: 'revenu', couleur: 'var(--data-2)' },
  { cle: 'autres_revenus', nom: 'Autres revenus', type: 'revenu', couleur: 'var(--data-8)' },

  { cle: 'logement', nom: 'Logement', type: 'depense', couleur: 'var(--data-1)' },
  { cle: 'energie', nom: 'Énergie et eau', type: 'depense', couleur: 'var(--data-7)' },
  { cle: 'courses', nom: 'Courses', type: 'depense', couleur: 'var(--data-2)' },
  { cle: 'transport', nom: 'Transport', type: 'depense', couleur: 'var(--data-3)' },
  { cle: 'telecom', nom: 'Télécoms et internet', type: 'depense', couleur: 'var(--data-4)' },
  { cle: 'assurances', nom: 'Assurances', type: 'depense', couleur: 'var(--data-5)' },
  { cle: 'sante', nom: 'Santé', type: 'depense', couleur: 'var(--data-6)' },
  { cle: 'restaurants', nom: 'Restaurants et cafés', type: 'depense', couleur: 'var(--data-7)' },
  { cle: 'loisirs', nom: 'Loisirs et sorties', type: 'depense', couleur: 'var(--data-4)' },
  { cle: 'abonnements', nom: 'Abonnements', type: 'depense', couleur: 'var(--data-5)' },
  { cle: 'shopping', nom: 'Shopping', type: 'depense', couleur: 'var(--data-8)' },
  { cle: 'impots', nom: 'Impôts et taxes', type: 'depense', couleur: 'var(--data-5)' },
  { cle: 'frais_bancaires', nom: 'Frais bancaires', type: 'depense', couleur: 'var(--data-8)' },
  { cle: 'education', nom: 'Éducation', type: 'depense', couleur: 'var(--data-2)' },
  { cle: 'dons', nom: 'Dons', type: 'depense', couleur: 'var(--data-3)' },
  { cle: 'autres_depenses', nom: 'Autres dépenses', type: 'depense', couleur: 'var(--data-8)' },

  { cle: 'investissement', nom: 'Investissement', type: 'investissement', couleur: 'var(--data-1)' },
  { cle: 'epargne_pension', nom: 'Épargne-pension', type: 'investissement', couleur: 'var(--data-6)' },
  { cle: 'credit', nom: 'Remboursement de crédit', type: 'investissement', couleur: 'var(--data-7)' },

  { cle: 'transfert', nom: 'Transfert interne', type: 'transfert', couleur: 'var(--data-8)' },
];

export const CATEGORIE_PAR_CLE = new Map(CATEGORIES_SYSTEME.map((c) => [c.cle, c]));

export type RegleCategorisation = {
  /** Motif recherché dans le libellé, déjà normalisé. */
  motif: string;
  categorie: string;
  /** Plus le nombre est bas, plus la règle est prioritaire. */
  priorite: number;
};

/**
 * Règles globales, sur les libellés belges courants.
 *
 * Les motifs sont comparés sur un libellé normalisé (minuscules, sans accents,
 * sans ponctuation) : « DELHAIZE LIÈGE » et « delhaize-liege » matchent tous deux.
 */
export const REGLES_BELGES: readonly RegleCategorisation[] = [
  // ── Revenus ────────────────────────────────────────────────
  { motif: 'salaire', categorie: 'salaire', priorite: 10 },
  { motif: 'wedde', categorie: 'salaire', priorite: 10 },
  { motif: 'loon', categorie: 'salaire', priorite: 10 },
  { motif: 'remuneration', categorie: 'salaire', priorite: 10 },
  { motif: 'pecule de vacances', categorie: 'salaire', priorite: 10 },
  { motif: 'vakantiegeld', categorie: 'salaire', priorite: 10 },
  { motif: 'prime de fin', categorie: 'salaire', priorite: 10 },
  { motif: 'eindejaarspremie', categorie: 'salaire', priorite: 10 },
  { motif: 'onem', categorie: 'allocations', priorite: 10 },
  { motif: 'rva', categorie: 'allocations', priorite: 10 },
  { motif: 'mutualite', categorie: 'allocations', priorite: 10 },
  { motif: 'mutualiteit', categorie: 'allocations', priorite: 10 },
  { motif: 'partenamut', categorie: 'allocations', priorite: 10 },
  { motif: 'solidaris', categorie: 'allocations', priorite: 10 },
  { motif: 'mutualite chretienne', categorie: 'allocations', priorite: 10 },
  { motif: 'famiris', categorie: 'allocations', priorite: 10 },
  { motif: 'famiwal', categorie: 'allocations', priorite: 10 },
  { motif: 'kindergeld', categorie: 'allocations', priorite: 10 },

  // ── Courses ────────────────────────────────────────────────
  { motif: 'colruyt', categorie: 'courses', priorite: 20 },
  { motif: 'delhaize', categorie: 'courses', priorite: 20 },
  { motif: 'carrefour', categorie: 'courses', priorite: 20 },
  { motif: 'aldi', categorie: 'courses', priorite: 20 },
  { motif: 'lidl', categorie: 'courses', priorite: 20 },
  { motif: 'okay', categorie: 'courses', priorite: 20 },
  { motif: 'spar', categorie: 'courses', priorite: 20 },
  { motif: 'intermarche', categorie: 'courses', priorite: 20 },
  { motif: 'cora', categorie: 'courses', priorite: 20 },
  { motif: 'match', categorie: 'courses', priorite: 20 },
  { motif: 'albert heijn', categorie: 'courses', priorite: 20 },
  { motif: 'bio planet', categorie: 'courses', priorite: 20 },
  { motif: 'boucherie', categorie: 'courses', priorite: 20 },
  { motif: 'boulangerie', categorie: 'courses', priorite: 20 },
  { motif: 'bakkerij', categorie: 'courses', priorite: 20 },

  // ── Énergie et eau ─────────────────────────────────────────
  { motif: 'luminus', categorie: 'energie', priorite: 20 },
  { motif: 'engie', categorie: 'energie', priorite: 20 },
  { motif: 'mega', categorie: 'energie', priorite: 25 },
  { motif: 'octa+', categorie: 'energie', priorite: 20 },
  { motif: 'eneco', categorie: 'energie', priorite: 20 },
  { motif: 'lampiris', categorie: 'energie', priorite: 20 },
  { motif: 'totalenergies', categorie: 'energie', priorite: 20 },
  { motif: 'swde', categorie: 'energie', priorite: 20 },
  { motif: 'vivaqua', categorie: 'energie', priorite: 20 },
  { motif: 'cile', categorie: 'energie', priorite: 20 },
  { motif: 'resa', categorie: 'energie', priorite: 20 },
  { motif: 'ores', categorie: 'energie', priorite: 20 },
  { motif: 'fluvius', categorie: 'energie', priorite: 20 },
  { motif: 'sibelga', categorie: 'energie', priorite: 20 },

  // ── Télécoms ───────────────────────────────────────────────
  { motif: 'proximus', categorie: 'telecom', priorite: 20 },
  { motif: 'telenet', categorie: 'telecom', priorite: 20 },
  { motif: 'voo', categorie: 'telecom', priorite: 20 },
  { motif: 'orange', categorie: 'telecom', priorite: 20 },
  { motif: 'base', categorie: 'telecom', priorite: 25 },
  { motif: 'scarlet', categorie: 'telecom', priorite: 20 },
  { motif: 'mobile vikings', categorie: 'telecom', priorite: 20 },
  { motif: 'edpnet', categorie: 'telecom', priorite: 20 },

  // ── Transport ──────────────────────────────────────────────
  { motif: 'stib', categorie: 'transport', priorite: 20 },
  { motif: 'mivb', categorie: 'transport', priorite: 20 },
  { motif: 'tec', categorie: 'transport', priorite: 25 },
  { motif: 'de lijn', categorie: 'transport', priorite: 20 },
  { motif: 'sncb', categorie: 'transport', priorite: 20 },
  { motif: 'nmbs', categorie: 'transport', priorite: 20 },
  { motif: 'blue bike', categorie: 'transport', priorite: 20 },
  { motif: 'villo', categorie: 'transport', priorite: 20 },
  { motif: 'cambio', categorie: 'transport', priorite: 20 },
  { motif: 'uber', categorie: 'transport', priorite: 20 },
  { motif: 'bolt', categorie: 'transport', priorite: 20 },
  { motif: 'lukoil', categorie: 'transport', priorite: 20 },
  { motif: 'texaco', categorie: 'transport', priorite: 20 },
  { motif: 'esso', categorie: 'transport', priorite: 20 },
  { motif: 'shell', categorie: 'transport', priorite: 20 },
  { motif: 'q8', categorie: 'transport', priorite: 20 },
  { motif: 'dats 24', categorie: 'transport', priorite: 20 },
  { motif: 'station', categorie: 'transport', priorite: 40 },
  { motif: 'parking', categorie: 'transport', priorite: 25 },
  { motif: 'interparking', categorie: 'transport', priorite: 20 },
  { motif: 'touring', categorie: 'transport', priorite: 20 },
  { motif: 'vab', categorie: 'transport', priorite: 20 },

  // ── Logement ───────────────────────────────────────────────
  { motif: 'loyer', categorie: 'logement', priorite: 15 },
  { motif: 'huur', categorie: 'logement', priorite: 15 },
  { motif: 'syndic', categorie: 'logement', priorite: 15 },
  { motif: 'charges communes', categorie: 'logement', priorite: 15 },
  { motif: 'precompte immobilier', categorie: 'impots', priorite: 15 },
  { motif: 'onroerende voorheffing', categorie: 'impots', priorite: 15 },
  { motif: 'brico', categorie: 'logement', priorite: 25 },
  { motif: 'hubo', categorie: 'logement', priorite: 25 },
  { motif: 'gamma', categorie: 'logement', priorite: 25 },
  { motif: 'ikea', categorie: 'logement', priorite: 25 },
  { motif: 'leroy merlin', categorie: 'logement', priorite: 25 },

  // ── Assurances ─────────────────────────────────────────────
  { motif: 'ethias', categorie: 'assurances', priorite: 20 },
  { motif: 'ag insurance', categorie: 'assurances', priorite: 20 },
  { motif: 'axa', categorie: 'assurances', priorite: 20 },
  { motif: 'belfius insurance', categorie: 'assurances', priorite: 20 },
  { motif: 'kbc verzekering', categorie: 'assurances', priorite: 20 },
  { motif: 'baloise', categorie: 'assurances', priorite: 20 },
  { motif: 'allianz', categorie: 'assurances', priorite: 20 },
  { motif: 'assurance', categorie: 'assurances', priorite: 35 },
  { motif: 'verzekering', categorie: 'assurances', priorite: 35 },
  { motif: 'p&v', categorie: 'assurances', priorite: 20 },
  { motif: 'dvv', categorie: 'assurances', priorite: 20 },

  // ── Santé ──────────────────────────────────────────────────
  { motif: 'pharmacie', categorie: 'sante', priorite: 20 },
  { motif: 'apotheek', categorie: 'sante', priorite: 20 },
  { motif: 'multipharma', categorie: 'sante', priorite: 20 },
  { motif: 'medi-market', categorie: 'sante', priorite: 20 },
  { motif: 'dr ', categorie: 'sante', priorite: 40 },
  { motif: 'hopital', categorie: 'sante', priorite: 20 },
  { motif: 'ziekenhuis', categorie: 'sante', priorite: 20 },
  { motif: 'chu', categorie: 'sante', priorite: 25 },
  { motif: 'dentiste', categorie: 'sante', priorite: 20 },
  { motif: 'kinesitherapie', categorie: 'sante', priorite: 20 },

  // ── Abonnements ────────────────────────────────────────────
  { motif: 'netflix', categorie: 'abonnements', priorite: 15 },
  { motif: 'spotify', categorie: 'abonnements', priorite: 15 },
  { motif: 'disney', categorie: 'abonnements', priorite: 15 },
  { motif: 'amazon prime', categorie: 'abonnements', priorite: 15 },
  { motif: 'youtube premium', categorie: 'abonnements', priorite: 15 },
  { motif: 'apple.com/bill', categorie: 'abonnements', priorite: 15 },
  { motif: 'google storage', categorie: 'abonnements', priorite: 15 },
  { motif: 'microsoft', categorie: 'abonnements', priorite: 25 },
  { motif: 'dropbox', categorie: 'abonnements', priorite: 15 },
  { motif: 'streamz', categorie: 'abonnements', priorite: 15 },
  { motif: 'basic fit', categorie: 'abonnements', priorite: 15 },
  { motif: 'jims', categorie: 'abonnements', priorite: 15 },

  // ── Restaurants ────────────────────────────────────────────
  { motif: 'restaurant', categorie: 'restaurants', priorite: 25 },
  { motif: 'brasserie', categorie: 'restaurants', priorite: 25 },
  { motif: 'taverne', categorie: 'restaurants', priorite: 25 },
  { motif: 'friterie', categorie: 'restaurants', priorite: 25 },
  { motif: 'frituur', categorie: 'restaurants', priorite: 25 },
  { motif: 'takeaway', categorie: 'restaurants', priorite: 20 },
  { motif: 'deliveroo', categorie: 'restaurants', priorite: 20 },
  { motif: 'uber eats', categorie: 'restaurants', priorite: 20 },
  { motif: 'pizza', categorie: 'restaurants', priorite: 30 },
  { motif: 'mcdonald', categorie: 'restaurants', priorite: 20 },
  { motif: 'quick', categorie: 'restaurants', priorite: 25 },
  { motif: 'panos', categorie: 'restaurants', priorite: 20 },
  { motif: 'exki', categorie: 'restaurants', priorite: 20 },
  { motif: 'starbucks', categorie: 'restaurants', priorite: 20 },

  // ── Loisirs ────────────────────────────────────────────────
  { motif: 'kinepolis', categorie: 'loisirs', priorite: 20 },
  { motif: 'ugc', categorie: 'loisirs', priorite: 20 },
  { motif: 'cinema', categorie: 'loisirs', priorite: 25 },
  { motif: 'fnac', categorie: 'loisirs', priorite: 25 },
  { motif: 'standaard boekhandel', categorie: 'loisirs', priorite: 20 },
  { motif: 'club', categorie: 'loisirs', priorite: 45 },
  { motif: 'decathlon', categorie: 'loisirs', priorite: 25 },
  { motif: 'ticketmaster', categorie: 'loisirs', priorite: 20 },
  { motif: 'booking.com', categorie: 'loisirs', priorite: 20 },
  { motif: 'airbnb', categorie: 'loisirs', priorite: 20 },
  { motif: 'ryanair', categorie: 'loisirs', priorite: 20 },
  { motif: 'brussels airlines', categorie: 'loisirs', priorite: 20 },

  // ── Shopping ───────────────────────────────────────────────
  { motif: 'zalando', categorie: 'shopping', priorite: 20 },
  { motif: 'amazon', categorie: 'shopping', priorite: 30 },
  { motif: 'bol.com', categorie: 'shopping', priorite: 20 },
  { motif: 'coolblue', categorie: 'shopping', priorite: 20 },
  { motif: 'mediamarkt', categorie: 'shopping', priorite: 20 },
  { motif: 'krefel', categorie: 'shopping', priorite: 20 },
  { motif: 'action', categorie: 'shopping', priorite: 25 },
  { motif: 'hema', categorie: 'shopping', priorite: 20 },
  { motif: 'zara', categorie: 'shopping', priorite: 20 },
  { motif: 'h&m', categorie: 'shopping', priorite: 20 },
  { motif: 'primark', categorie: 'shopping', priorite: 20 },
  { motif: 'jbc', categorie: 'shopping', priorite: 20 },
  { motif: 'e5 mode', categorie: 'shopping', priorite: 20 },
  { motif: 'veritas', categorie: 'shopping', priorite: 20 },
  { motif: 'ici paris xl', categorie: 'shopping', priorite: 20 },
  { motif: 'di ', categorie: 'shopping', priorite: 40 },

  // ── Impôts et frais bancaires ──────────────────────────────
  { motif: 'spf finances', categorie: 'impots', priorite: 10 },
  { motif: 'fod financien', categorie: 'impots', priorite: 10 },
  { motif: 'contributions', categorie: 'impots', priorite: 15 },
  { motif: 'taxe communale', categorie: 'impots', priorite: 15 },
  { motif: 'tva', categorie: 'impots', priorite: 30 },
  { motif: 'cotisations sociales', categorie: 'impots', priorite: 10 },
  { motif: 'xerius', categorie: 'impots', priorite: 10 },
  { motif: 'partena', categorie: 'impots', priorite: 10 },
  { motif: 'securex', categorie: 'impots', priorite: 10 },
  { motif: 'acerta', categorie: 'impots', priorite: 10 },
  { motif: 'liantis', categorie: 'impots', priorite: 10 },
  { motif: 'frais de tenue', categorie: 'frais_bancaires', priorite: 10 },
  { motif: 'frais bancaires', categorie: 'frais_bancaires', priorite: 10 },
  { motif: 'bankkosten', categorie: 'frais_bancaires', priorite: 10 },
  { motif: 'cotisation carte', categorie: 'frais_bancaires', priorite: 10 },

  // ── Investissement et crédit ───────────────────────────────
  { motif: 'degiro', categorie: 'investissement', priorite: 10 },
  { motif: 'trade republic', categorie: 'investissement', priorite: 10 },
  { motif: 'bolero', categorie: 'investissement', priorite: 10 },
  { motif: 'keytrade', categorie: 'investissement', priorite: 10 },
  { motif: 'interactive brokers', categorie: 'investissement', priorite: 10 },
  { motif: 'saxo', categorie: 'investissement', priorite: 10 },
  { motif: 'me direct', categorie: 'investissement', priorite: 10 },
  { motif: 'bitstamp', categorie: 'investissement', priorite: 10 },
  { motif: 'kraken', categorie: 'investissement', priorite: 10 },
  { motif: 'coinbase', categorie: 'investissement', priorite: 10 },
  { motif: 'epargne pension', categorie: 'epargne_pension', priorite: 10 },
  { motif: 'pensioensparen', categorie: 'epargne_pension', priorite: 10 },
  { motif: 'remboursement pret', categorie: 'credit', priorite: 10 },
  { motif: 'credit hypothecaire', categorie: 'credit', priorite: 10 },
  { motif: 'hypothecaire lening', categorie: 'credit', priorite: 10 },
  { motif: 'mensualite', categorie: 'credit', priorite: 20 },

  // ── Éducation et dons ──────────────────────────────────────
  { motif: 'universite', categorie: 'education', priorite: 20 },
  { motif: 'universiteit', categorie: 'education', priorite: 20 },
  { motif: 'haute ecole', categorie: 'education', priorite: 20 },
  { motif: 'ecole', categorie: 'education', priorite: 35 },
  { motif: 'creche', categorie: 'education', priorite: 20 },
  { motif: 'one', categorie: 'education', priorite: 45 },
  { motif: 'croix-rouge', categorie: 'dons', priorite: 15 },
  { motif: 'rode kruis', categorie: 'dons', priorite: 15 },
  { motif: 'unicef', categorie: 'dons', priorite: 15 },
  { motif: 'medecins sans frontieres', categorie: 'dons', priorite: 15 },
  { motif: 'greenpeace', categorie: 'dons', priorite: 15 },
  { motif: 'amnesty', categorie: 'dons', priorite: 15 },

  // ── Transferts internes ────────────────────────────────────
  { motif: 'virement interne', categorie: 'transfert', priorite: 5 },
  { motif: 'interne overschrijving', categorie: 'transfert', priorite: 5 },
  { motif: 'vers compte epargne', categorie: 'transfert', priorite: 5 },
  { motif: 'naar spaarrekening', categorie: 'transfert', priorite: 5 },
];

/** Normalise un libellé pour la comparaison : minuscules, sans accents. */
export function normaliserLibelle(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export type ResultatCategorisation = {
  categorie: string | null;
  /** La règle qui a décidé, pour pouvoir l'expliquer à l'utilisateur. */
  motif: string | null;
  /** `true` quand une règle de l'utilisateur a primé sur les règles globales. */
  regleUtilisateur: boolean;
};

/**
 * Catégorise une transaction.
 *
 * Les règles de l'utilisateur passent avant les globales, et à priorité égale
 * le motif le plus long gagne : « mutualite chretienne » est plus précis que
 * « mutualite », et doit l'emporter.
 */
export function categoriser(
  transaction: { libelle: string; contrepartie?: string | null; montantCents: number },
  reglesUtilisateur: readonly RegleCategorisation[] = [],
): ResultatCategorisation {
  const texte = normaliserLibelle(
    `${transaction.libelle} ${transaction.contrepartie ?? ''}`,
  );

  const candidats: { regle: RegleCategorisation; utilisateur: boolean }[] = [];

  for (const regle of reglesUtilisateur) {
    if (texte.includes(normaliserLibelle(regle.motif))) {
      candidats.push({ regle, utilisateur: true });
    }
  }
  for (const regle of REGLES_BELGES) {
    if (texte.includes(regle.motif)) {
      candidats.push({ regle, utilisateur: false });
    }
  }

  if (candidats.length === 0) {
    // Sans règle, on tranche au moins sur le sens du flux : un montant positif
    // qui n'est pas identifié reste un revenu, pas une dépense.
    return {
      categorie: transaction.montantCents > 0 ? 'autres_revenus' : 'autres_depenses',
      motif: null,
      regleUtilisateur: false,
    };
  }

  candidats.sort((a, b) => {
    if (a.utilisateur !== b.utilisateur) return a.utilisateur ? -1 : 1;
    if (a.regle.priorite !== b.regle.priorite) return a.regle.priorite - b.regle.priorite;
    return b.regle.motif.length - a.regle.motif.length;
  });

  const gagnant = candidats[0]!;
  return {
    categorie: gagnant.regle.categorie,
    motif: gagnant.regle.motif,
    regleUtilisateur: gagnant.utilisateur,
  };
}

export type AbonnementDetecte = {
  libelle: string;
  montantMensuelCents: number;
  occurrences: number;
  coutAnnuelCents: number;
};

/**
 * Détecte les dépenses récurrentes (doc 02 § module 3).
 *
 * Regroupe par libellé normalisé et retient ce qui revient au moins trois fois
 * avec un montant stable. Le coût annualisé est la valeur perçue immédiate :
 * 13 € par mois ne parle à personne, 156 € par an, si.
 */
export function detecterAbonnements(
  transactions: readonly { libelle: string; montantCents: number; date: string }[],
): AbonnementDetecte[] {
  const groupes = new Map<string, { libelle: string; montants: number[]; mois: Set<string> }>();

  for (const t of transactions) {
    if (t.montantCents >= 0) continue;

    // On tronque le libellé : les extraits ajoutent souvent une date ou un
    // numéro de commande qui change à chaque fois.
    const cle = normaliserLibelle(t.libelle).replace(/\d+/g, '').trim().slice(0, 24);
    if (cle.length < 3) continue;

    const groupe = groupes.get(cle) ?? { libelle: t.libelle, montants: [], mois: new Set() };
    groupe.montants.push(Math.abs(t.montantCents));
    groupe.mois.add(t.date.slice(0, 7));
    groupes.set(cle, groupe);
  }

  const abonnements: AbonnementDetecte[] = [];

  for (const groupe of groupes.values()) {
    if (groupe.mois.size < 3) continue;

    const moyenne = groupe.montants.reduce((s, m) => s + m, 0) / groupe.montants.length;
    // Montant stable : un écart type au-delà de 15 % de la moyenne, ce n'est
    // pas un abonnement mais des courses au même endroit.
    const variance =
      groupe.montants.reduce((s, m) => s + (m - moyenne) ** 2, 0) / groupe.montants.length;
    if (Math.sqrt(variance) > moyenne * 0.15) continue;

    const mensuel = Math.round(moyenne);
    abonnements.push({
      libelle: groupe.libelle,
      montantMensuelCents: mensuel,
      occurrences: groupe.mois.size,
      coutAnnuelCents: mensuel * 12,
    });
  }

  return abonnements.sort((a, b) => b.coutAnnuelCents - a.coutAnnuelCents);
}

/**
 * Détecte les virements entre ses propres comptes par leur miroir.
 *
 * Samuel a importé son compte courant et son compte d'épargne : chaque
 * virement de l'un vers l'autre apparaît deux fois, en sortie ici et en
 * entrée là, et le libellé de sa banque ne dit pas « virement interne ». Les
 * règles par mots-clés ne suffisent donc pas. Ce qui trahit un transfert,
 * c'est son reflet : un débit dans un import et un crédit du même montant
 * dans un autre import, à deux jours près. Les deux lignes sont alors
 * exclues du budget — sinon le taux d'épargne compte une dépense qui n'en
 * est pas une, et un revenu qui n'en est pas un.
 *
 * Deux imports différents, c'est la garantie : un achat remboursé le
 * lendemain sur le même compte ne doit pas passer pour un transfert. Chaque
 * ligne n'est appariée qu'une fois.
 */
export function detecterTransfertsMiroir(
  transactions: readonly {
    id: string;
    date: string;
    montantCents: number;
    importId: string | null;
  }[],
  toleranceJours = 2,
): Set<string> {
  const jour = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86_400_000);
  const credits = transactions
    .filter((t) => t.montantCents > 0)
    .map((t) => ({ ...t, j: jour(t.date) }))
    .sort((a, b) => a.j - b.j);
  const debits = transactions
    .filter((t) => t.montantCents < 0)
    .map((t) => ({ ...t, j: jour(t.date) }))
    .sort((a, b) => a.j - b.j);

  const apparies = new Set<string>();
  const pris = new Set<string>();

  for (const debit of debits) {
    const reflet = credits.find(
      (c) =>
        !pris.has(c.id) &&
        c.montantCents === -debit.montantCents &&
        Math.abs(c.j - debit.j) <= toleranceJours &&
        c.importId !== null &&
        debit.importId !== null &&
        c.importId !== debit.importId,
    );
    if (!reflet) continue;
    pris.add(reflet.id);
    apparies.add(debit.id);
    apparies.add(reflet.id);
  }

  return apparies;
}
