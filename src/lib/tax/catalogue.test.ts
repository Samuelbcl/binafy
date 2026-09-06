import { describe, expect, it } from 'vitest';
import {
  PARAMETRES_2026,
  parametresHypothese,
  parametresNonVerifies,
  TAX_PARAMS_2026,
} from './parametres';

/**
 * Garde-fou du catalogue fiscal.
 *
 * La règle du projet est « on ne met rien de faux ». Une règle qui ne repose
 * que sur la discipline finit par céder : ces tests la rendent mécanique.
 *
 * Ils échouent quand une valeur non vérifiée entre dans le catalogue sans
 * passer par la liste connue — ce qui force à la vérifier, ou à assumer
 * explicitement qu'on l'ajoute en dette.
 */

/**
 * Les règles légales encore à confirmer, nommées une par une.
 *
 * Cette liste ne doit que **rétrécir**. Ajouter une clé ici est une décision,
 * pas un accident : elle doit s'accompagner d'une ligne dans
 * `docs/11-parametres-a-verifier.md` et d'un passage par l'agent
 * `verificateur-fiscal`.
 */
const DETTE_CONNUE = new Set([
  'notaire.achat.tranche_4.plafond',
  'notaire.achat.tranche_4.taux',
  'notaire.achat.tranche_5.plafond',
  'notaire.achat.tranche_5.taux',
  'notaire.achat.tranche_6.plafond',
  'notaire.achat.tranche_6.taux',
  'notaire.achat.partie_fixe',
  'notaire.achat.reduction_jbis',
  'credit.droit_hypotheque',
  'credit.frais_acte_forfait',
  'independant.cout_bce',
  'independant.cout_activation_tva',
]);

describe('catalogue fiscal — garde-fou', () => {
  it('n’accepte aucune valeur non vérifiée hors de la dette connue', () => {
    const inattendus = parametresNonVerifies()
      .map((p) => p.cle)
      .filter((cle) => !DETTE_CONNUE.has(cle));

    // Si ce test échoue, c'est qu'une valeur non confirmée vient d'entrer.
    // Fais-la vérifier par l'agent `verificateur-fiscal` plutôt que d'ajouter
    // sa clé ici par réflexe.
    expect(inattendus).toEqual([]);
  });

  it('ne laisse pas la dette grossir', () => {
    expect(parametresNonVerifies().length).toBeLessThanOrEqual(DETTE_CONNUE.size);
  });

  it('exige une source et une date sur chaque paramètre', () => {
    const sansSource = PARAMETRES_2026.filter((p) => !p.sourceUrl?.startsWith('http'));
    const sansDate = PARAMETRES_2026.filter((p) => !/^\d{4}-\d{2}-\d{2}$/.test(p.verifieLe));

    expect(sansSource.map((p) => p.cle)).toEqual([]);
    expect(sansDate.map((p) => p.cle)).toEqual([]);
  });

  it('n’a aucune clé en double pour une même région', () => {
    const vues = new Set<string>();
    const doublons: string[] = [];

    for (const p of PARAMETRES_2026) {
      const identite = `${p.cle}|${p.region ?? 'federal'}`;
      if (vues.has(identite)) doublons.push(identite);
      vues.add(identite);
    }

    // Un doublon rendrait `getParam` dépendant de l'ordre de déclaration.
    expect(doublons).toEqual([]);
  });

  it('ne mélange pas les hypothèses et les règles légales', () => {
    // Une valeur ne peut pas être à la fois une hypothèse de marché et une
    // règle en attente de confirmation : les deux appellent des suites
    // différentes, et l'interface ne les présente pas pareil.
    const confus = PARAMETRES_2026.filter((p) => p.hypothese && !p.verifie);
    expect(confus.map((p) => p.cle)).toEqual([]);
  });

  it('déclare une unité cohérente avec la valeur', () => {
    const suspects = PARAMETRES_2026.filter((p) => {
      if (p.unite === 'pourcent') return p.valeur < 0 || p.valeur > 100;
      if (p.unite === 'annees') return !Number.isInteger(p.valeur) || p.valeur < 0;
      if (p.unite === 'eur') return p.valeur < 0;
      return false;
    });

    expect(suspects.map((p) => `${p.cle}=${p.valeur}${p.unite}`)).toEqual([]);
  });

  it('porte toutes ses valeurs sur la même année', () => {
    const annees = new Set(PARAMETRES_2026.map((p) => p.annee));
    expect([...annees]).toEqual([TAX_PARAMS_2026.annee]);
  });

  it('assume ses hypothèses plutôt que de les compter comme dette', () => {
    const hypotheses = parametresHypothese();
    // Elles existent, sont vérifiées, et sortent du compteur à confirmer.
    expect(hypotheses.length).toBeGreaterThan(0);
    expect(hypotheses.every((p) => p.verifie)).toBe(true);
    expect(parametresNonVerifies().some((p) => p.hypothese)).toBe(false);
  });
});
