import { describe, expect, it } from 'vitest';
import { euros } from '../money';
import {
  calculerCashNecessaire,
  calculerDroitsEnregistrement,
  calculerHonorairesNotaire,
  coutOrdreAchat,
} from './enregistrement';
import { TAX_PARAMS_2026 } from './parametres';

const P = TAX_PARAMS_2026;

describe('droits d’enregistrement — cas nominaux par Région', () => {
  it('applique 3 % en Wallonie pour une habitation propre et unique', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.montantCents).toBe(euros(8_400));
    expect(r.result.tauxApplique).toBeCloseTo(0.03, 10);
    expect(r.result.regime).toBe('enregistrement');
  });

  it('applique 12,5 % en Wallonie pour un locatif', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'locatif' },
      P,
    );
    expect(r.result.montantCents).toBe(euros(35_000));
  });

  it('applique 2 % en Flandre pour une habitation propre et unique', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(300_000), region: 'flandre', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.montantCents).toBe(euros(6_000));
  });

  it('déduit l’abattement bruxellois de la base taxable', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(400_000), region: 'bruxelles', typeAchat: 'propre_unique' },
      P,
    );
    // (400 000 − 200 000) × 12,5 %
    expect(r.result.abattementCents).toBe(euros(200_000));
    expect(r.result.montantCents).toBe(euros(25_000));
  });

  it('refuse l’abattement bruxellois au-delà du prix maximum', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(700_000), region: 'bruxelles', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.abattementCents).toBe(0);
    expect(r.result.montantCents).toBe(euros(87_500));
  });

  it('n’accorde pas d’abattement sur un locatif bruxellois', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(400_000), region: 'bruxelles', typeAchat: 'locatif' },
      P,
    );
    expect(r.result.abattementCents).toBe(0);
    expect(r.result.montantCents).toBe(euros(50_000));
  });

  it('bascule sur la TVA à 21 % pour un bien neuf', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(300_000), region: 'wallonie', typeAchat: 'propre_unique', neuf: true },
      P,
    );
    expect(r.result.regime).toBe('tva');
    expect(r.result.montantCents).toBe(euros(63_000));
  });

  it('rappelle les conditions du taux réduit wallon', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.hypotheses.join(' ')).toContain('3 ans');
    expect(r.hypotheses.join(' ')).toContain('résidence principale');
  });
});

describe('droits d’enregistrement — cas limites', () => {
  it('renvoie zéro sur un prix nul', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: 0, region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.montantCents).toBe(0);
  });

  it('traite un prix négatif comme zéro plutôt que de rendre un droit négatif', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(-1000), region: 'wallonie', typeAchat: 'locatif' },
      P,
    );
    expect(r.result.montantCents).toBe(0);
  });

  it('plafonne l’abattement au prix quand celui-ci est plus petit', () => {
    const r = calculerDroitsEnregistrement(
      { prixCents: euros(150_000), region: 'bruxelles', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.abattementCents).toBe(euros(150_000));
    expect(r.result.montantCents).toBe(0);
  });
});

describe('honoraires du notaire — barème dégressif', () => {
  it('applique le barème par tranches successives', () => {
    const r = calculerHonorairesNotaire({ prixCents: euros(280_000) }, P);
    // Le barème est dégressif : les honoraires progressent moins vite que le prix.
    expect(r.result.honorairesHTVACents).toBeGreaterThan(0);
    expect(r.result.tvaCents).toBe(Math.round(r.result.honorairesHTVACents * 0.21));
    expect(r.result.totalCents).toBe(r.result.honorairesHTVACents + r.result.tvaCents);
  });

  it('reste dégressif : doubler le prix ne double pas les honoraires', () => {
    const petit = calculerHonorairesNotaire({ prixCents: euros(150_000) }, P);
    const grand = calculerHonorairesNotaire({ prixCents: euros(300_000) }, P);
    expect(grand.result.totalCents).toBeLessThan(petit.result.totalCents * 2);
  });

  it('renvoie zéro sur un prix nul', () => {
    const r = calculerHonorairesNotaire({ prixCents: 0 }, P);
    expect(r.result.totalCents).toBe(0);
  });
});

describe('cash nécessaire à l’acte', () => {
  it('additionne tous les postes, apport compris', () => {
    const r = calculerCashNecessaire(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    const somme =
      r.result.droitsCents +
      r.result.honorairesNotaireCents +
      r.result.fraisDeboursCents +
      r.result.acteCreditCents +
      r.result.fraisDossierCents +
      r.result.apportCents;
    expect(r.result.cashTotalCents).toBe(somme);
  });

  it('applique la quotité de 90 % en habitation propre', () => {
    const r = calculerCashNecessaire(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    expect(r.result.quotiteAppliquee).toBeCloseTo(0.9, 10);
    expect(r.result.montantEmprunteCents).toBe(euros(252_000));
    expect(r.result.apportCents).toBe(euros(28_000));
  });

  it('applique la quotité de 80 % en locatif — l’apport double', () => {
    const propre = calculerCashNecessaire(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'propre_unique' },
      P,
    );
    const locatif = calculerCashNecessaire(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'locatif' },
      P,
    );
    expect(locatif.result.quotiteAppliquee).toBeCloseTo(0.8, 10);
    expect(locatif.result.apportCents).toBe(euros(56_000));
    expect(locatif.result.cashTotalCents).toBeGreaterThan(propre.result.cashTotalCents);
  });

  it('accepte une quotité forcée, bornée à 100 %', () => {
    const r = calculerCashNecessaire(
      { prixCents: euros(200_000), region: 'wallonie', typeAchat: 'propre_unique', quotite: 1.5 },
      P,
    );
    expect(r.result.quotiteAppliquee).toBe(1);
    expect(r.result.apportCents).toBe(0);
  });

  it('cas métier : un locatif wallon à 280 000 € demande nettement plus de cash', () => {
    const r = calculerCashNecessaire(
      { prixCents: euros(280_000), region: 'wallonie', typeAchat: 'locatif' },
      P,
    );
    // 35 000 de droits + 56 000 d'apport, plus notaire et acte de crédit.
    expect(r.result.droitsCents).toBe(euros(35_000));
    expect(r.result.cashTotalCents).toBeGreaterThan(euros(95_000));
  });
});

describe('arbitrage locatif / résidence principale — la fonction signature', () => {
  it('cas métier documenté : en Wallonie, sur une RP à 280 000 €, l’écart dépasse 26 000 €', () => {
    // Chiffre cité tel quel dans docs/06-fiscalite-belge.md et docs/07-moteurs-de-calcul.md.
    const r = coutOrdreAchat(
      {
        prixLocatifEnvisageCents: euros(180_000),
        prixResidencePrincipaleFutureCents: euros(280_000),
        region: 'wallonie',
      },
      P,
    );
    expect(r.result.surcoutDroitsCents).toBeGreaterThan(euros(26_000));
    expect(r.result.surcoutDroitsCents).toBe(euros(26_600)); // 35 000 − 8 400
    expect(r.result.droitsRPTauxReduitCents).toBe(euros(8_400));
    expect(r.result.droitsRPTauxPleinCents).toBe(euros(35_000));
  });

  it('chiffre l’écart sans jamais recommander un ordre d’achat', () => {
    const r = coutOrdreAchat(
      {
        prixLocatifEnvisageCents: euros(180_000),
        prixResidencePrincipaleFutureCents: euros(280_000),
        region: 'wallonie',
      },
      P,
    );
    const texte = `${r.result.explication} ${r.hypotheses.join(' ')}`.toLowerCase();
    expect(texte).not.toContain('tu devrais');
    expect(texte).not.toContain('nous recommandons');
    expect(texte).toContain('ne recommande pas');
  });

  it('conclut à un surcoût nul à Bruxelles hors abattement, où les deux taux sont identiques', () => {
    const r = coutOrdreAchat(
      {
        prixLocatifEnvisageCents: euros(180_000),
        prixResidencePrincipaleFutureCents: euros(700_000),
        region: 'bruxelles',
      },
      P,
    );
    expect(r.result.surcoutDroitsCents).toBe(0);
    expect(r.result.explication).toContain('ne change pas');
  });

  it('en Flandre, l’écart suit les taux de 2 % et 12 %', () => {
    const r = coutOrdreAchat(
      {
        prixLocatifEnvisageCents: euros(150_000),
        prixResidencePrincipaleFutureCents: euros(300_000),
        region: 'flandre',
      },
      P,
    );
    expect(r.result.surcoutDroitsCents).toBe(euros(30_000)); // 36 000 − 6 000
  });

  it('renvoie zéro sur un prix de RP nul', () => {
    const r = coutOrdreAchat(
      {
        prixLocatifEnvisageCents: euros(180_000),
        prixResidencePrincipaleFutureCents: 0,
        region: 'wallonie',
      },
      P,
    );
    expect(r.result.surcoutDroitsCents).toBe(0);
  });
});
