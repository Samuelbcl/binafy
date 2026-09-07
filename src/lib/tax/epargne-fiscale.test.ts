import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import { calculerEpargneLongTerme, calculerEpargnePension } from './epargne-fiscale';
import { TAX_PARAMS_2026 } from './parametres';

const P = TAX_PARAMS_2026;

describe('épargne-pension', () => {
  it('applique 30 % jusqu’au plafond bas', () => {
    const r = calculerEpargnePension({ versementCents: euros(1_050) }, P);
    expect(r.result.tauxReduction).toBeCloseTo(0.3, 10);
    expect(r.result.reductionCents).toBe(euros(315));
  });

  it('bascule à 25 % sur la totalité au-delà du plafond bas', () => {
    // Le piège : le taux réduit ne frappe pas le seul dépassement.
    const r = calculerEpargnePension({ versementCents: euros(1_350) }, P);
    expect(r.result.tauxReduction).toBeCloseTo(0.25, 10);
    expect(r.result.reductionCents).toBe(euros(337.5));
  });

  it('expose le calcul des deux plafonds sans en désigner un', () => {
    const r = calculerEpargnePension({ versementCents: euros(1_050) }, P);
    expect(r.result.comparaison.plafondBas.reductionCents).toBe(euros(315));
    expect(r.result.comparaison.plafondHaut.reductionCents).toBe(euros(337.5));

    // 300 € de plus versés ne rapportent que 22,50 € de réduction
    // supplémentaire : c'est le chiffre qui éclaire le choix.
    const ecartVerse = euros(1_350) - euros(1_050);
    const ecartReduction =
      r.result.comparaison.plafondHaut.reductionCents -
      r.result.comparaison.plafondBas.reductionCents;
    expect(ecartVerse).toBe(euros(300));
    expect(ecartReduction).toBe(euros(22.5));
  });

  it('n’accorde rien au-delà du plafond haut', () => {
    const r = calculerEpargnePension({ versementCents: euros(2_000) }, P);
    expect(r.result.versementRetenuCents).toBe(euros(1_350));
    expect(r.result.excedentCents).toBe(euros(650));
  });

  it('gère un versement nul', () => {
    const r = calculerEpargnePension({ versementCents: 0 }, P);
    expect(r.result.reductionCents).toBe(0);
  });

  it('ne recommande aucun montant', () => {
    const r = calculerEpargnePension({ versementCents: euros(1_050) }, P);
    const texte = r.hypotheses.join(' ').toLowerCase();
    expect(texte).toContain('n’en recommande aucune');
    expect(texte).not.toContain('tu devrais');
  });
});

describe('épargne à long terme', () => {
  it('calcule le plafond selon le barème sur les revenus', () => {
    // 15 % des premiers 2 040 € = 306 €, puis 6 % de 15 030 € = 901,80 €.
    // Le plafond dépend donc bien des revenus : 1 207,80 €, sous le plafond
    // absolu de 2 450 €.
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(17_070), versementCents: euros(3_000) },
      P,
    );
    expect(r.result.plafondSelonRevenusCents).toBe(euros(1_207.8));
    expect(r.result.plafondDisponibleCents).toBe(euros(1_207.8));
  });

  it('reproduit la formule à un terme des banques : 183,60 € + 6 % du revenu', () => {
    // 2 040 € × (15 % − 6 %) = 183,60 € : la constante que CBC publie.
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(30_000), versementCents: euros(500) },
      P,
    );
    expect(r.result.plafondSelonRevenusCents).toBe(euros(183.6 + 0.06 * 30_000));
  });

  it('borne au plafond absolu quel que soit le revenu', () => {
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(120_000), versementCents: euros(5_000) },
      P,
    );
    expect(r.result.plafondDisponibleCents).toBe(euros(2_450));
    expect(r.result.reductionCents).toBe(euros(735));
  });

  it('applique le taux dégressif au-delà du seuil', () => {
    // 306 € sur les premiers 2 040 €, puis 6 % de 7 960 € = 477,60 €.
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(10_000), versementCents: euros(2_000) },
      P,
    );
    expect(r.result.plafondSelonRevenusCents).toBe(euros(783.6));
    expect(r.result.versementRetenuCents).toBe(euros(783.6));
    expect(r.result.excedentCents).toBe(euros(1_216.4));
  });

  it('déduit ce que le crédit hypothécaire consomme du panier', () => {
    const sans = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(50_000), versementCents: euros(2_450) },
      P,
    );
    const avec = calculerEpargneLongTerme(
      {
        revenuNetImposableCents: euros(50_000),
        versementCents: euros(2_450),
        panierDejaConsommeCents: euros(1_800),
      },
      P,
    );

    expect(sans.result.plafondDisponibleCents).toBe(euros(2_450));
    expect(avec.result.plafondDisponibleCents).toBe(euros(650));
    expect(avec.result.reductionCents).toBeLessThan(sans.result.reductionCents);
  });

  it('ne descend pas sous zéro quand le crédit consomme tout', () => {
    const r = calculerEpargneLongTerme(
      {
        revenuNetImposableCents: euros(50_000),
        versementCents: euros(2_000),
        panierDejaConsommeCents: euros(5_000),
      },
      P,
    );
    expect(r.result.plafondDisponibleCents).toBe(0);
    expect(r.result.reductionCents).toBe(0);
  });

  it('signale que le barème du plafond n’est pas confirmé', () => {
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(50_000), versementCents: euros(2_450) },
      P,
    );
    expect(r.hypotheses.join(' ')).toContain('n’a pas été confirmé');
    // Le résultat doit porter la trace des paramètres incertains.
    expect(r.sources.some((s) => !s.verifie)).toBe(true);
  });

  it('rappelle la règle wallonne des crédits depuis 2025', () => {
    const r = calculerEpargneLongTerme(
      { revenuNetImposableCents: euros(50_000), versementCents: euros(2_450) },
      P,
    );
    expect(r.hypotheses.join(' ')).toContain('2025');
  });
});
