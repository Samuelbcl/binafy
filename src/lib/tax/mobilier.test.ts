import { getCents } from './types';
import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import { TAX_PARAMS_2026 } from './parametres';
import {
  calculerPrecompteDividendes,
  calculerPrecompteEpargneReglementee,
  calculerPrecompteInterets,
} from './precompte';
import {
  baseDeReference,
  calculerImpotLatent,
  calculerTaxePlusValues,
  calculerTaxeReynders,
  DATE_REFERENCE_PLUS_VALUES,
} from './plus-values';
import { calculerTOB, calculerTOBAllerRetour, determinerSupportTOB } from './tob';

const P = TAX_PARAMS_2026;

describe('TOB', () => {
  it('applique 0,12 % sur un ETF coté hors registre belge', () => {
    const r = calculerTOB({ montantCents: euros(10_000), support: 'actions_etrangeres' }, P);
    expect(r.result).toBe(euros(12));
  });

  it('applique 1,32 % sur un fonds capitalisant inscrit en Belgique', () => {
    const r = calculerTOB({ montantCents: euros(10_000), support: 'capitalisant_belge' }, P);
    expect(r.result).toBe(euros(132));
  });

  it('applique 0,35 % sur un distribuant inscrit en Belgique', () => {
    const r = calculerTOB({ montantCents: euros(10_000), support: 'distribuant_belge' }, P);
    expect(r.result).toBe(euros(35));
  });

  it('plafonne la taxe par opération', () => {
    // 2 000 000 € × 0,12 % = 2 400 €, ramenés au plafond de 1 300 €.
    const r = calculerTOB({ montantCents: euros(2_000_000), support: 'actions_etrangeres' }, P);
    expect(r.result).toBe(euros(1_300));
    expect(r.breakdown.some((l) => l.libelle.includes('Plafond'))).toBe(true);
  });

  it('multiplie par le nombre d’opérations sans mutualiser le plafond', () => {
    const r = calculerTOB(
      { montantCents: euros(2_000_000), support: 'actions_etrangeres', operations: 2 },
      P,
    );
    expect(r.result).toBe(euros(2_600));
  });

  it('compte la taxe deux fois sur un aller-retour', () => {
    const r = calculerTOBAllerRetour(
      {
        montantAchatCents: euros(10_000),
        montantVenteCents: euros(12_000),
        support: 'actions_etrangeres',
      },
      P,
    );
    expect(r.result).toBe(euros(12) + euros(14.4));
  });

  it('renvoie zéro sur un montant nul ou négatif', () => {
    expect(calculerTOB({ montantCents: 0, support: 'actions_etrangeres' }, P).result).toBe(0);
    expect(
      calculerTOB({ montantCents: euros(-500), support: 'actions_etrangeres' }, P).result,
    ).toBe(0);
  });

  it('signale que la TOB est parfois à déclarer soi-même', () => {
    const r = calculerTOB({ montantCents: euros(10_000), support: 'actions_etrangeres' }, P);
    expect(r.hypotheses.join(' ')).toContain('courtier étranger');
  });

  describe('détermination du support', () => {
    it('retient le taux capitalisant belge pour un fonds capitalisant inscrit en Belgique', () => {
      expect(determinerSupportTOB({ inscritEnBelgique: true, capitalisant: true })).toEqual({
        support: 'capitalisant_belge',
        certain: true,
      });
    });

    it('retient le taux distribuant belge pour un distribuant inscrit en Belgique', () => {
      expect(determinerSupportTOB({ inscritEnBelgique: true, capitalisant: false })).toEqual({
        support: 'distribuant_belge',
        certain: true,
      });
    });

    it('retombe sur le taux étranger et signale l’incertitude quand l’inscription est inconnue', () => {
      expect(determinerSupportTOB({ inscritEnBelgique: null, capitalisant: true })).toEqual({
        support: 'actions_etrangeres',
        certain: false,
      });
    });

    it('marque l’incertitude quand le caractère capitalisant est inconnu', () => {
      const r = determinerSupportTOB({ inscritEnBelgique: true, capitalisant: null });
      expect(r.certain).toBe(false);
    });
  });
});

describe('précompte mobilier sur dividendes', () => {
  it('applique 30 % au-delà de la tranche exonérée', () => {
    const r = calculerPrecompteDividendes({ dividendesBrutsCents: euros(1_833) }, P);
    // 1 833 − 833 exonérés = 1 000 taxables × 30 %
    expect(r.result.precompteDuCents).toBe(euros(300));
  });

  it('n’impose rien tant que le dividende reste sous la tranche exonérée', () => {
    const r = calculerPrecompteDividendes({ dividendesBrutsCents: euros(500) }, P);
    expect(r.result.precompteDuCents).toBe(0);
    expect(r.result.exonerationRestanteCents).toBe(euros(333));
  });

  it('chiffre ce qui est récupérable quand la banque belge a tout retenu', () => {
    // Cas très fréquent : la banque retient 30 % sur tout, l'exonération se réclame après.
    const r = calculerPrecompteDividendes(
      { dividendesBrutsCents: euros(1_000), precompteRetenuCents: euros(300) },
      P,
    );
    expect(r.result.recuperableCents).toBe(euros(249.9)); // 833 × 30 %
    expect(r.result.aDeclarerCents).toBe(0);
  });

  it('chiffre ce qui reste à déclarer chez un courtier étranger', () => {
    const r = calculerPrecompteDividendes(
      { dividendesBrutsCents: euros(2_000), precompteRetenuCents: 0 },
      P,
    );
    expect(r.result.aDeclarerCents).toBe(r.result.precompteDuCents);
    expect(r.result.recuperableCents).toBe(0);
  });

  it('tient compte de l’exonération déjà consommée ailleurs', () => {
    const r = calculerPrecompteDividendes(
      { dividendesBrutsCents: euros(1_000), exonerationDejaUtiliseeCents: euros(833) },
      P,
    );
    expect(r.result.precompteDuCents).toBe(euros(300));
    expect(r.result.exonerationRestanteCents).toBe(0);
  });

  it('gère zéro', () => {
    const r = calculerPrecompteDividendes({ dividendesBrutsCents: 0 }, P);
    expect(r.result.precompteDuCents).toBe(0);
    expect(r.result.netCents).toBe(0);
  });
});

describe('compte d’épargne réglementé', () => {
  it('exonère jusqu’au plafond puis applique le précompte réduit de 15 %', () => {
    const r = calculerPrecompteEpargneReglementee({ interetsBaseCents: euros(1_520) }, P);
    // 1 520 − 1 020 exonérés = 500 × 15 %
    expect(r.result.exonereCents).toBe(euros(1_020));
    expect(r.result.precompteCents).toBe(euros(75));
  });

  it('additionne le taux de base et la prime de fidélité', () => {
    const r = calculerPrecompteEpargneReglementee(
      { interetsBaseCents: euros(800), primeFideliteCents: euros(400) },
      P,
    );
    expect(r.result.interetsTotauxCents).toBe(euros(1_200));
    expect(r.result.taxableCents).toBe(euros(180));
  });

  it('rappelle qu’un retrait fait perdre la prime de fidélité', () => {
    const r = calculerPrecompteEpargneReglementee({ interetsBaseCents: euros(100) }, P);
    expect(r.hypotheses.join(' ')).toContain('retrait la fait perdre');
  });

  it('n’impose rien sous le plafond', () => {
    const r = calculerPrecompteEpargneReglementee({ interetsBaseCents: euros(300) }, P);
    expect(r.result.precompteCents).toBe(0);
    expect(r.result.exonerationRestanteCents).toBe(euros(720));
  });
});

describe('précompte sur intérêts non réglementés', () => {
  it('applique 30 % sans exonération', () => {
    const r = calculerPrecompteInterets({ interetsCents: euros(1_000) }, P);
    expect(r.result.precompteDuCents).toBe(euros(300));
    expect(r.result.netCents).toBe(euros(700));
  });

  it('déduit ce qui a déjà été retenu', () => {
    const r = calculerPrecompteInterets(
      { interetsCents: euros(1_000), precompteRetenuCents: euros(300) },
      P,
    );
    expect(r.result.aDeclarerCents).toBe(0);
  });
});

describe('taxe sur les plus-values 2026', () => {
  it('ignore tout report sur les revenus 2026 : il ne se constitue que cette année', () => {
    // La circulaire 2026/C/74 est explicite : le report ne peut être déterminé
    // et utilisé qu'à partir de l'exercice 2028, sur la base de l'exercice
    // 2027. En années de revenus : ce qu'on ne consomme pas en 2026 servira en
    // 2027. Le plafond du report vaut donc zéro cette année, et un report
    // fourni par erreur ne peut pas gonfler l'exonération.
    const r = calculerTaxePlusValues(
      { plusValueCents: euros(15_000), exonerationReporteeCents: euros(3_000) },
      P,
    );
    expect(r.result.reportRetenuCents).toBe(0);
    expect(r.result.exonereCents).toBe(euros(10_000));
    expect(r.result.taxeCents).toBe(euros(500));
    expect(r.breakdown.some((l) => l.libelle.startsWith('Exonération reportée'))).toBe(false);
  });

  it('plafonne le report au maximum légal de l’année', () => {
    // Le mécanisme lui-même reste en place : quand le plafond deviendra non nul,
    // un report excessif sera ramené à ce plafond plutôt qu'accepté tel quel.
    const r = calculerTaxePlusValues(
      { plusValueCents: euros(20_000), exonerationReporteeCents: euros(9_000) },
      P,
    );
    const plafond = getCents(P, 'plus_values.report_plafond');
    expect(r.result.reportRetenuCents).toBe(Math.min(euros(9_000), plafond));
    expect(r.result.exonereCents).toBe(euros(10_000) + plafond);
  });

  it('suppose un report nul quand rien n’est renseigné', () => {
    const r = calculerTaxePlusValues({ plusValueCents: euros(15_000) }, P);
    expect(r.result.reportRetenuCents).toBe(0);
    expect(r.result.exonereCents).toBe(euros(10_000));
    expect(r.hypotheses.join(' ')).toContain('report');
  });

  it('n’impose rien tant que l’exonération annuelle n’est pas dépassée', () => {
    const r = calculerTaxePlusValues({ plusValueCents: euros(8_000) }, P);
    expect(r.result.taxeCents).toBe(0);
    expect(r.result.exonerationRestanteCents).toBe(euros(2_000));
  });

  it('applique 10 % au-delà de l’exonération de 10 000 €', () => {
    const r = calculerTaxePlusValues({ plusValueCents: euros(15_000) }, P);
    expect(r.result.taxableCents).toBe(euros(5_000));
    expect(r.result.taxeCents).toBe(euros(500));
  });

  it('tient compte de l’exonération déjà consommée dans l’année', () => {
    const r = calculerTaxePlusValues(
      { plusValueCents: euros(5_000), exonerationDejaUtiliseeCents: euros(8_000) },
      P,
    );
    expect(r.result.exonereCents).toBe(euros(2_000));
    expect(r.result.taxeCents).toBe(euros(300));
  });

  it('ignore une plus-value négative plutôt que de produire un crédit d’impôt', () => {
    const r = calculerTaxePlusValues({ plusValueCents: euros(-5_000) }, P);
    expect(r.result.taxeCents).toBe(0);
  });

  it('signale que le report de pertes n’est pas modélisé', () => {
    const r = calculerTaxePlusValues({ plusValueCents: euros(15_000) }, P);
    expect(r.hypotheses.join(' ')).toContain('report de pertes');
  });
});

describe('base de référence — la règle du 31/12/2025', () => {
  it('retient la valeur au 31/12/2025 pour un actif acquis avant 2026', () => {
    const r = baseDeReference({
      dateAcquisition: '2020-06-15',
      prixAcquisitionCents: euros(5_000),
      valeurReference2025Cents: euros(9_000),
    });
    expect(r.origine).toBe('valeur_2025');
    expect(r.baseCents).toBe(euros(9_000));
  });

  it('retient le prix d’acquisition pour un actif acheté en 2026', () => {
    const r = baseDeReference({
      dateAcquisition: '2026-03-01',
      prixAcquisitionCents: euros(5_000),
      valeurReference2025Cents: null,
    });
    expect(r.origine).toBe('prix_acquisition');
    expect(r.baseCents).toBe(euros(5_000));
  });

  it('se rabat sur le prix d’acquisition si la valeur 2025 manque', () => {
    const r = baseDeReference({
      dateAcquisition: '2019-01-01',
      prixAcquisitionCents: euros(5_000),
      valeurReference2025Cents: null,
    });
    expect(r.origine).toBe('prix_acquisition');
  });

  it('signale une base inconnue plutôt que d’en inventer une', () => {
    const r = baseDeReference({ dateAcquisition: null, prixAcquisitionCents: null });
    expect(r.origine).toBe('inconnue');
    expect(r.baseCents).toBeNull();
  });

  it('traite la date pivot elle-même comme antérieure', () => {
    const r = baseDeReference({
      dateAcquisition: DATE_REFERENCE_PLUS_VALUES,
      prixAcquisitionCents: euros(5_000),
      valeurReference2025Cents: euros(7_000),
    });
    expect(r.origine).toBe('valeur_2025');
  });
});

describe('impôt latent — le différenciateur Nestor', () => {
  const positions = [
    {
      id: '1',
      nom: 'ETF World',
      valeurActuelleCents: euros(50_000),
      valeurReference2025Cents: euros(35_000),
      dateAcquisition: '2021-01-01',
      supportTOB: 'actions_etrangeres' as const,
    },
    {
      id: '2',
      nom: 'Actions BE',
      valeurActuelleCents: euros(20_000),
      prixAcquisitionCents: euros(18_000),
      dateAcquisition: '2026-02-01',
      supportTOB: 'actions_etrangeres' as const,
    },
  ];

  it('agrège les plus-values latentes et déduit l’exonération une seule fois', () => {
    const r = calculerImpotLatent({ positions }, P);
    // 15 000 + 2 000 = 17 000 de plus-value, dont 10 000 exonérés → 7 000 × 10 %
    expect(r.result.plusValueLatenteTotaleCents).toBe(euros(17_000));
    expect(r.result.taxePlusValuesCents).toBe(euros(700));
  });

  it('ajoute la TOB de sortie à l’impôt latent', () => {
    const r = calculerImpotLatent({ positions }, P);
    // (50 000 + 20 000) × 0,12 %
    expect(r.result.tobSortieCents).toBe(euros(84));
    expect(r.result.impotLatentCents).toBe(euros(700) + euros(84));
  });

  it('expose le patrimoine net d’impôt latent, le KPI du dashboard', () => {
    const r = calculerImpotLatent({ positions }, P);
    expect(r.result.valeurBruteCents).toBe(euros(70_000));
    expect(r.result.valeurNetteCents).toBe(euros(70_000) - r.result.impotLatentCents);
  });

  it('exclut du calcul les positions sans base de référence et le dit', () => {
    const r = calculerImpotLatent(
      {
        positions: [
          { id: '3', nom: 'Vieux fonds', valeurActuelleCents: euros(10_000) },
        ],
      },
      P,
    );
    expect(r.result.positionsSansBase).toEqual(['Vieux fonds']);
    expect(r.result.plusValueLatenteTotaleCents).toBe(0);
    expect(r.hypotheses.join(' ')).toContain('Vieux fonds');
  });

  it('n’applique pas de TOB sur un actif qui n’y est pas soumis', () => {
    const r = calculerImpotLatent(
      {
        positions: [
          {
            id: '4',
            nom: 'Bitcoin',
            valeurActuelleCents: euros(30_000),
            prixAcquisitionCents: euros(10_000),
            dateAcquisition: '2026-01-05',
            supportTOB: null,
          },
        ],
      },
      P,
    );
    expect(r.result.tobSortieCents).toBe(0);
    expect(r.result.taxePlusValuesCents).toBe(euros(1_000)); // (20 000 − 10 000) × 10 %
  });

  it('renvoie un portefeuille vide sans planter', () => {
    const r = calculerImpotLatent({ positions: [] }, P);
    expect(r.result.impotLatentCents).toBe(0);
    expect(r.result.valeurNetteCents).toBe(0);
  });
});

describe('taxe Reynders', () => {
  it('ne s’applique pas sous le seuil de part obligataire', () => {
    const r = calculerTaxeReynders(
      { partObligatoirePourcent: 8, plusValueCents: euros(1_000) },
      P,
    );
    expect(r.result.applicable).toBe(false);
    expect(r.result.taxeCents).toBe(0);
  });

  it('taxe la composante d’intérêts au-delà du seuil', () => {
    const r = calculerTaxeReynders(
      { partObligatoirePourcent: 50, plusValueCents: euros(1_000) },
      P,
    );
    expect(r.result.applicable).toBe(true);
    expect(r.result.composanteInteretsCents).toBe(euros(500));
    expect(r.result.taxeCents).toBe(euros(150)); // 500 × 30 %
  });

  it('ignore une plus-value négative', () => {
    const r = calculerTaxeReynders(
      { partObligatoirePourcent: 50, plusValueCents: euros(-100) },
      P,
    );
    expect(r.result.taxeCents).toBe(0);
  });
});
