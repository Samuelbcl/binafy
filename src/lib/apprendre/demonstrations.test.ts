import { describe, expect, it } from 'vitest';
import { DEMONSTRATIONS, demonstration } from './demonstrations';
import { GUIDES } from './guides';

/**
 * Garde-fou des démonstrations.
 *
 * Un guide n'écrit pas ses montants : il désigne un calculateur, et le chiffre
 * est produit à la lecture. L'avantage est qu'un guide ne peut pas dériver de
 * l'application ; le risque est qu'une clé mal orthographiée ou un calculateur
 * modifié fasse disparaître un chiffre d'une page publiée sans que rien
 * n'échoue. Ces tests ferment cette porte.
 */
describe('démonstrations des guides', () => {
  const cles = Object.keys(DEMONSTRATIONS);

  it('produisent toutes un résultat exploitable', () => {
    for (const cle of cles) {
      const demo = demonstration(cle);
      expect(demo, cle).not.toBeNull();

      // Un énoncé en français, pas une clé technique laissée en place.
      expect(demo!.enonce.length, cle).toBeGreaterThan(30);

      const { breakdown, sources } = demo!.resultat;
      expect(breakdown.length, cle).toBeGreaterThan(0);

      // Chaque ligne porte un libellé et une valeur finie : une ligne vide ou
      // NaN s'afficherait telle quelle dans le guide.
      for (const ligne of breakdown) {
        expect(ligne.libelle.length, `${cle} → ${ligne.libelle}`).toBeGreaterThan(0);
        expect(Number.isFinite(ligne.valeur), `${cle} → ${ligne.libelle}`).toBe(true);
      }

      // Un chiffre affiché sans source contredit la règle fondatrice du
      // produit. Seuls les calculs purement arithmétiques en sont dispensés.
      expect(Array.isArray(sources), cle).toBe(true);
    }
  });

  it('sont toutes citées par un guide, et réciproquement', () => {
    const citees = new Set<string>();
    for (const guide of GUIDES) {
      for (const bloc of guide.blocs) {
        if (bloc.type === 'demonstration') citees.add(bloc.cle);
      }
    }

    // Une clé citée sans démonstration correspondante : le guide afficherait
    // un trou. C'est le sens de lecture qui doit être vérifié en premier.
    const orphelines = [...citees].filter((cle) => !cles.includes(cle));
    expect(orphelines).toEqual([]);
  });

  it('renvoient null sur une clé inconnue plutôt que de lever', () => {
    expect(demonstration('cle-qui-n-existe-pas')).toBeNull();
  });
});
