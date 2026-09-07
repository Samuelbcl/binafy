/**
 * Dates d'objectif, en mots.
 *
 * Une échéance s'écrit « sept. 2028 », pas « 2028-09-01 » : personne ne vise
 * un premier du mois, on vise un mois. Tout passe par UTC pour que le serveur
 * et le navigateur, quel que soit leur fuseau, écrivent le même mois.
 */

const FORMAT_MOIS = new Intl.DateTimeFormat('fr-BE', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** « sept. 2028 » depuis `2028-09-01`. */
export function libelleMois(iso: string): string {
  return FORMAT_MOIS.format(new Date(`${iso.slice(0, 7)}-01T00:00:00Z`));
}

/** « sept. 2028 » pour le mois qui tombe dans `mois` mois. */
export function libelleDans(mois: number, aujourdhui: Date): string {
  const d = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth() + mois, 1));
  return FORMAT_MOIS.format(d);
}
