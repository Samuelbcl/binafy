import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import {
  echeanceDans,
  etatObjectif,
  mensualiser,
  moisJusqua,
  projeterObjectif,
} from './objectifs';

const AUJOURDHUI = new Date(Date.UTC(2026, 8, 7)); // 7 septembre 2026

describe('mensualiser', () => {
  it('ramène chaque rythme au mois', () => {
    expect(mensualiser(euros(100), 'mois')).toBe(euros(100));
    expect(mensualiser(euros(300), 'trimestre')).toBe(euros(100));
    expect(mensualiser(euros(1200), 'annee')).toBe(euros(100));
    // 52 semaines sur 12 mois : 25 € par semaine font 108,33 € par mois.
    expect(mensualiser(euros(25), 'semaine')).toBe(10833);
  });

  it('refuse un versement négatif', () => {
    expect(mensualiser(-500, 'mois')).toBe(0);
  });
});

describe('moisJusqua / echeanceDans', () => {
  it('compte les mois entiers jusqu’au mois de l’échéance', () => {
    expect(moisJusqua('2028-09-01', AUJOURDHUI)).toBe(24);
    expect(moisJusqua('2026-12-01', AUJOURDHUI)).toBe(3);
  });

  it('une échéance passée vaut zéro, pas un nombre négatif', () => {
    expect(moisJusqua('2025-01-01', AUJOURDHUI)).toBe(0);
  });

  it('les deux fonctions sont inverses l’une de l’autre', () => {
    const echeance = echeanceDans(24, AUJOURDHUI);
    expect(echeance).toBe('2028-09-01');
    expect(moisJusqua(echeance, AUJOURDHUI)).toBe(24);
  });
});

describe('projeterObjectif', () => {
  it('sans rendement, le projeté est ce qui est là plus les versements', () => {
    const p = projeterObjectif({
      atteintCents: euros(1000),
      cibleCents: euros(5000),
      contributionCents: euros(150),
      frequence: 'mois',
      horizonMois: 24,
    });
    expect(p.result.mensualiteCents).toBe(euros(150));
    expect(p.result.atteintAHorizonCents).toBe(euros(1000 + 150 * 24));
    expect(p.result.ecartAHorizonCents).toBe(euros(5000 - 4600));
    expect(p.result.moisPourAtteindre).toBe(Math.ceil(4000 / 150));
    expect(p.result.trajectoire).toHaveLength(25);
    expect(p.result.trajectoire[24]?.verseCents).toBe(euros(4600));
  });

  it('le rendement requis est nul quand le rythme suffit', () => {
    const p = projeterObjectif({
      atteintCents: 0,
      cibleCents: euros(2400),
      contributionCents: euros(100),
      frequence: 'mois',
      horizonMois: 24,
    });
    expect(p.result.rendementRequis).toBe(0);
  });

  it('le rendement requis comble exactement l’écart', () => {
    // 1 000 € aujourd'hui, rien de plus, 2 000 € dans 10 ans : il faut 7,18 %.
    const p = projeterObjectif({
      atteintCents: euros(1000),
      cibleCents: euros(2000),
      contributionCents: null,
      frequence: null,
      horizonMois: 120,
    });
    const r = p.result.rendementRequis;
    expect(r).not.toBeNull();
    expect(r!).toBeCloseTo(2 ** (1 / 10) - 1, 4);
  });

  it('avec des versements, le rendement requis est cohérent avec la valeur finale', () => {
    const p = projeterObjectif({
      atteintCents: euros(500),
      cibleCents: euros(10000),
      contributionCents: euros(200),
      frequence: 'mois',
      horizonMois: 36,
    });
    const r = p.result.rendementRequis!;
    // Recalcul indépendant de la valeur finale au taux trouvé.
    const i = (1 + r) ** (1 / 12) - 1;
    const f = (1 + i) ** 36;
    const finale = euros(500) * f + euros(200) * ((f - 1) / i);
    expect(finale).toBeCloseTo(euros(10000), -1);
  });

  it('est nul quand aucun rendement raisonnable ne suffit', () => {
    const p = projeterObjectif({
      atteintCents: 0,
      cibleCents: euros(100000),
      contributionCents: null,
      frequence: null,
      horizonMois: 12,
    });
    expect(p.result.rendementRequis).toBeNull();
    expect(p.result.moisPourAtteindre).toBeNull();
  });

  it('est nul quand l’échéance est déjà là et la cible pas atteinte', () => {
    const p = projeterObjectif({
      atteintCents: euros(10),
      cibleCents: euros(100),
      contributionCents: euros(10),
      frequence: 'mois',
      horizonMois: 0,
    });
    expect(p.result.rendementRequis).toBeNull();
  });

  it('déclare ses hypothèses', () => {
    const p = projeterObjectif({
      atteintCents: 0,
      cibleCents: euros(1),
      contributionCents: null,
      frequence: null,
      horizonMois: 1,
    });
    expect(p.hypotheses.length).toBeGreaterThan(0);
    expect(p.breakdown.some((l) => l.total)).toBe(true);
  });
});

describe('etatObjectif', () => {
  it('atteint quand ce qui est là couvre la cible', () => {
    const e = etatObjectif(
      { atteintCents: euros(6000), cibleCents: euros(5000), contributionCents: null, frequence: null, echeance: null },
      AUJOURDHUI,
    );
    expect(e.etat).toBe('atteint');
  });

  it('en route quand le rythme tient l’échéance', () => {
    const e = etatObjectif(
      {
        atteintCents: euros(1000),
        cibleCents: euros(3400),
        contributionCents: euros(100),
        frequence: 'mois',
        echeance: '2028-09-01',
      },
      AUJOURDHUI,
    );
    expect(e.etat).toBe('en_route');
    expect(e.moisRestants).toBe(24);
  });

  it('en retard quand le rythme ne tient pas l’échéance, avec le manque mensuel', () => {
    const e = etatObjectif(
      {
        atteintCents: 0,
        cibleCents: euros(4800),
        contributionCents: euros(100),
        frequence: 'mois',
        echeance: '2028-09-01',
      },
      AUJOURDHUI,
    );
    expect(e.etat).toBe('en_retard');
    // Il faudrait 200 €/mois sur 24 mois ; il en manque 100.
    expect(e.manqueMensuelCents).toBe(euros(100));
  });

  it('sans rythme, dit ce qu’il faudrait par mois pour tenir l’échéance', () => {
    const e = etatObjectif(
      { atteintCents: 0, cibleCents: euros(2400), contributionCents: null, frequence: null, echeance: '2028-09-01' },
      AUJOURDHUI,
    );
    expect(e.etat).toBe('sans_rythme');
    expect(e.moisRestants).toBeNull();
    expect(e.manqueMensuelCents).toBe(euros(100));
  });
});
