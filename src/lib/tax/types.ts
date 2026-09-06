/**
 * Contrat commun à tous les moteurs de calcul (doc 07).
 *
 * Deux règles structurantes, non négociables :
 *  1. Ces fonctions sont **pures** : pas de réseau, pas de base, pas d'horloge.
 *     Les paramètres fiscaux arrivent en argument, injectés depuis `tax_parameters`.
 *  2. Tout résultat chiffré doit pouvoir s'expliquer : d'où le `breakdown` et les
 *     `sources`, qui alimentent le panneau « D'où vient ce chiffre » de l'interface.
 *     Ce n'est pas du confort de debug, c'est une exigence produit.
 */

export type RegionFiscale = 'wallonie' | 'bruxelles' | 'flandre';

export const REGIONS: readonly RegionFiscale[] = ['wallonie', 'bruxelles', 'flandre'];

export const LIBELLE_REGION: Record<RegionFiscale, string> = {
  wallonie: 'Wallonie',
  bruxelles: 'Bruxelles-Capitale',
  flandre: 'Flandre',
};

export type UniteParametre = 'pourcent' | 'eur' | 'coefficient' | 'annees';

/** Une ligne de `tax_parameters`, telle qu'injectée dans un calculateur. */
export type TaxParameter = {
  cle: string;
  annee: number;
  region: RegionFiscale | null;
  /** Valeur brute. Un `pourcent` vaut 30 pour 30 %, pas 0,30. */
  valeur: number;
  unite: UniteParametre;
  libelle: string;
  sourceUrl: string;
  /** Date ISO de dernière vérification à la source officielle. */
  verifieLe: string;
  /**
   * `false` quand la valeur est un ordre de grandeur en attente de confirmation
   * à la source. L'interface doit alors afficher un avertissement sur le calcul.
   */
  verifie: boolean;
  /**
   * `true` pour une valeur qui n'est pas une règle légale : pratique bancaire,
   * tarif commercial, hypothèse de simulation. Ces valeurs ne seront jamais
   * « vérifiées » au sens d'un taux publié, et ne doivent donc pas gonfler le
   * compteur des paramètres à confirmer — mais elles restent discutables, ce
   * qui est une autre affaire.
   */
  hypothese?: boolean;
};

/** Un jeu de paramètres pour une année donnée. */
export type TaxParamSet = {
  annee: number;
  parametres: readonly TaxParameter[];
};

/** Ligne du détail de calcul affichée à l'utilisateur. */
export type BreakdownLine = {
  libelle: string;
  valeur: number;
  /** `eur` : la valeur est en centimes. `pourcent` : en points de pourcentage. */
  unite?: UniteParametre | 'texte';
  /** Détail secondaire, affiché en plus discret sous la ligne. */
  precision?: string;
  /** Ligne de total, mise en avant visuellement. */
  total?: boolean;
};

export type SourceRef = {
  cle: string;
  annee: number;
  libelle: string;
  url: string;
  verifieLe: string;
  verifie: boolean;
};

export type CalcResult<T> = {
  result: T;
  breakdown: BreakdownLine[];
  sources: SourceRef[];
  hypotheses: string[];
};

/** Levée quand un paramètre fiscal est absent. On refuse d'inventer une valeur. */
export class ParametreFiscalManquantError extends Error {
  constructor(
    readonly cle: string,
    readonly annee: number,
    readonly region: RegionFiscale | null,
  ) {
    const cible = region ? `${cle} (${region})` : cle;
    super(
      `Paramètre fiscal manquant : « ${cible} » pour l'année ${annee}. ` +
        `Ajoute-le dans tax_parameters avec sa source officielle — ne le code pas en dur.`,
    );
    this.name = 'ParametreFiscalManquantError';
  }
}

/**
 * Récupère un paramètre. Cherche d'abord la valeur régionale, puis la valeur
 * fédérale (`region = null`). Lève si rien n'est trouvé : un calcul faux et
 * silencieux est pire qu'une absence de résultat.
 */
export function getParam(
  set: TaxParamSet,
  cle: string,
  region?: RegionFiscale | null,
): TaxParameter {
  if (region) {
    const regional = set.parametres.find((p) => p.cle === cle && p.region === region);
    if (regional) return regional;
  }
  const federal = set.parametres.find((p) => p.cle === cle && p.region === null);
  if (federal) return federal;
  throw new ParametreFiscalManquantError(cle, set.annee, region ?? null);
}

/** Valeur d'un paramètre `pourcent` convertie en ratio : 30 % → 0,30. */
export function getRate(set: TaxParamSet, cle: string, region?: RegionFiscale | null): number {
  const p = getParam(set, cle, region);
  return p.unite === 'pourcent' ? p.valeur / 100 : p.valeur;
}

/** Valeur d'un paramètre `eur`, convertie en centimes. */
export function getCents(set: TaxParamSet, cle: string, region?: RegionFiscale | null): number {
  const p = getParam(set, cle, region);
  return Math.round(p.valeur * 100);
}

export function getValue(set: TaxParamSet, cle: string, region?: RegionFiscale | null): number {
  return getParam(set, cle, region).valeur;
}

export function toSource(p: TaxParameter): SourceRef {
  return {
    cle: p.cle,
    annee: p.annee,
    libelle: p.libelle,
    url: p.sourceUrl,
    verifieLe: p.verifieLe,
    verifie: p.verifie,
  };
}

/** Déduplique les sources d'un résultat composite. */
export function mergeSources(...groupes: readonly SourceRef[][]): SourceRef[] {
  const vues = new Map<string, SourceRef>();
  for (const groupe of groupes) {
    for (const s of groupe) {
      const k = `${s.cle}|${s.annee}`;
      if (!vues.has(k)) vues.set(k, s);
    }
  }
  return [...vues.values()];
}

/** Vrai si un résultat s'appuie sur au moins un paramètre non vérifié. */
export function contientParametreNonVerifie(sources: readonly SourceRef[]): boolean {
  return sources.some((s) => !s.verifie);
}

/**
 * Un barème par tranches, reconstruit depuis des clés numérotées
 * (`ipp.tranche_1.plafond`, `ipp.tranche_1.taux`, …).
 * La dernière tranche, sans plafond, porte `plafondCents = Infinity`.
 */
export type TrancheBareme = { plafondCents: number; taux: number };

function existeParam(set: TaxParamSet, cle: string, region?: RegionFiscale | null): boolean {
  return set.parametres.some(
    (p) => p.cle === cle && (p.region === null || p.region === (region ?? null)),
  );
}

export function getBareme(
  set: TaxParamSet,
  prefixe: string,
  region?: RegionFiscale | null,
): { tranches: TrancheBareme[]; sources: SourceRef[] } {
  const tranches: TrancheBareme[] = [];
  const sources: SourceRef[] = [];

  for (let i = 1; i <= 20; i++) {
    const cleTaux = `${prefixe}.tranche_${i}.taux`;
    if (!existeParam(set, cleTaux, region)) break;

    const pTaux = getParam(set, cleTaux, region);
    sources.push(toSource(pTaux));

    const clePlafond = `${prefixe}.tranche_${i}.plafond`;
    let plafondCents = Number.POSITIVE_INFINITY;
    if (existeParam(set, clePlafond, region)) {
      const pPlafond = getParam(set, clePlafond, region);
      plafondCents = Math.round(pPlafond.valeur * 100);
      sources.push(toSource(pPlafond));
    }

    tranches.push({ plafondCents, taux: pTaux.valeur / 100 });
  }

  if (tranches.length === 0) {
    throw new ParametreFiscalManquantError(`${prefixe}.tranche_1.taux`, set.annee, region ?? null);
  }
  return { tranches, sources };
}

/** Applique un barème progressif à une base en centimes. */
export type LigneBareme = {
  deCents: number;
  aCents: number;
  taux: number;
  impotCents: number;
};

export function appliquerBaremeProgressif(
  baseCents: number,
  tranches: readonly TrancheBareme[],
): { impotCents: number; detail: LigneBareme[] } {
  let plancher = 0;
  let impot = 0;
  const detail: LigneBareme[] = [];

  for (const tranche of tranches) {
    if (baseCents <= plancher) break;
    const plafond = Math.min(baseCents, tranche.plafondCents);
    const assiette = plafond - plancher;
    if (assiette > 0) {
      const du = assiette * tranche.taux;
      impot += du;
      detail.push({
        deCents: plancher,
        aCents: plafond,
        taux: tranche.taux,
        impotCents: Math.round(du),
      });
    }
    plancher = tranche.plafondCents;
    if (!Number.isFinite(plancher)) break;
  }

  return { impotCents: Math.round(impot), detail };
}

/**
 * Taux marginal : le taux qui frappera l'euro suivant.
 * C'est le chiffre qui change les décisions (doc 06 § 3), affiché en permanence
 * dans le module fiscalité.
 */
export function tauxMarginal(baseCents: number, tranches: readonly TrancheBareme[]): number {
  for (const tranche of tranches) {
    if (baseCents < tranche.plafondCents) return tranche.taux;
  }
  const derniere = tranches[tranches.length - 1];
  return derniere ? derniere.taux : 0;
}
