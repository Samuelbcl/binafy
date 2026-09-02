/**
 * Money — l'argent est en centimes, partout.
 *
 * Convention du projet (CLAUDE.md) : tout montant est un entier de centimes.
 * En base c'est un `bigint`, en TypeScript un `number` : un `number` JS est exact
 * jusqu'à 2^53, soit ~90 000 milliards d'euros en centimes. Aucun risque ici.
 *
 * Le formatage est écrit à la main plutôt que via `Intl.NumberFormat` :
 *  - l'ICU du serveur et celui du navigateur ne produisent pas toujours le même
 *    séparateur de milliers en fr-BE (U+00A0 vs U+202F), ce qui déclenche des
 *    erreurs d'hydratation React sur chaque montant affiché ;
 *  - la doc 05 impose un format précis, on le garantit au lieu de l'espérer.
 */

/** Un montant, en centimes. Toujours un entier. */
export type Cents = number;

/** Espace insécable — séparateur de milliers belge. */
export const NBSP = '\u00A0';
/** Vrai signe moins (U+2212), jamais un tiret ASCII. Exigence de la doc 05. */
export const MINUS = '\u2212';

/** Masque du mode discrétion. */
export const MASK = '••••';

export function euros(montant: number): Cents {
  return Math.round(montant * 100);
}

export function toEuros(cents: Cents): number {
  return cents / 100;
}

/** Arrondi comptable au centime. Les calculs intermédiaires restent en flottant. */
export function roundCents(valeur: number): Cents {
  return Math.round(valeur);
}

/** Somme sûre d'une liste de montants. */
export function sumCents(montants: readonly Cents[]): Cents {
  let total = 0;
  for (const m of montants) total += m;
  return Math.round(total);
}

/**
 * Applique un pourcentage à un montant en centimes.
 * `taux` est un ratio (0.30 pour 30 %), pas un pourcentage.
 */
export function applyRate(cents: Cents, taux: number): Cents {
  return Math.round(cents * taux);
}

function groupThousands(entier: string): string {
  let out = '';
  for (let i = 0; i < entier.length; i++) {
    if (i > 0 && (entier.length - i) % 3 === 0) out += NBSP;
    out += entier[i];
  }
  return out;
}

export type FormatEURConfig = {
  /** Nombre de décimales. Défaut 2. Mettre 0 pour les totaux du dashboard. */
  decimals?: number;
  /** `auto` : signe seulement si négatif. `always` : toujours (variations). */
  sign?: 'auto' | 'always';
  /** Afficher le symbole €. Défaut true. */
  symbol?: boolean;
  /** Mode discrétion : remplace la valeur par des points. */
  masked?: boolean;
};

/**
 * Format belge : `13 656,48 €` — espace insécable, virgule décimale,
 * espace insécable avant le symbole.
 */
export function formatEUR(cents: Cents, config: FormatEURConfig = {}): string {
  const { decimals = 2, sign = 'auto', symbol = true, masked = false } = config;
  if (masked) return symbol ? `${MASK}${NBSP}€` : MASK;

  const negatif = cents < 0;
  const facteur = 10 ** decimals;
  const absArrondi = Math.round(Math.abs(cents) / (100 / facteur)) / facteur;
  const [partEntiere = '0', partDecimale = ''] = absArrondi.toFixed(decimals).split('.');

  let out = groupThousands(partEntiere);
  if (decimals > 0) out += `,${partDecimale}`;

  const prefixe = negatif ? MINUS : sign === 'always' ? '+' : '';
  return symbol ? `${prefixe}${out}${NBSP}€` : `${prefixe}${out}`;
}

/**
 * Format compact pour les axes et étiquettes de graphiques : `13,7 k€`, `1,2 M€`.
 * En dessous de 1 000 €, on retombe sur le format normal sans décimales.
 */
export function formatEURCompact(cents: Cents, masked = false): string {
  if (masked) return `${MASK}${NBSP}€`;
  const abs = Math.abs(cents);
  const signe = cents < 0 ? MINUS : '';

  // Seuils exprimés en centimes : 1 k€ = 100 000 c, 1 M€ = 100 000 000 c.
  const MILLIARD = 100_000_000_000;
  const MILLION = 100_000_000;
  const MILLE = 100_000;

  if (abs >= MILLIARD) return `${signe}${formatNombre(abs / MILLIARD, 1)}${NBSP}Mrd€`;
  if (abs >= MILLION) return `${signe}${formatNombre(abs / MILLION, 1)}${NBSP}M€`;
  if (abs >= MILLE) return `${signe}${formatNombre(abs / MILLE, 1)}${NBSP}k€`;
  return formatEUR(cents, { decimals: 0 });
}

function formatNombre(valeur: number, decimals: number): string {
  const [entier = '0', dec = ''] = valeur.toFixed(decimals).split('.');
  const base = groupThousands(entier);
  return decimals > 0 ? `${base},${dec}` : base;
}

/**
 * Pourcentage. Une décimale, jamais deux (doc 05).
 * `ratio` est un ratio : 0.052 → `5,2 %`.
 */
export function formatPercent(
  ratio: number,
  config: { decimals?: number; sign?: 'auto' | 'always'; masked?: boolean } = {},
): string {
  const { decimals = 1, sign = 'auto', masked = false } = config;
  if (masked) return `${MASK}${NBSP}%`;
  if (!Number.isFinite(ratio)) return `—`;

  const pourcent = ratio * 100;
  const negatif = pourcent < 0;
  const prefixe = negatif ? MINUS : sign === 'always' ? '+' : '';
  return `${prefixe}${formatNombre(Math.abs(pourcent), decimals)}${NBSP}%`;
}

/** Un taux déjà exprimé en pourcentage (30 pour 30 %), tel que stocké en base. */
export function formatTaux(pourcent: number, decimals = 2): string {
  return `${formatNombre(pourcent, decimals)}${NBSP}%`;
}
