import { describe, expect, it } from 'vitest';
import { booleenDepuisUrl, choixDepuisUrl, nombreDepuisUrl } from './etat-url';

describe('lecture des paramètres d’URL', () => {
  it('lit un nombre', () => {
    expect(nombreDepuisUrl({ prix: '280000' }, 'prix', 0)).toBe(280_000);
  });

  it('accepte la virgule décimale, qui est ce qu’un Belge tape', () => {
    expect(nombreDepuisUrl({ taux: '3,5' }, 'taux', 0)).toBe(3.5);
  });

  it('se rabat sur la valeur par défaut si le paramètre est absent', () => {
    expect(nombreDepuisUrl({}, 'prix', 280_000)).toBe(280_000);
  });

  it('se rabat sur la valeur par défaut si le paramètre est illisible', () => {
    expect(nombreDepuisUrl({ prix: 'abc' }, 'prix', 280_000)).toBe(280_000);
    expect(nombreDepuisUrl({ prix: '' }, 'prix', 280_000)).toBe(280_000);
  });

  it('prend la première valeur d’un paramètre répété', () => {
    expect(nombreDepuisUrl({ prix: ['1000', '2000'] }, 'prix', 0)).toBe(1000);
  });

  it('lit un booléen', () => {
    expect(booleenDepuisUrl({ credit: '1' }, 'credit', false)).toBe(true);
    expect(booleenDepuisUrl({ credit: '0' }, 'credit', true)).toBe(false);
    expect(booleenDepuisUrl({ credit: 'false' }, 'credit', true)).toBe(false);
    expect(booleenDepuisUrl({}, 'credit', true)).toBe(true);
  });

  it('contraint un choix à l’ensemble autorisé', () => {
    const regions = ['wallonie', 'bruxelles', 'flandre'] as const;
    expect(choixDepuisUrl({ region: 'flandre' }, 'region', regions, 'wallonie')).toBe('flandre');
    // Une valeur inventée ne doit pas passer : elle ferait planter le calcul en aval.
    expect(choixDepuisUrl({ region: 'picardie' }, 'region', regions, 'wallonie')).toBe('wallonie');
    expect(choixDepuisUrl({}, 'region', regions, 'wallonie')).toBe('wallonie');
  });
});
