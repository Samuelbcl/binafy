import type { SupportTOB } from '../tax/tob';

/**
 * Types métier du patrimoine, indépendants de leur origine.
 *
 * Les données viennent soit de Supabase, soit du jeu de démo : les écrans et
 * les calculs ne doivent pas savoir lequel. Toute la logique de présentation
 * (regroupement en poches, totaux, allocation) vit ici, une seule fois.
 */

export type ClasseActif =
  | 'compte_courant'
  | 'compte_epargne'
  | 'compte_titres'
  | 'etf'
  | 'action'
  | 'obligation'
  | 'fonds'
  | 'crypto'
  | 'immobilier'
  | 'assurance_groupe'
  | 'epargne_pension'
  | 'branche21'
  | 'branche23'
  | 'parts_societe'
  | 'creance'
  | 'metaux'
  | 'autre';

export const CLASSES_ACTIF: readonly ClasseActif[] = [
  'compte_courant',
  'compte_epargne',
  'compte_titres',
  'etf',
  'action',
  'obligation',
  'fonds',
  'crypto',
  'immobilier',
  'assurance_groupe',
  'epargne_pension',
  'branche21',
  'branche23',
  'parts_societe',
  'creance',
  'metaux',
  'autre',
];

export const LIBELLE_CLASSE: Record<ClasseActif, string> = {
  compte_courant: 'Compte courant',
  compte_epargne: 'Compte d’épargne',
  compte_titres: 'Compte-titres',
  etf: 'ETF',
  action: 'Action',
  obligation: 'Obligation',
  fonds: 'Fonds',
  crypto: 'Crypto',
  immobilier: 'Immobilier',
  assurance_groupe: 'Assurance-groupe',
  epargne_pension: 'Épargne-pension',
  branche21: 'Branche 21',
  branche23: 'Branche 23',
  parts_societe: 'Parts de société',
  creance: 'Créance',
  metaux: 'Métaux précieux',
  autre: 'Autre',
};

export type TypePassif =
  | 'credit_hypothecaire'
  | 'pret_temperament'
  | 'pret_prive'
  | 'leasing'
  | 'autre';

export const LIBELLE_PASSIF: Record<TypePassif, string> = {
  credit_hypothecaire: 'Crédit hypothécaire',
  pret_temperament: 'Prêt à tempérament',
  pret_prive: 'Prêt privé',
  leasing: 'Leasing',
  autre: 'Autre',
};

/** Regroupement affiché dans le donut d'allocation. */
export type PocheAllocation =
  | 'liquidites'
  | 'epargne'
  | 'actions'
  | 'crypto'
  | 'immobilier'
  | 'pension'
  | 'autre';

export const LIBELLE_POCHE: Record<PocheAllocation, string> = {
  liquidites: 'Liquidités',
  epargne: 'Épargne',
  actions: 'Actions et ETF',
  crypto: 'Crypto',
  immobilier: 'Immobilier',
  pension: 'Pension',
  autre: 'Autre',
};

export const COULEUR_POCHE: Record<PocheAllocation, string> = {
  liquidites: 'var(--data-8)',
  epargne: 'var(--data-2)',
  actions: 'var(--data-1)',
  crypto: 'var(--data-4)',
  immobilier: 'var(--data-3)',
  pension: 'var(--data-6)',
  autre: 'var(--data-7)',
};

export function pocheDe(classe: ClasseActif): PocheAllocation {
  switch (classe) {
    case 'compte_courant':
      return 'liquidites';
    case 'compte_epargne':
      return 'epargne';
    case 'compte_titres':
    case 'etf':
    case 'action':
    case 'obligation':
    case 'fonds':
      return 'actions';
    case 'crypto':
      return 'crypto';
    case 'immobilier':
      return 'immobilier';
    case 'assurance_groupe':
    case 'epargne_pension':
    case 'branche21':
    case 'branche23':
      return 'pension';
    default:
      return 'autre';
  }
}

/** Les classes soumises à la TOB à la revente. */
export function supportTOBParDefaut(actif: {
  classe: ClasseActif;
  inscritEnBelgique?: boolean | null;
  capitalisant?: boolean | null;
}): SupportTOB | null {
  const soumis: ClasseActif[] = ['etf', 'action', 'fonds', 'obligation', 'compte_titres'];
  if (!soumis.includes(actif.classe)) return null;
  if (!actif.inscritEnBelgique) return 'actions_etrangeres';
  return actif.capitalisant ? 'capitalisant_belge' : 'distribuant_belge';
}

export type Actif = {
  id: string;
  nom: string;
  institution: string | null;
  classe: ClasseActif;
  /** Valeur de marché intégrale du bien, avant quote-part. */
  valeurCents: number;
  /** Variation sur un jour, en centimes. `0` si inconnue. */
  variationJourCents: number;
  quantite?: number | null;
  isin?: string | null;
  prixAcquisitionCents?: number | null;
  /** Point de départ de la taxe sur les plus-values pour les positions d'avant 2026. */
  valeurReference2025Cents?: number | null;
  dateAcquisition?: string | null;
  supportTOB?: SupportTOB | null;
  /** Quote-part de détention, en pourcentage. */
  quotePart: number;
  capitalisant?: boolean | null;
  inscritEnBelgique?: boolean | null;
  compteEpargneReglemente?: boolean | null;
  tauxBase?: number | null;
  primeFidelite?: number | null;
  revenuCadastralCents?: number | null;
  usageBien?: 'propre' | 'locatif_prive' | 'locatif_pro' | null;
};

export type Passif = {
  id: string;
  nom: string;
  type: TypePassif;
  capitalRestantCents: number;
  capitalInitialCents: number;
  tauxAnnuel: number;
  dureeMois: number;
  dateDebut: string;
  mensualiteCents: number;
};

export type PointHistorique = {
  date: string;
  actifsCents: number;
  passifsCents: number;
  netCents: number;
};

export type AllocationPoche = {
  poche: PocheAllocation;
  libelle: string;
  couleur: string;
  valeurCents: number;
  part: number;
};

/** Un patrimoine complet, quelle que soit son origine. */
export type Patrimoine = {
  actifs: Actif[];
  passifs: Passif[];
  historique: PointHistorique[];
  /** `true` quand les données sont fictives : l'interface le signale. */
  demo: boolean;
};

// ── Calculs de présentation ──────────────────────────────────

/** Valeur d'un actif ramenée à la quote-part détenue. */
export function valeurQuotePart(actif: Actif): number {
  return Math.round(actif.valeurCents * (actif.quotePart / 100));
}

export function totalActifs(actifs: readonly Actif[]): number {
  return actifs.reduce((somme, a) => somme + valeurQuotePart(a), 0);
}

/** Valeur ménage : les biens en entier, quelle que soit la quote-part. */
export function totalActifsMenage(actifs: readonly Actif[]): number {
  return actifs.reduce((somme, a) => somme + a.valeurCents, 0);
}

export function totalPassifs(passifs: readonly Passif[]): number {
  return passifs.reduce((somme, p) => somme + p.capitalRestantCents, 0);
}

export function patrimoineNet(actifs: readonly Actif[], passifs: readonly Passif[]): number {
  return totalActifs(actifs) - totalPassifs(passifs);
}

export function variationJour(actifs: readonly Actif[]): number {
  return actifs.reduce(
    (somme, a) => somme + Math.round(a.variationJourCents * (a.quotePart / 100)),
    0,
  );
}

export function allocation(actifs: readonly Actif[]): AllocationPoche[] {
  const total = totalActifs(actifs);
  const parPoche = new Map<PocheAllocation, number>();

  for (const actif of actifs) {
    const poche = pocheDe(actif.classe);
    parPoche.set(poche, (parPoche.get(poche) ?? 0) + valeurQuotePart(actif));
  }

  return [...parPoche.entries()]
    .map(([poche, valeurCents]) => ({
      poche,
      libelle: LIBELLE_POCHE[poche],
      couleur: COULEUR_POCHE[poche],
      valeurCents,
      part: total > 0 ? valeurCents / total : 0,
    }))
    .sort((a, b) => b.valeurCents - a.valeurCents);
}
