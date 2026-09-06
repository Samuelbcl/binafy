/**
 * Honoraires notariaux — table de calibrage.
 *
 * **Pourquoi une table plutôt qu'un barème par tranches.**
 *
 * Le tarif notarial est fixé par l'arrêté royal du 16 décembre 1950, réformé au
 * 01/01/2023. Les tranches publiées ne reproduisent pas les montants que rend
 * le calculateur officiel de notaire.be, et les taux du barème réduit *Jbis* ne
 * sont publiés nulle part.
 *
 * Six mesures relevées sur ce calculateur le 06/09/2026 le montrent :
 *
 * | Prix      | Jbis       | J          | Écart    |
 * |-----------|------------|------------|----------|
 * | 150 000 € | 1 686,56 € | 1 907,88 € | 221,32 € |
 * | 280 000 € | 2 261,74 € | 2 538,24 € | 276,50 € |
 * | 450 000 € | 2 771,74 € | 2 878,24 € | 106,50 € |
 *
 * L'écart entre les deux barèmes n'est ni constant ni proportionnel, et la
 * pente du barème J devient inférieure à celle du Jbis au-delà de 280 000 € :
 * ce sont deux barèmes distincts, pas un barème et une remise. Aucune formule
 * simple ne les reproduit.
 *
 * On préfère donc une table de mesures, **exacte aux points relevés** et
 * interpolée entre eux, à une formule inventée qui serait fausse partout. Une
 * approximation dont on connaît les bornes vaut mieux qu'une fausse précision.
 *
 * **Pour améliorer la précision**, il suffit d'ajouter des mesures : refaire une
 * simulation sur notaire.be à un autre prix et insérer le point ci-dessous. Les
 * paliers actuels laissent une incertitude entre 150 000 € et 450 000 €, et
 * au-delà l'extrapolation prolonge la dernière pente connue.
 */

/** Un point mesuré : prix d'acquisition et honoraires hors TVA, en centimes. */
export type PointCalibrage = { prixCents: number; honorairesCents: number };

/** Barème J — cas général. */
export const CALIBRAGE_J: readonly PointCalibrage[] = [
  { prixCents: 15_000_000, honorairesCents: 190_788 },
  { prixCents: 28_000_000, honorairesCents: 253_824 },
  { prixCents: 45_000_000, honorairesCents: 287_824 },
];

/** Barème Jbis — habitation propre et unique. */
export const CALIBRAGE_JBIS: readonly PointCalibrage[] = [
  { prixCents: 15_000_000, honorairesCents: 168_656 },
  { prixCents: 28_000_000, honorairesCents: 226_174 },
  { prixCents: 45_000_000, honorairesCents: 277_174 },
];

/**
 * Barème de l'acte de crédit hypothécaire.
 * Deux points seulement : l'incertitude y est plus grande.
 */
export const CALIBRAGE_CREDIT: readonly PointCalibrage[] = [
  { prixCents: 15_000_000, honorairesCents: 61_224 },
  { prixCents: 25_200_000, honorairesCents: 79_509 },
];

/** Date des relevés, affichée sous les calculs qui en dépendent. */
export const CALIBRE_LE = '2026-09-06';

export type ResultatInterpolation = {
  honorairesCents: number;
  /**
   * `mesure` : le prix tombe sur un point relevé, la valeur est exacte.
   * `interpole` : entre deux points, marge d'erreur faible.
   * `extrapole` : hors de la plage mesurée, à prendre comme un ordre de grandeur.
   */
  fiabilite: 'mesure' | 'interpole' | 'extrapole';
};

/**
 * Interpole les honoraires depuis la table.
 *
 * Sous le premier point, on rapporte proportionnellement au prix plutôt que
 * d'extrapoler une pente : les honoraires d'un bien à 20 000 € ne sauraient
 * dépasser ceux d'un bien à 150 000 €.
 */
export function interpolerHonoraires(
  prixCents: number,
  table: readonly PointCalibrage[],
): ResultatInterpolation {
  const prix = Math.max(0, prixCents);
  if (prix === 0 || table.length === 0) {
    return { honorairesCents: 0, fiabilite: 'mesure' };
  }

  const points = [...table].sort((a, b) => a.prixCents - b.prixCents);

  const exact = points.find((p) => p.prixCents === prix);
  if (exact) return { honorairesCents: exact.honorairesCents, fiabilite: 'mesure' };

  const premier = points[0]!;
  const dernier = points[points.length - 1]!;

  if (prix < premier.prixCents) {
    // Proportionnel au prix : un barème dégressif ne peut pas rendre davantage
    // pour un bien moins cher.
    return {
      honorairesCents: Math.round((premier.honorairesCents * prix) / premier.prixCents),
      fiabilite: 'extrapole',
    };
  }

  if (prix > dernier.prixCents) {
    const avant = points[points.length - 2] ?? premier;
    const pente =
      (dernier.honorairesCents - avant.honorairesCents) / (dernier.prixCents - avant.prixCents);
    return {
      honorairesCents: Math.round(dernier.honorairesCents + (prix - dernier.prixCents) * pente),
      fiabilite: 'extrapole',
    };
  }

  // Entre deux mesures : interpolation linéaire.
  for (let i = 0; i < points.length - 1; i++) {
    const bas = points[i]!;
    const haut = points[i + 1]!;
    if (prix > bas.prixCents && prix < haut.prixCents) {
      const part = (prix - bas.prixCents) / (haut.prixCents - bas.prixCents);
      return {
        honorairesCents: Math.round(
          bas.honorairesCents + part * (haut.honorairesCents - bas.honorairesCents),
        ),
        fiabilite: 'interpole',
      };
    }
  }

  return { honorairesCents: dernier.honorairesCents, fiabilite: 'extrapole' };
}

/** Phrase à afficher sous un résultat, selon la fiabilité du point utilisé. */
export function mentionFiabilite(fiabilite: ResultatInterpolation['fiabilite']): string {
  switch (fiabilite) {
    case 'mesure':
      return `Montant relevé sur le calculateur officiel de notaire.be le ${CALIBRE_LE.split('-').reverse().join('/')}.`;
    case 'interpole':
      return 'Montant interpolé entre deux relevés du calculateur officiel de notaire.be : compte quelques euros d’écart.';
    case 'extrapole':
      return 'Prix hors de la plage mesurée (150 000 € à 450 000 €) : le montant des honoraires est un ordre de grandeur.';
  }
}
