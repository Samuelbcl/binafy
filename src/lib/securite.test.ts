import { beforeEach, describe, expect, it } from 'vitest';
import {
  construireCSP,
  consommer,
  identifierAppelant,
  reinitialiserLimites,
} from './securite';

describe('limitation de débit', () => {
  beforeEach(() => reinitialiserLimites());

  it('autorise jusqu’à la limite puis refuse', () => {
    for (let i = 0; i < 3; i++) {
      expect(consommer('a', 3, 60).autorise).toBe(true);
    }
    expect(consommer('a', 3, 60).autorise).toBe(false);
  });

  it('décompte ce qui reste', () => {
    expect(consommer('b', 3, 60).restant).toBe(2);
    expect(consommer('b', 3, 60).restant).toBe(1);
    expect(consommer('b', 3, 60).restant).toBe(0);
  });

  it('sépare les appelants', () => {
    consommer('ip1', 1, 60);
    expect(consommer('ip1', 1, 60).autorise).toBe(false);
    // Un autre appelant ne doit pas être bloqué par le premier.
    expect(consommer('ip2', 1, 60).autorise).toBe(true);
  });

  it('rouvre après la fenêtre', () => {
    const t0 = 1_000_000;
    consommer('c', 1, 60, t0);
    expect(consommer('c', 1, 60, t0 + 30_000).autorise).toBe(false);
    expect(consommer('c', 1, 60, t0 + 61_000).autorise).toBe(true);
  });

  it('indique dans combien de temps réessayer', () => {
    const t0 = 1_000_000;
    consommer('d', 1, 60, t0);
    const refus = consommer('d', 1, 60, t0 + 10_000);
    expect(refus.autorise).toBe(false);
    expect(refus.reessayerDans).toBe(50);
  });
});

describe('identification de l’appelant', () => {
  it('prend la première adresse de x-forwarded-for', () => {
    const entetes = new Headers({ 'x-forwarded-for': '203.0.113.5, 70.41.3.18' });
    expect(identifierAppelant(entetes)).toBe('203.0.113.5');
  });

  it('se rabat sur x-real-ip', () => {
    expect(identifierAppelant(new Headers({ 'x-real-ip': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('ne plante pas sans en-tête', () => {
    expect(identifierAppelant(new Headers())).toBe('inconnu');
  });
});

describe('politique de sécurité de contenu', () => {
  it('n’autorise aucune origine de script extérieure', () => {
    const csp = construireCSP(false);
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    // `unsafe-eval` ne doit jamais atteindre la production.
    expect(csp).not.toContain('unsafe-eval');
  });

  it('autorise unsafe-eval en développement, pour le rafraîchissement à chaud', () => {
    expect(construireCSP(true)).toContain('unsafe-eval');
  });

  it('interdit l’encadrement de la page et les objets', () => {
    const csp = construireCSP(false);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('limite les envois de formulaire à sa propre origine', () => {
    expect(construireCSP(false)).toContain("form-action 'self'");
  });

  it('n’ouvre les connexions que vers soi-même et Supabase', () => {
    const csp = construireCSP(false);
    const connect = csp.split('; ').find((d) => d.startsWith('connect-src'));
    expect(connect).toBeDefined();
    // Aucun joker : une exfiltration vers un domaine tiers reste bloquée.
    expect(connect).not.toContain('*');
  });
});
