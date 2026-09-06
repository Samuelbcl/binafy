import { describe, expect, it } from 'vitest';
import { z } from 'zod';

/**
 * Validation des variables d'environnement.
 *
 * Le module `env.ts` lit `process.env` au chargement et lève si la
 * configuration est invalide : on ne peut donc pas l'importer pour tester des
 * valeurs alternatives. On teste ici la règle elle-même, reproduite à
 * l'identique — c'est elle qui décide si l'application démarre.
 */

const urlOptionnelle = z
  .string()
  .transform((v) => {
    const t = v.trim();
    if (t === '' || /^https?:\/\//i.test(t)) return t;
    return `https://${t}`;
  })
  .refine((v) => v === '' || z.string().url().safeParse(v).success, {
    message: 'URL invalide — attendu par exemple https://nestor.be',
  })
  .optional();

const sansBarreFinale = (u: string) => u.replace(/\/+$/, '');

describe('URL du site', () => {
  it('complète un domaine sans protocole', () => {
    // C'est l'erreur la plus courante, et elle empêchait l'app de démarrer.
    expect(urlOptionnelle.parse('binafy.vercel.app')).toBe('https://binafy.vercel.app');
    expect(urlOptionnelle.parse('nestor.be')).toBe('https://nestor.be');
  });

  it('laisse intacte une URL déjà complète', () => {
    expect(urlOptionnelle.parse('https://binafy.vercel.app')).toBe('https://binafy.vercel.app');
    expect(urlOptionnelle.parse('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('tolère les espaces autour', () => {
    expect(urlOptionnelle.parse('  nestor.be  ')).toBe('https://nestor.be');
  });

  it('accepte une valeur vide, qui déclenche le repli local', () => {
    expect(urlOptionnelle.parse('')).toBe('');
    expect(urlOptionnelle.parse(undefined)).toBeUndefined();
  });

  it('refuse ce qui ne peut pas devenir une URL', () => {
    expect(urlOptionnelle.safeParse('pas une url du tout !!').success).toBe(false);
  });

  it('retire la barre oblique finale', () => {
    // Sans cela, les images de partage et le sitemap contiendraient des `//`.
    expect(sansBarreFinale('https://binafy.vercel.app/')).toBe('https://binafy.vercel.app');
    expect(sansBarreFinale('https://binafy.vercel.app///')).toBe('https://binafy.vercel.app');
    expect(sansBarreFinale('https://binafy.vercel.app')).toBe('https://binafy.vercel.app');
  });

  it('produit une base utilisable par metadataBase', () => {
    const url = sansBarreFinale(urlOptionnelle.parse('binafy.vercel.app') as string);
    // `new URL()` est ce que Next appelle : s'il lève, tout le site tombe.
    expect(() => new URL(url)).not.toThrow();
    expect(new URL('/api/og', url).href).toBe('https://binafy.vercel.app/api/og');
  });
});
