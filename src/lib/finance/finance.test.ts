import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import { TAX_PARAMS_2026 } from '../tax/parametres';
import {
  capitalEmpruntable,
  capitalRestantDu,
  calculerCapaciteEmprunt,
  mensualite,
  tableauAmortissement,
} from './credit';
import {
  calculerEpargnePrecaution,
  calculerTauxEpargne,
  calculerTauxEpargneCompare,
  type MoisBudget,
} from './epargne';
import { calculerInteretsComposes, calculerInteretsComposesNets } from './interets-composes';
import { calculerRendementLocatif } from './locatif';
import { calculerProjectionPatrimoine } from './projection';

const P = TAX_PARAMS_2026;

describe('intérêts composés', () => {
  it('capitalise un capital initial sans versement', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(10_000),
      versementCents: 0,
      horizonAnnees: 10,
      tauxAnnuelPourcent: 5,
      periodicite: 'annuelle',
    });
    // 10 000 × 1,05^10 = 16 288,95
    expect(r.result.valeurFinaleCents).toBe(euros(16_288.95));
    expect(r.result.totalVerseCents).toBe(euros(10_000));
  });

  it('ajoute des versements mensuels en début de période', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(10_000),
      versementCents: euros(100),
      horizonAnnees: 20,
      tauxAnnuelPourcent: 5,
    });
    expect(r.result.totalVerseCents).toBe(euros(10_000) + euros(100) * 240);
    expect(r.result.valeurFinaleCents).toBeGreaterThan(r.result.totalVerseCents);
    expect(r.result.multiple).toBeGreaterThan(1);
  });

  it('utilise un taux périodique équivalent, pas une division naïve', () => {
    // Avec r/12, 12 versements annuels à 5 % donneraient plus que 5 % annualisés.
    const mensuel = calculerInteretsComposes({
      capitalInitialCents: euros(10_000),
      versementCents: 0,
      horizonAnnees: 1,
      tauxAnnuelPourcent: 5,
      periodicite: 'mensuelle',
    });
    const annuel = calculerInteretsComposes({
      capitalInitialCents: euros(10_000),
      versementCents: 0,
      horizonAnnees: 1,
      tauxAnnuelPourcent: 5,
      periodicite: 'annuelle',
    });
    expect(mensuel.result.valeurFinaleCents).toBe(annuel.result.valeurFinaleCents);
  });

  it('gère un taux nul sans diviser par zéro', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(1_000),
      versementCents: euros(100),
      horizonAnnees: 10,
      tauxAnnuelPourcent: 0,
    });
    expect(r.result.valeurFinaleCents).toBe(euros(1_000) + euros(100) * 120);
    expect(r.result.plusValuesCents).toBe(0);
  });

  it('gère un horizon nul', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(5_000),
      versementCents: euros(100),
      horizonAnnees: 0,
      tauxAnnuelPourcent: 5,
    });
    expect(r.result.valeurFinaleCents).toBe(euros(5_000));
    expect(r.result.courbe).toHaveLength(1);
  });

  it('produit une courbe annuelle complète', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(10_000),
      versementCents: euros(100),
      horizonAnnees: 20,
      tauxAnnuelPourcent: 5,
    });
    expect(r.result.courbe).toHaveLength(21);
    expect(r.result.courbe[0]?.annee).toBe(0);
    expect(r.result.courbe[20]?.annee).toBe(20);
    // Chaque point sépare bien versé et plus-values.
    for (const point of r.result.courbe) {
      expect(point.verseCents + point.plusValuesCents).toBe(point.valeurCents);
    }
  });

  it('corrige de l’inflation quand on la fournit', () => {
    const r = calculerInteretsComposes({
      capitalInitialCents: euros(100_000),
      versementCents: 0,
      horizonAnnees: 20,
      tauxAnnuelPourcent: 5,
      inflationPourcent: 2,
    });
    expect(r.result.valeurFinaleReelleCents).toBeLessThan(r.result.valeurFinaleCents);
  });

  it('déduit la taxe belge sur les plus-values au-delà de l’exonération', () => {
    const r = calculerInteretsComposesNets(
      {
        capitalInitialCents: euros(100_000),
        versementCents: 0,
        horizonAnnees: 20,
        tauxAnnuelPourcent: 5,
        periodicite: 'annuelle',
      },
      P,
    );
    // Plus-value largement au-dessus de 10 000 € : la taxe s'applique.
    expect(r.result.taxePlusValuesCents).toBeGreaterThan(0);
    expect(r.result.valeurFinaleNetteCents).toBe(
      r.result.valeurFinaleCents - r.result.taxePlusValuesCents,
    );
  });

  it('n’applique aucune taxe quand la plus-value reste sous l’exonération', () => {
    const r = calculerInteretsComposesNets(
      {
        capitalInitialCents: euros(10_000),
        versementCents: 0,
        horizonAnnees: 5,
        tauxAnnuelPourcent: 2,
        periodicite: 'annuelle',
      },
      P,
    );
    expect(r.result.taxePlusValuesCents).toBe(0);
    expect(r.result.valeurFinaleNetteCents).toBe(r.result.valeurFinaleCents);
  });

  it('rappelle qu’étaler les ventes permet de réutiliser l’exonération', () => {
    const r = calculerInteretsComposesNets(
      {
        capitalInitialCents: euros(100_000),
        versementCents: 0,
        horizonAnnees: 20,
        tauxAnnuelPourcent: 5,
      },
      P,
    );
    expect(r.hypotheses.join(' ')).toContain('étaler les ventes');
  });
});

describe('crédit hypothécaire', () => {
  it('calcule une mensualité conforme à la formule standard', () => {
    // 250 000 € sur 25 ans à 3,5 % → ≈ 1 251,80 €/mois
    const m = mensualite(euros(250_000), 3.5, 300);
    expect(m).toBeGreaterThan(euros(1_248));
    expect(m).toBeLessThan(euros(1_255));
  });

  it('inverse correctement : capacité et mensualité se répondent', () => {
    const capital = euros(250_000);
    const m = mensualite(capital, 3.5, 300);
    const retrouve = capitalEmpruntable(m, 3.5, 300);
    expect(Math.abs(retrouve - capital)).toBeLessThan(euros(50));
  });

  it('gère un taux nul', () => {
    expect(mensualite(euros(120_000), 0, 120)).toBe(euros(1_000));
    expect(capitalEmpruntable(euros(1_000), 0, 120)).toBe(euros(120_000));
  });

  it('gère une durée nulle sans planter', () => {
    expect(mensualite(euros(100_000), 3, 0)).toBe(0);
    expect(capitalEmpruntable(euros(1_000), 3, 0)).toBe(0);
  });

  it('produit un tableau d’amortissement qui se solde exactement à zéro', () => {
    const lignes = tableauAmortissement(euros(250_000), 3.5, 300);
    expect(lignes).toHaveLength(300);
    expect(lignes[299]?.capitalRestantCents).toBe(0);
  });

  it('montre que les intérêts écrasent le capital au début', () => {
    const lignes = tableauAmortissement(euros(250_000), 3.5, 300);
    const premiere = lignes[0];
    const derniere = lignes[299];
    expect(premiere!.interetsCents).toBeGreaterThan(premiere!.capitalCents);
    expect(derniere!.interetsCents).toBeLessThan(derniere!.capitalCents);
  });

  it('renvoie un tableau vide sur des entrées nulles', () => {
    expect(tableauAmortissement(0, 3.5, 300)).toEqual([]);
    expect(tableauAmortissement(euros(100_000), 3.5, 0)).toEqual([]);
  });

  it('calcule le capital restant dû à une date donnée', () => {
    const lignes = tableauAmortissement(euros(250_000), 3.5, 300);
    const parFormule = capitalRestantDu(euros(250_000), 3.5, 300, 60);
    const parTableau = lignes[59]?.capitalRestantCents ?? 0;
    expect(Math.abs(parFormule - parTableau)).toBeLessThan(euros(5));
  });

  it('borne le capital restant dû aux extrémités', () => {
    expect(capitalRestantDu(euros(250_000), 3.5, 300, 0)).toBe(euros(250_000));
    expect(capitalRestantDu(euros(250_000), 3.5, 300, 300)).toBe(0);
    expect(capitalRestantDu(euros(250_000), 3.5, 300, 400)).toBe(0);
    expect(capitalRestantDu(euros(120_000), 0, 120, 60)).toBe(euros(60_000));
  });
});

describe('capacité d’emprunt', () => {
  it('applique le ratio d’un tiers des revenus', () => {
    const r = calculerCapaciteEmprunt(
      {
        revenusNetsMensuelsCents: euros(3_000),
        dureeAnnees: 25,
        tauxAnnuelPourcent: 3.5,
      },
      P,
    );
    expect(r.result.mensualiteMaxCents).toBe(euros(990)); // 3 000 × 33 %
    expect(r.result.capaciteEmpruntCents).toBeGreaterThan(euros(190_000));
  });

  it('déduit les charges de crédit existantes', () => {
    const sans = calculerCapaciteEmprunt(
      { revenusNetsMensuelsCents: euros(3_000), dureeAnnees: 25, tauxAnnuelPourcent: 3.5 },
      P,
    );
    const avec = calculerCapaciteEmprunt(
      {
        revenusNetsMensuelsCents: euros(3_000),
        chargesMensuellesCents: euros(300),
        dureeAnnees: 25,
        tauxAnnuelPourcent: 3.5,
      },
      P,
    );
    expect(avec.result.capaciteEmpruntCents).toBeLessThan(sans.result.capaciteEmpruntCents);
  });

  it('ne retient qu’une partie du loyer attendu en locatif', () => {
    const r = calculerCapaciteEmprunt(
      {
        revenusNetsMensuelsCents: euros(3_000),
        loyerAttenduMensuelCents: euros(800),
        dureeAnnees: 25,
        tauxAnnuelPourcent: 3.5,
      },
      P,
    );
    // 75 % de 800 = 600 ajoutés aux revenus.
    expect(r.result.revenusPrisEnCompteCents).toBe(euros(3_600));
  });

  it('signale un reste à vivre insuffisant', () => {
    const r = calculerCapaciteEmprunt(
      {
        revenusNetsMensuelsCents: euros(2_000),
        dureeAnnees: 25,
        tauxAnnuelPourcent: 3.5,
        resteAVivreMinimumCents: euros(1_500),
      },
      P,
    );
    expect(r.result.resteAVivreInsuffisant).toBe(true);
  });

  it('ne descend pas sous zéro quand les charges dépassent la capacité', () => {
    const r = calculerCapaciteEmprunt(
      {
        revenusNetsMensuelsCents: euros(1_500),
        chargesMensuellesCents: euros(900),
        dureeAnnees: 25,
        tauxAnnuelPourcent: 3.5,
      },
      P,
    );
    expect(r.result.mensualiteMaxCents).toBe(0);
    expect(r.result.capaciteEmpruntCents).toBe(0);
  });

  it('rappelle que l’assurance solde restant dû n’est pas comptée', () => {
    const r = calculerCapaciteEmprunt(
      { revenusNetsMensuelsCents: euros(3_000), dureeAnnees: 25, tauxAnnuelPourcent: 3.5 },
      P,
    );
    expect(r.hypotheses.join(' ')).toContain('assurance solde restant dû');
  });
});

describe('projection de patrimoine', () => {
  const base = {
    patrimoineActuelCents: euros(50_000),
    partActionsPourcent: 60,
    investissementAnnuelCents: euros(6_000),
    horizonAnnees: 25,
    rendementActionsPourcent: 7,
    rendementAutresPourcent: 2,
    fiscaliteActionsPourcent: 10,
    fiscaliteAutresPourcent: 30,
    tauxRetraitPourcent: 4,
    inflationPourcent: 2,
  };

  it('fait croître le patrimoine et sépare nominal et réel', () => {
    const r = calculerProjectionPatrimoine(base, P);
    expect(r.result.patrimoineFinalCents).toBeGreaterThan(euros(200_000));
    expect(r.result.patrimoineFinalReelCents).toBeLessThan(r.result.patrimoineFinalCents);
  });

  it('produit une courbe complète avec le point de départ', () => {
    const r = calculerProjectionPatrimoine(base, P);
    expect(r.result.courbe).toHaveLength(26);
    expect(r.result.courbe[0]?.patrimoineCents).toBe(euros(50_000));
  });

  it('totalise correctement les sommes investies', () => {
    const r = calculerProjectionPatrimoine(base, P);
    expect(r.result.totalInvestiCents).toBe(euros(50_000) + euros(6_000) * 25);
  });

  it('calcule une rente soutenable au taux de retrait', () => {
    const r = calculerProjectionPatrimoine(base, P);
    expect(r.result.renteMensuelleCents).toBe(
      Math.round((r.result.patrimoineFinalCents * 0.04) / 12),
    );
  });

  it('date l’année d’indépendance quand les dépenses sont fournies', () => {
    const r = calculerProjectionPatrimoine(
      // 9 600 EUR/an = 800 EUR/mois : atteignable dans ce scenario, contrairement a 24 000.
      { ...base, depensesAnnuellesCents: euros(9_600) },
      P,
    );
    expect(r.result.anneeIndependance).not.toBeNull();
    expect(r.result.anneeIndependance).toBeGreaterThan(0);
  });

  it('renvoie null si l’horizon ne suffit pas à atteindre l’indépendance', () => {
    const r = calculerProjectionPatrimoine(
      { ...base, horizonAnnees: 3, depensesAnnuellesCents: euros(100_000) },
      P,
    );
    expect(r.result.anneeIndependance).toBeNull();
  });

  it('gère un horizon nul', () => {
    const r = calculerProjectionPatrimoine({ ...base, horizonAnnees: 0 }, P);
    expect(r.result.patrimoineFinalCents).toBe(euros(50_000));
    expect(r.result.courbe).toHaveLength(1);
  });

  it('fonctionne sans jeu de paramètres fiscaux', () => {
    const r = calculerProjectionPatrimoine(base);
    expect(r.sources).toEqual([]);
    expect(r.result.patrimoineFinalCents).toBeGreaterThan(0);
  });

  it('applique bien la fiscalité : elle réduit le patrimoine final', () => {
    const taxe = calculerProjectionPatrimoine(base, P);
    const sansTaxe = calculerProjectionPatrimoine(
      { ...base, fiscaliteActionsPourcent: 0, fiscaliteAutresPourcent: 0 },
      P,
    );
    expect(sansTaxe.result.patrimoineFinalCents).toBeGreaterThan(taxe.result.patrimoineFinalCents);
  });

  it('affiche l’avertissement réglementaire', () => {
    const r = calculerProjectionPatrimoine(base, P);
    expect(r.hypotheses.join(' ')).toContain('conseil en investissement');
  });
});

describe('rendement locatif', () => {
  const base = {
    prixCents: euros(200_000),
    region: 'wallonie' as const,
    loyerMensuelCents: euros(850),
    revenuCadastralCents: euros(900),
    tauxMarginal: 0.5,
    chargesAnnuellesCents: euros(1_200),
    precompteImmobilierAnnuelCents: euros(800),
    vacancePourcent: 5,
    provisionTravauxAnnuelleCents: euros(1_000),
  };

  it('calcule le rendement sur l’investissement total, frais compris', () => {
    const r = calculerRendementLocatif(base, P);
    expect(r.result.investissementTotalCents).toBeGreaterThan(euros(200_000));
    expect(r.result.rendementBrut).toBeLessThan(euros(850) * 12 / euros(200_000));
  });

  it('ordonne les trois rendements du plus optimiste au plus réaliste', () => {
    const r = calculerRendementLocatif(base, P);
    expect(r.result.rendementBrut).toBeGreaterThan(r.result.rendementNetCharges);
    expect(r.result.rendementNetCharges).toBeGreaterThan(r.result.rendementNetImpot);
  });

  it('impose sur le RC majoré, pas sur les loyers perçus', () => {
    const r = calculerRendementLocatif(base, P);
    const loyerAnnuel = euros(850) * 12;
    expect(r.result.impotAnnuelCents).toBeLessThan(loyerAnnuel * 0.5);
  });

  it('révèle le cash-flow négatif d’un locatif financé à crédit', () => {
    const r = calculerRendementLocatif(
      {
        ...base,
        credit: { quotitePourcent: 80, tauxAnnuelPourcent: 3.5, dureeAnnees: 25 },
      },
      P,
    );
    expect(r.result.mensualiteCreditCents).toBeGreaterThan(0);
    expect(r.result.cashFlowMensuelCents).toBeLessThan(0);
    expect(r.result.effortMensuelCents).toBe(-r.result.cashFlowMensuelCents);
  });

  it('dégage un cash-flow positif sans crédit', () => {
    const r = calculerRendementLocatif(base, P);
    expect(r.result.cashFlowMensuelCents).toBeGreaterThan(0);
    expect(r.result.effortMensuelCents).toBe(0);
  });

  it('explique un cash-flow négatif sans dramatiser', () => {
    const r = calculerRendementLocatif(
      { ...base, credit: { quotitePourcent: 80, tauxAnnuelPourcent: 3.5, dureeAnnees: 25 } },
      P,
    );
    const ligne = r.breakdown.find((l) => l.libelle.includes('Cash-flow'));
    expect(ligne?.precision).toContain('effort d’épargne');
  });

  it('gère un prix nul sans diviser par zéro', () => {
    const r = calculerRendementLocatif({ ...base, prixCents: 0, loyerMensuelCents: 0 }, P);
    expect(Number.isFinite(r.result.rendementBrut)).toBe(true);
  });
});

describe('taux d’épargne', () => {
  const mois = (m: string, revenus: number, depenses: number, investi = 0): MoisBudget => ({
    mois: m,
    revenusCents: euros(revenus),
    depensesCents: euros(depenses),
    investiCents: euros(investi),
  });

  it('calcule le taux sur une période', () => {
    const r = calculerTauxEpargne([mois('2026-01', 3_000, 2_100, 500)]);
    expect(r.result.tauxEpargne).toBeCloseTo(0.3, 10);
    expect(r.result.investiCents).toBe(euros(500));
    expect(r.result.epargneLiquideCents).toBe(euros(400));
  });

  it('gère des revenus nuls sans produire NaN', () => {
    const r = calculerTauxEpargne([mois('2026-01', 0, 0)]);
    expect(r.result.tauxEpargne).toBe(0);
  });

  it('distingue le mois brut du lissé sur 12 mois', () => {
    const historique = [
      ...Array.from({ length: 11 }, (_, i) =>
        mois(`2026-${String(i + 1).padStart(2, '0')}`, 3_000, 2_400, 400),
      ),
      // Décembre : prime de fin d'année.
      mois('2026-12', 6_000, 2_400, 400),
    ];
    const r = calculerTauxEpargneCompare(historique);
    expect(r.result.mensuel.tauxEpargne).toBeGreaterThan(r.result.lisse12Mois.tauxEpargne);
    expect(r.result.moisAtypique).toBe(true);
  });

  it('ne signale pas un mois représentatif comme atypique', () => {
    const historique = Array.from({ length: 12 }, (_, i) =>
      mois(`2026-${String(i + 1).padStart(2, '0')}`, 3_000, 2_400, 400),
    );
    const r = calculerTauxEpargneCompare(historique);
    expect(r.result.moisAtypique).toBe(false);
    expect(r.result.ecartPoints).toBeCloseTo(0, 6);
  });

  it('ne retient que les douze derniers mois', () => {
    const historique = Array.from({ length: 24 }, (_, i) => {
      const annee = 2025 + Math.floor(i / 12);
      const m = (i % 12) + 1;
      return mois(`${annee}-${String(m).padStart(2, '0')}`, 3_000, 2_400);
    });
    const r = calculerTauxEpargneCompare(historique);
    expect(r.result.lisse12Mois.moisComptes).toBe(12);
  });

  it('gère un historique vide', () => {
    const r = calculerTauxEpargneCompare([]);
    expect(r.result.mensuel.moisComptes).toBe(0);
    expect(r.result.moisAtypique).toBe(false);
  });

  it('mentionne le pécule de vacances dans les hypothèses', () => {
    const r = calculerTauxEpargneCompare([mois('2026-01', 3_000, 2_400)]);
    expect(r.hypotheses.join(' ')).toContain('pécule de vacances');
  });
});

describe('épargne de précaution', () => {
  it('calcule la cible depuis les charges fixes constatées', () => {
    const r = calculerEpargnePrecaution({
      chargesFixesMensuellesCents: euros(1_400),
      moisDeCouverture: 4,
    });
    expect(r.result.cibleCents).toBe(euros(5_600));
  });

  it('projette une date au rythme d’épargne réel', () => {
    const r = calculerEpargnePrecaution({
      chargesFixesMensuellesCents: euros(1_400),
      moisDeCouverture: 4,
      dejaEpargneCents: euros(2_000),
      capaciteEpargneMensuelleCents: euros(600),
    });
    expect(r.result.resteAConstituerCents).toBe(euros(3_600));
    expect(r.result.moisRestants).toBe(6);
  });

  it('ne projette pas de date sans capacité d’épargne connue', () => {
    const r = calculerEpargnePrecaution({
      chargesFixesMensuellesCents: euros(1_400),
      moisDeCouverture: 4,
      dejaEpargneCents: euros(2_000),
    });
    expect(r.result.moisRestants).toBeNull();
  });

  it('plafonne la progression à 100 % quand l’objectif est dépassé', () => {
    const r = calculerEpargnePrecaution({
      chargesFixesMensuellesCents: euros(1_000),
      moisDeCouverture: 3,
      dejaEpargneCents: euros(10_000),
      capaciteEpargneMensuelleCents: euros(500),
    });
    expect(r.result.progression).toBe(1);
    expect(r.result.resteAConstituerCents).toBe(0);
    expect(r.result.moisRestants).toBe(0);
  });
});
