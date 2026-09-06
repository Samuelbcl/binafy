import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import {
  calculerBaseImposableImmobiliere,
  calculerImpotRevenusLocatifs,
  estimerPrecompteImmobilier,
} from './immobilier';
import {
  calculerCotisationsSociales,
  calculerCoutDemarrage,
  simulerIndependant,
} from './independant';
import { calculerImpotRevenuComplementaire, calculerIPP, tauxMarginalIPP } from './ipp';
import { TAX_PARAMS_2026 } from './parametres';
import { appliquerBaremeProgressif, getParam, ParametreFiscalManquantError, tauxMarginal } from './types';

const P = TAX_PARAMS_2026;

describe('barème progressif', () => {
  const tranches = [
    { plafondCents: euros(10_000), taux: 0.25 },
    { plafondCents: euros(20_000), taux: 0.4 },
    { plafondCents: Number.POSITIVE_INFINITY, taux: 0.5 },
  ];

  it('n’applique le taux supérieur qu’à la fraction concernée', () => {
    const r = appliquerBaremeProgressif(euros(15_000), tranches);
    // 10 000 × 25 % + 5 000 × 40 %
    expect(r.impotCents).toBe(euros(4_500));
    expect(r.detail).toHaveLength(2);
  });

  it('gère un revenu nul', () => {
    expect(appliquerBaremeProgressif(0, tranches).impotCents).toBe(0);
  });

  it('traverse toutes les tranches sur un très haut revenu', () => {
    const r = appliquerBaremeProgressif(euros(100_000), tranches);
    // 2 500 + 4 000 + 80 000 × 50 %
    expect(r.impotCents).toBe(euros(46_500));
  });

  it('donne le taux marginal de la tranche atteinte', () => {
    expect(tauxMarginal(euros(5_000), tranches)).toBe(0.25);
    expect(tauxMarginal(euros(15_000), tranches)).toBe(0.4);
    expect(tauxMarginal(euros(500_000), tranches)).toBe(0.5);
  });

  it('renvoie zéro sur un barème vide', () => {
    expect(tauxMarginal(euros(1_000), [])).toBe(0);
  });
});

describe('paramètres fiscaux — on refuse d’inventer une valeur', () => {
  it('lève une erreur explicite quand un paramètre manque', () => {
    expect(() => getParam(P, 'parametre.inexistant')).toThrow(ParametreFiscalManquantError);
    expect(() => getParam(P, 'parametre.inexistant')).toThrow(/ne le code pas en dur/);
  });

  it('préfère la valeur régionale à la valeur fédérale', () => {
    const wallonie = getParam(P, 'droits_enregistrement.propre_unique', 'wallonie');
    const flandre = getParam(P, 'droits_enregistrement.propre_unique', 'flandre');
    expect(wallonie.valeur).toBe(3);
    expect(flandre.valeur).toBe(2);
  });

  it('retombe sur la valeur fédérale quand il n’y a pas de valeur régionale', () => {
    const p = getParam(P, 'precompte_mobilier.taux', 'wallonie');
    expect(p.region).toBeNull();
    expect(p.valeur).toBe(30);
  });
});

describe('IPP', () => {
  it('calcule un impôt cohérent sur un revenu de salarié moyen', () => {
    const r = calculerIPP({ revenuImposableCents: euros(35_000) }, P);
    expect(r.result.totalCents).toBeGreaterThan(0);
    expect(r.result.totalCents).toBeLessThan(euros(35_000));
    expect(r.result.netCents).toBe(euros(35_000) - r.result.totalCents);
  });

  it('expose le taux marginal, additionnels communaux compris', () => {
    const r = calculerIPP({ revenuImposableCents: euros(35_000) }, P);
    // 35 000 tombe dans la tranche à 45 %, majorée de 7 % d'additionnels.
    expect(r.result.tauxMarginalFederal).toBe(0.45);
    expect(r.result.tauxMarginal).toBeCloseTo(0.45 * 1.07, 10);
  });

  it('donne un taux moyen toujours inférieur au taux marginal', () => {
    const r = calculerIPP({ revenuImposableCents: euros(35_000) }, P);
    expect(r.result.tauxMoyen).toBeLessThan(r.result.tauxMarginal);
  });

  it('applique la quotité exemptée et sait la désactiver', () => {
    const avec = calculerIPP({ revenuImposableCents: euros(35_000) }, P);
    const sans = calculerIPP(
      { revenuImposableCents: euros(35_000), appliquerQuotiteExemptee: false },
      P,
    );
    expect(avec.result.reductionQuotiteCents).toBeGreaterThan(0);
    expect(sans.result.reductionQuotiteCents).toBe(0);
    expect(avec.result.totalCents).toBeLessThan(sans.result.totalCents);
  });

  it('accepte un taux d’additionnels communaux personnalisé', () => {
    const moyenne = calculerIPP({ revenuImposableCents: euros(35_000) }, P);
    const liege = calculerIPP(
      { revenuImposableCents: euros(35_000), additionnelsCommunauxPourcent: 8.8 },
      P,
    );
    expect(liege.result.impotCommunalCents).toBeGreaterThan(moyenne.result.impotCommunalCents);
  });

  it('ne produit pas d’impôt négatif sur un revenu nul', () => {
    const r = calculerIPP({ revenuImposableCents: 0 }, P);
    expect(r.result.totalCents).toBe(0);
    expect(r.result.tauxMoyen).toBe(0);
  });

  it('traite un revenu négatif comme nul', () => {
    const r = calculerIPP({ revenuImposableCents: euros(-1_000) }, P);
    expect(r.result.totalCents).toBe(0);
  });

  it('chiffre ce que rapporte réellement un revenu complémentaire', () => {
    const r = calculerImpotRevenuComplementaire(
      { revenuPrincipalCents: euros(35_000), revenuComplementaireCents: euros(5_000) },
      P,
    );
    // Taxé au marginal 45 % + 7 % d'additionnels ≈ 48,15 %
    expect(r.result.tauxEffectif).toBeCloseTo(0.4815, 3);
    expect(r.result.netRestantCents).toBeLessThan(euros(2_700));
  });

  it('renvoie un taux effectif nul si le complément est nul', () => {
    const r = calculerImpotRevenuComplementaire(
      { revenuPrincipalCents: euros(35_000), revenuComplementaireCents: 0 },
      P,
    );
    expect(r.result.tauxEffectif).toBe(0);
  });

  it('expose un raccourci vers le taux marginal seul', () => {
    expect(tauxMarginalIPP(euros(35_000), P)).toBeCloseTo(0.45 * 1.07, 10);
    expect(tauxMarginalIPP(euros(12_000), P, 0)).toBe(0.25);
  });
});

describe('revenus immobiliers — la mécanique belge', () => {
  it('exonère l’habitation propre', () => {
    const r = calculerBaseImposableImmobiliere(
      { revenuCadastralCents: euros(1_200), usage: 'propre' },
      P,
    );
    expect(r.result.baseImposableCents).toBe(0);
    expect(r.result.regime).toBe('exonere');
  });

  it('taxe le RC indexé majoré de 40 %, pas les loyers', () => {
    const r = calculerBaseImposableImmobiliere(
      { revenuCadastralCents: euros(1_000), usage: 'locatif_prive', loyerAnnuelCents: euros(9_600) },
      P,
    );
    // 1 000 × 2,30 = 2 300 puis × 1,40 = 3 220
    expect(r.result.rcIndexeCents).toBe(euros(2_300));
    expect(r.result.baseImposableCents).toBe(euros(3_220));
    expect(r.result.regime).toBe('rc_majore');
  });

  it('base l’imposition sur le loyer réel en usage professionnel', () => {
    const r = calculerBaseImposableImmobiliere(
      { revenuCadastralCents: euros(1_000), usage: 'locatif_pro', loyerAnnuelCents: euros(20_000) },
      P,
    );
    // 20 000 − 40 % de forfait = 12 000, bien au-dessus du plancher du RC majoré.
    expect(r.result.baseImposableCents).toBe(euros(12_000));
    expect(r.result.regime).toBe('loyer_reel');
  });

  it('en usage professionnel, ne descend jamais sous le RC indexé majoré', () => {
    const r = calculerBaseImposableImmobiliere(
      { revenuCadastralCents: euros(1_000), usage: 'locatif_pro', loyerAnnuelCents: euros(1_000) },
      P,
    );
    expect(r.result.baseImposableCents).toBe(euros(3_220));
  });

  it('applique la quote-part de détention', () => {
    const moitie = calculerBaseImposableImmobiliere(
      {
        revenuCadastralCents: euros(1_000),
        usage: 'locatif_prive',
        quotePartPourcent: 50,
      },
      P,
    );
    expect(moitie.result.baseImposableCents).toBe(euros(1_610));
  });

  it('montre que le taux effectif sur le loyer est bien plus bas que le taux marginal', () => {
    const r = calculerImpotRevenusLocatifs(
      {
        revenuCadastralCents: euros(1_000),
        usage: 'locatif_prive',
        loyerAnnuelCents: euros(9_600),
        tauxMarginal: 0.5,
      },
      P,
    );
    // 3 220 × 50 % = 1 610 d'impôt sur 9 600 € de loyer, soit ~16,8 %.
    expect(r.result.impotAnnuelCents).toBe(euros(1_610));
    expect(r.result.tauxEffectifSurLoyer).toBeCloseTo(0.1677, 3);
    expect(r.result.tauxEffectifSurLoyer).toBeLessThan(0.5);
  });

  it('estime le précompte immobilier et rappelle de saisir le montant réel', () => {
    const r = estimerPrecompteImmobilier(
      { revenuCadastralCents: euros(1_000), tauxGlobalPourcent: 40 },
      P,
    );
    expect(r.result.precompteAnnuelCents).toBe(euros(920));
    expect(r.hypotheses.join(' ')).toContain('avertissement-extrait de rôle');
  });
});

describe('indépendant complémentaire', () => {
  it('n’exige aucune cotisation sous le seuil', () => {
    const r = calculerCotisationsSociales(
      { revenuNetImposableCents: euros(1_500), statut: 'complementaire' },
      P,
    );
    expect(r.result.sousLeSeuil).toBe(true);
    expect(r.result.totalCents).toBe(0);
    expect(r.result.margeAvantSeuilCents).toBe(euros(422.16));
  });

  it('déclenche les cotisations sur la totalité du revenu au-delà du seuil', () => {
    const r = calculerCotisationsSociales(
      { revenuNetImposableCents: euros(2_000), statut: 'complementaire' },
      P,
    );
    expect(r.result.sousLeSeuil).toBe(false);
    expect(r.result.cotisationsCents).toBe(euros(410)); // 2 000 × 20,5 %
    expect(r.result.fraisGestionCents).toBe(euros(16.4)); // 410 × 4 %
  });

  it('prévient que le seuil frappe la totalité, pas le dépassement', () => {
    const r = calculerCotisationsSociales(
      { revenuNetImposableCents: euros(2_000), statut: 'complementaire' },
      P,
    );
    expect(r.breakdown.map((l) => l.precision).join(' ')).toContain('sur la totalité du revenu');
  });

  it('ne connaît pas de seuil en statut principal', () => {
    const r = calculerCotisationsSociales(
      { revenuNetImposableCents: euros(1_500), statut: 'principal' },
      P,
    );
    expect(r.result.sousLeSeuil).toBe(false);
    expect(r.result.cotisationsCents).toBeGreaterThan(0);
  });

  it('simule ce qui reste réellement en poche', () => {
    const r = simulerIndependant(
      {
        chiffreAffairesCents: euros(12_000),
        chargesCents: euros(2_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    expect(r.result.revenuNetImposableCents).toBe(euros(10_000));
    expect(r.result.cotisationsCents).toBeGreaterThan(0);
    // Cotisations puis impôt au marginal : il reste bien moins que la moitié du CA.
    expect(r.result.tauxConservation).toBeLessThan(0.45);
    expect(r.result.netEnPocheCents).toBeLessThan(euros(5_000));
  });

  it('déduit les cotisations de la base imposable', () => {
    const r = simulerIndependant(
      {
        chiffreAffairesCents: euros(12_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    expect(r.result.baseImposableCents).toBe(
      r.result.revenuNetImposableCents - r.result.cotisationsCents,
    );
  });

  it('alerte avant le dépassement de la franchise TVA', () => {
    const sous = simulerIndependant(
      {
        chiffreAffairesCents: euros(15_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    const proche = simulerIndependant(
      {
        chiffreAffairesCents: euros(21_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    expect(sous.result.franchiseTVA.depassementProche).toBe(false);
    expect(proche.result.franchiseTVA.depassementProche).toBe(true);
    expect(proche.result.franchiseTVA.applicable).toBe(true);
    expect(proche.result.franchiseTVA.margeCents).toBe(euros(4_000));
  });

  it('signale la sortie de la franchise TVA', () => {
    const r = simulerIndependant(
      {
        chiffreAffairesCents: euros(30_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    expect(r.result.franchiseTVA.applicable).toBe(false);
    expect(r.result.franchiseTVA.margeCents).toBeLessThan(0);
  });

  it('propose une provision mensuelle à mettre de côté', () => {
    const r = simulerIndependant(
      {
        chiffreAffairesCents: euros(12_000),
        statut: 'complementaire',
        revenuSalarieCents: euros(35_000),
      },
      P,
    );
    expect(r.result.provisionMensuelleCents).toBeGreaterThan(0);
    expect(r.breakdown.some((l) => l.libelle.includes('provisionner'))).toBe(true);
  });

  it('gère un chiffre d’affaires nul', () => {
    const r = simulerIndependant(
      { chiffreAffairesCents: 0, statut: 'complementaire', revenuSalarieCents: euros(35_000) },
      P,
    );
    expect(r.result.netEnPocheCents).toBe(0);
    expect(r.result.tauxConservation).toBe(0);
  });

  it('chiffre le coût de démarrage avec et sans TVA', () => {
    const avec = calculerCoutDemarrage({ avecTVA: true }, P);
    const sans = calculerCoutDemarrage({ avecTVA: false }, P);
    expect(avec.result.totalCents).toBe(euros(183.5));
    expect(sans.result.totalCents).toBe(euros(105.5));
  });
});
