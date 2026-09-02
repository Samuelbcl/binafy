import { describe, expect, it } from 'vitest';
import {
  applyRate,
  euros,
  formatEUR,
  formatEURCompact,
  formatPercent,
  formatTaux,
  MASK,
  MINUS,
  NBSP,
  roundCents,
  sumCents,
  toEuros,
} from './money';

/** Rend les espaces insécables visibles quand un test échoue. */
const lisible = (s: string) => s.replaceAll(NBSP, '_').replaceAll(MINUS, '-');

describe('conversions', () => {
  it('convertit des euros en centimes sans erreur de flottant', () => {
    expect(euros(13656.48)).toBe(1365648);
    // 0.1 + 0.2 en flottant donne 0.30000000000000004 : l'arrondi doit tenir.
    expect(euros(0.1) + euros(0.2)).toBe(30);
    expect(euros(1234.565)).toBe(123457);
  });

  it('revient aux euros', () => {
    expect(toEuros(1365648)).toBe(13656.48);
  });

  it('somme sans dérive', () => {
    expect(sumCents([1, 2, 3])).toBe(6);
    expect(sumCents([])).toBe(0);
  });

  it('applique un taux et arrondit au centime', () => {
    expect(applyRate(10000, 0.3)).toBe(3000);
    expect(applyRate(3333, 0.3)).toBe(1000); // 999.9 → 1000
    expect(roundCents(1234.6)).toBe(1235);
  });
});

describe('formatEUR — format belge de la doc 05', () => {
  it('formate avec espace insécable et virgule décimale', () => {
    expect(formatEUR(1365648)).toBe(`13${NBSP}656,48${NBSP}€`);
    expect(lisible(formatEUR(1365648))).toBe('13_656,48_€');
  });

  it('groupe les milliers par tranches de trois', () => {
    expect(lisible(formatEUR(123456789))).toBe('1_234_567,89_€');
    expect(lisible(formatEUR(100000))).toBe('1_000,00_€');
    expect(lisible(formatEUR(99999))).toBe('999,99_€');
  });

  it('utilise le vrai signe moins U+2212, jamais un tiret ASCII', () => {
    const negatif = formatEUR(-32000);
    expect(negatif.startsWith(MINUS)).toBe(true);
    expect(negatif.includes('-')).toBe(false);
    expect(lisible(negatif)).toBe('-320,00_€');
  });

  it('signe les variations quand on le demande', () => {
    expect(lisible(formatEUR(124000, { sign: 'always' }))).toBe('+1_240,00_€');
    expect(lisible(formatEUR(-124000, { sign: 'always' }))).toBe('-1_240,00_€');
    expect(lisible(formatEUR(0, { sign: 'always' }))).toBe('+0,00_€');
  });

  it('sait masquer les décimales et le symbole', () => {
    expect(lisible(formatEUR(1365648, { decimals: 0 }))).toBe('13_656_€');
    expect(lisible(formatEUR(1365648, { symbol: false }))).toBe('13_656,48');
  });

  it('arrondit correctement à zéro décimale', () => {
    expect(lisible(formatEUR(150, { decimals: 0 }))).toBe('2_€');
    expect(lisible(formatEUR(149, { decimals: 0 }))).toBe('1_€');
  });

  it('applique le mode discrétion', () => {
    expect(formatEUR(1365648, { masked: true })).toBe(`${MASK}${NBSP}€`);
    expect(formatEUR(1365648, { masked: true, symbol: false })).toBe(MASK);
  });

  it('gère zéro', () => {
    expect(lisible(formatEUR(0))).toBe('0,00_€');
  });
});

describe('formatEURCompact — étiquettes de graphiques', () => {
  it('bascule en k€ à partir de 1 000 €', () => {
    expect(lisible(formatEURCompact(1365648))).toBe('13,7_k€');
    expect(lisible(formatEURCompact(100000))).toBe('1,0_k€');
  });

  it('bascule en M€ à partir de 1 000 000 €', () => {
    expect(lisible(formatEURCompact(120000000))).toBe('1,2_M€');
    expect(lisible(formatEURCompact(100000000))).toBe('1,0_M€');
  });

  it('bascule en Mrd€ à partir du milliard', () => {
    expect(lisible(formatEURCompact(250000000000))).toBe('2,5_Mrd€');
  });

  it('reste en euros pleins sous 1 000 €', () => {
    expect(lisible(formatEURCompact(99999))).toBe('1_000_€');
    expect(lisible(formatEURCompact(45000))).toBe('450_€');
  });

  it('conserve le signe moins et le masque', () => {
    expect(lisible(formatEURCompact(-1365648))).toBe('-13,7_k€');
    expect(formatEURCompact(1365648, true)).toBe(`${MASK}${NBSP}€`);
  });
});

describe('formatPercent — une décimale, jamais deux', () => {
  it('formate un ratio en pourcentage', () => {
    expect(lisible(formatPercent(0.052))).toBe('5,2_%');
    expect(lisible(formatPercent(0.3))).toBe('30,0_%');
  });

  it('signe et masque comme les montants', () => {
    expect(lisible(formatPercent(0.052, { sign: 'always' }))).toBe('+5,2_%');
    expect(lisible(formatPercent(-0.052))).toBe('-5,2_%');
    expect(formatPercent(0.052, { masked: true })).toBe(`${MASK}${NBSP}%`);
  });

  it('gère une division par zéro sans afficher NaN', () => {
    expect(formatPercent(Number.NaN)).toBe('—');
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('formate un taux déjà en pourcentage', () => {
    expect(lisible(formatTaux(12.5))).toBe('12,50_%');
    expect(lisible(formatTaux(3, 0))).toBe('3_%');
  });
});
