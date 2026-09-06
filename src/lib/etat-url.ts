/**
 * Lecture des paramètres d'URL.
 *
 * Ce module n'est **pas** marqué `'use client'`, et c'est essentiel : ces
 * fonctions sont appelées depuis les Server Components pour produire les
 * valeurs initiales des simulateurs. Une directive `'use client'` en tête de
 * fichier s'applique à toutes ses exports — le hook vit donc à part, dans
 * `use-etat-url.ts`.
 */

/** Lit un nombre depuis les paramètres d'URL, avec repli sur une valeur par défaut. */
export function nombreDepuisUrl(
  params: Record<string, string | string[] | undefined>,
  cle: string,
  defaut: number,
): number {
  const brut = params[cle];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  // Une valeur absente ou vide retombe sur le défaut : `Number('')` vaut zéro,
  // ce qui afficherait un patrimoine nul sur une URL du type `?prix=`.
  if (valeur === undefined || valeur.trim() === '') return defaut;

  // La virgule décimale est acceptée : c'est ce qu'un utilisateur belge tape.
  const nombre = Number(valeur.replace(',', '.'));
  return Number.isFinite(nombre) ? nombre : defaut;
}

/** Lit un booléen depuis les paramètres d'URL. `'0'` et `'false'` valent faux. */
export function booleenDepuisUrl(
  params: Record<string, string | string[] | undefined>,
  cle: string,
  defaut: boolean,
): boolean {
  const brut = params[cle];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  if (valeur === undefined) return defaut;
  return valeur !== '0' && valeur !== 'false';
}

/** Lit une valeur contrainte à un ensemble, avec repli. */
export function choixDepuisUrl<T extends string>(
  params: Record<string, string | string[] | undefined>,
  cle: string,
  autorises: readonly T[],
  defaut: T,
): T {
  const brut = params[cle];
  const valeur = Array.isArray(brut) ? brut[0] : brut;
  return autorises.includes(valeur as T) ? (valeur as T) : defaut;
}
