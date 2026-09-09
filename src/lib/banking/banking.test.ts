import { describe, expect, it } from 'vitest';
import {
  categoriser,
  detecterAbonnements,
  detecterTransfertsMiroir,
  normaliserLibelle,
} from './categorisation';
import {
  analyserCSV,
  dedupliquer,
  decouperCSV,
  devinerMappage,
  devinerSeparateur,
  empreinteTransaction,
  parserDate,
  parserMontant,
} from './csv';

describe('découpage CSV', () => {
  it('découpe sur le séparateur', () => {
    expect(decouperCSV('a;b;c\n1;2;3', ';')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('respecte les guillemets — un libellé belge contient souvent une virgule', () => {
    const csv = 'date;libelle;montant\n01/09/2026;"ACHAT COLRUYT, LIEGE";-87,32';
    const lignes = decouperCSV(csv, ';');
    expect(lignes[1]).toEqual(['01/09/2026', 'ACHAT COLRUYT, LIEGE', '-87,32']);
  });

  it('gère un guillemet littéral doublé', () => {
    const lignes = decouperCSV('a;"il a dit ""oui""";c', ';');
    expect(lignes[0]?.[1]).toBe('il a dit "oui"');
  });

  it('normalise les fins de ligne Windows', () => {
    expect(decouperCSV('a;b\r\n1;2\r\n', ';')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('ignore les lignes vides', () => {
    expect(decouperCSV('a;b\n\n1;2\n\n', ';')).toHaveLength(2);
  });

  it('gère un séparateur à l’intérieur de guillemets sans décaler les colonnes', () => {
    const lignes = decouperCSV('a;"x;y";c', ';');
    expect(lignes[0]).toHaveLength(3);
  });
});

describe('détection du séparateur', () => {
  it('reconnaît le point-virgule, le plus courant en Belgique', () => {
    expect(devinerSeparateur('date;libelle;montant\n1;2;3')).toBe(';');
  });

  it('reconnaît la virgule', () => {
    expect(devinerSeparateur('date,libelle,montant\n1,2,3')).toBe(',');
  });

  it('reconnaît la tabulation', () => {
    expect(devinerSeparateur('date\tlibelle\tmontant')).toBe('\t');
  });

  it('ne compte pas les séparateurs contenus dans un libellé entre guillemets', () => {
    // Trois points-virgules réels, mais quatre virgules dont trois dans le libellé.
    expect(devinerSeparateur('date;"a,b,c,d";montant;solde')).toBe(';');
  });
});

describe('parsing des montants', () => {
  it('lit le format belge avec virgule décimale', () => {
    expect(parserMontant('1234,56')).toBe(123456);
    expect(parserMontant('-87,32')).toBe(-8732);
  });

  it('lit les milliers séparés par un point', () => {
    expect(parserMontant('1.234,56')).toBe(123456);
    expect(parserMontant('12.345.678,90')).toBe(1234567890);
  });

  it('lit le format anglo-saxon', () => {
    expect(parserMontant('1,234.56')).toBe(123456);
  });

  it('lit les milliers séparés par une espace', () => {
    expect(parserMontant('1 234,56')).toBe(123456);
    expect(parserMontant('1 234,56')).toBe(123456);
  });

  it('gère le signe suffixé, utilisé par certaines banques', () => {
    expect(parserMontant('87,32-')).toBe(-8732);
  });

  it('gère les négatifs entre parenthèses', () => {
    expect(parserMontant('(87,32)')).toBe(-8732);
  });

  it('gère un signe plus explicite', () => {
    expect(parserMontant('+1500,00')).toBe(150000);
  });

  it('ignore la devise', () => {
    expect(parserMontant('1234,56 EUR')).toBe(123456);
    expect(parserMontant('€ 1234,56')).toBe(123456);
  });

  it('distingue un séparateur de milliers d’une décimale', () => {
    // Une virgule suivie de trois chiffres groupe les milliers.
    expect(parserMontant('1,500')).toBe(150000);
    // Deux chiffres après : ce sont des centimes.
    expect(parserMontant('1,50')).toBe(150);
  });

  it('refuse ce qui n’est pas un montant plutôt que de rendre zéro', () => {
    expect(parserMontant('')).toBeNull();
    expect(parserMontant('n/a')).toBeNull();
    expect(parserMontant('abc')).toBeNull();
  });
});

describe('parsing des dates', () => {
  it('lit le format belge', () => {
    expect(parserDate('01/09/2026')).toBe('2026-09-01');
    expect(parserDate('1/9/2026')).toBe('2026-09-01');
    expect(parserDate('01-09-2026')).toBe('2026-09-01');
    expect(parserDate('01.09.2026')).toBe('2026-09-01');
  });

  it('lit le format ISO', () => {
    expect(parserDate('2026-09-01')).toBe('2026-09-01');
  });

  it('complète une année sur deux chiffres', () => {
    expect(parserDate('01/09/26')).toBe('2026-09-01');
  });

  it('refuse une date impossible', () => {
    expect(parserDate('32/13/2026')).toBeNull();
    expect(parserDate('pas une date')).toBeNull();
    expect(parserDate('')).toBeNull();
  });
});

describe('détection du mappage de colonnes', () => {
  it('reconnaît des en-têtes français', () => {
    const m = devinerMappage(['Date', 'Libellé', 'Montant', 'Contrepartie']);
    expect(m.date).toBe('Date');
    expect(m.libelle).toBe('Libellé');
    expect(m.montant).toBe('Montant');
    expect(m.contrepartie).toBe('Contrepartie');
  });

  it('reconnaît des en-têtes néerlandais', () => {
    const m = devinerMappage(['Datum', 'Omschrijving', 'Bedrag']);
    expect(m.date).toBe('Datum');
    expect(m.libelle).toBe('Omschrijving');
    expect(m.montant).toBe('Bedrag');
  });

  it('reconnaît des colonnes débit et crédit séparées', () => {
    const m = devinerMappage(['Date', 'Communication', 'Débit', 'Crédit']);
    expect(m.debit).toBe('Débit');
    expect(m.credit).toBe('Crédit');
  });

  it('n’affecte pas deux fois la même colonne', () => {
    const m = devinerMappage(['Date', 'Description']);
    const valeurs = Object.values(m);
    expect(new Set(valeurs).size).toBe(valeurs.length);
  });
});

describe('analyse d’un extrait complet', () => {
  const extrait = [
    'Date;Libellé;Montant;Contrepartie',
    '01/09/2026;"ACHAT COLRUYT, LIEGE";-87,32;COLRUYT',
    '02/09/2026;VIREMENT SALAIRE;2480,00;EMPLOYEUR SA',
    '03/09/2026;PROXIMUS ABONNEMENT;-45,00;PROXIMUS',
  ].join('\n');

  it('extrait toutes les transactions', () => {
    const r = analyserCSV(extrait);
    expect(r.transactions).toHaveLength(3);
    expect(r.rejets).toHaveLength(0);
  });

  it('conserve les signes et les montants', () => {
    const r = analyserCSV(extrait);
    expect(r.transactions[0]?.montantCents).toBe(-8732);
    expect(r.transactions[1]?.montantCents).toBe(248000);
  });

  it('convertit les dates en ISO', () => {
    const r = analyserCSV(extrait);
    expect(r.transactions[0]?.date).toBe('2026-09-01');
  });

  it('rejette les lignes inexploitables en disant pourquoi', () => {
    const casse = 'Date;Libellé;Montant\npas une date;X;-10,00\n01/09/2026;Y;abc';
    const r = analyserCSV(casse);
    expect(r.transactions).toHaveLength(0);
    expect(r.rejets).toEqual([
      { ligne: 2, raison: 'date illisible' },
      { ligne: 3, raison: 'montant illisible' },
    ]);
  });

  it('gère des colonnes débit et crédit séparées', () => {
    const csv = [
      'Date;Communication;Débit;Crédit',
      '01/09/2026;COURSES;87,32;',
      '02/09/2026;SALAIRE;;2480,00',
    ].join('\n');
    const r = analyserCSV(csv);
    // Le débit est une sortie : il doit devenir négatif.
    expect(r.transactions[0]?.montantCents).toBe(-8732);
    expect(r.transactions[1]?.montantCents).toBe(248000);
  });

  it('se rabat sur la contrepartie quand le libellé est vide', () => {
    const csv = 'Date;Libellé;Montant;Contrepartie\n01/09/2026;;-10,00;DELHAIZE';
    const r = analyserCSV(csv);
    expect(r.transactions[0]?.libelle).toBe('DELHAIZE');
  });

  it('renvoie un résultat vide sur un fichier vide', () => {
    const r = analyserCSV('');
    expect(r.transactions).toHaveLength(0);
  });
});

describe('déduplication', () => {
  const t = (date: string, montant: number, libelle: string) => ({
    date,
    montantCents: montant,
    libelle,
    contrepartie: null,
    referenceExterne: null,
  });

  it('écarte deux lignes identiques', () => {
    const r = dedupliquer([t('2026-09-01', -1000, 'COLRUYT'), t('2026-09-01', -1000, 'COLRUYT')], 'c1');
    expect(r.uniques).toHaveLength(1);
    expect(r.doublons).toBe(1);
  });

  it('garde deux achats du même jour à des montants différents', () => {
    const r = dedupliquer([t('2026-09-01', -1000, 'COLRUYT'), t('2026-09-01', -2000, 'COLRUYT')], 'c1');
    expect(r.uniques).toHaveLength(2);
  });

  it('sépare les comptes : la même ligne sur deux comptes reste deux lignes', () => {
    const transaction = t('2026-09-01', -1000, 'COLRUYT');
    expect(empreinteTransaction(transaction, 'c1')).not.toBe(
      empreinteTransaction(transaction, 'c2'),
    );
  });

  it('privilégie la référence externe quand elle existe', () => {
    const avecRef = { ...t('2026-09-01', -1000, 'X'), referenceExterne: 'REF123' };
    const autreDate = { ...avecRef, date: '2026-09-02' };
    // Même référence : c'est la même opération, quelle que soit la date affichée.
    expect(empreinteTransaction(avecRef, 'c1')).toBe(empreinteTransaction(autreDate, 'c1'));
  });
});

describe('catégorisation belge', () => {
  const cat = (libelle: string, montant = -1000) =>
    categoriser({ libelle, montantCents: montant }).categorie;

  it('reconnaît les enseignes de courses', () => {
    expect(cat('ACHAT COLRUYT LIEGE')).toBe('courses');
    expect(cat('DELHAIZE 1000 BRUXELLES')).toBe('courses');
    expect(cat('CARREFOUR MARKET')).toBe('courses');
  });

  it('reconnaît les fournisseurs d’énergie belges', () => {
    expect(cat('LUMINUS FACTURE')).toBe('energie');
    expect(cat('ENGIE ELECTRABEL')).toBe('energie');
    expect(cat('SWDE DOMICILIATION')).toBe('energie');
  });

  it('reconnaît les opérateurs télécoms', () => {
    expect(cat('PROXIMUS ABONNEMENT')).toBe('telecom');
    expect(cat('TELENET NV')).toBe('telecom');
  });

  it('reconnaît les transports publics des trois Régions', () => {
    expect(cat('STIB MIVB')).toBe('transport');
    expect(cat('SNCB NMBS BILLET')).toBe('transport');
    expect(cat('DE LIJN ABONNEMENT')).toBe('transport');
  });

  it('reconnaît un salaire et le classe en revenu', () => {
    expect(cat('VIREMENT SALAIRE SEPTEMBRE', 248000)).toBe('salaire');
    expect(cat('PECULE DE VACANCES', 165000)).toBe('salaire');
  });

  it('reconnaît les courtiers comme de l’investissement, pas une dépense', () => {
    expect(cat('DEGIRO VERSEMENT')).toBe('investissement');
    expect(cat('BOLERO ACHAT')).toBe('investissement');
  });

  it('reconnaît les caisses d’assurances sociales d’indépendant', () => {
    expect(cat('XERIUS COTISATIONS')).toBe('impots');
    expect(cat('PARTENA TRIMESTRE')).toBe('impots');
  });

  it('préfère le motif le plus précis à priorité égale', () => {
    // « mutualite chretienne » est plus long que « mutualite » : il doit gagner.
    const r = categoriser({ libelle: 'MUTUALITE CHRETIENNE', montantCents: 5000 });
    expect(r.motif).toBe('mutualite chretienne');
  });

  it('fait primer une règle de l’utilisateur sur les règles globales', () => {
    const r = categoriser(
      { libelle: 'COLRUYT LIEGE', montantCents: -5000 },
      [{ motif: 'colruyt', categorie: 'restaurants', priorite: 100 }],
    );
    expect(r.categorie).toBe('restaurants');
    expect(r.regleUtilisateur).toBe(true);
  });

  it('ignore les accents et la casse', () => {
    expect(cat('achat delhaize liège')).toBe('courses');
    expect(normaliserLibelle('LIÈGE Café')).toBe('liege cafe');
  });

  it('classe par défaut selon le sens du flux', () => {
    expect(cat('LIBELLE INCONNU XYZ', -5000)).toBe('autres_depenses');
    expect(cat('LIBELLE INCONNU XYZ', 5000)).toBe('autres_revenus');
  });

  it('détecte un transfert interne', () => {
    expect(cat('VIREMENT INTERNE VERS EPARGNE')).toBe('transfert');
  });
});

describe('détection des abonnements', () => {
  const mois = ['2026-06', '2026-07', '2026-08', '2026-09'];

  it('repère une dépense mensuelle stable', () => {
    const transactions = mois.map((m) => ({
      libelle: 'NETFLIX',
      montantCents: -1349,
      date: `${m}-15`,
    }));
    const abos = detecterAbonnements(transactions);
    expect(abos).toHaveLength(1);
    expect(abos[0]?.montantMensuelCents).toBe(1349);
    expect(abos[0]?.coutAnnuelCents).toBe(1349 * 12);
  });

  it('ignore une dépense qui ne revient pas assez souvent', () => {
    const transactions = [
      { libelle: 'NETFLIX', montantCents: -1349, date: '2026-08-15' },
      { libelle: 'NETFLIX', montantCents: -1349, date: '2026-09-15' },
    ];
    expect(detecterAbonnements(transactions)).toHaveLength(0);
  });

  it('ignore une dépense au montant instable — ce sont des courses, pas un abonnement', () => {
    const transactions = mois.map((m, i) => ({
      libelle: 'COLRUYT',
      montantCents: -(4000 + i * 3000),
      date: `${m}-15`,
    }));
    expect(detecterAbonnements(transactions)).toHaveLength(0);
  });

  it('ignore les revenus', () => {
    const transactions = mois.map((m) => ({
      libelle: 'SALAIRE',
      montantCents: 248000,
      date: `${m}-25`,
    }));
    expect(detecterAbonnements(transactions)).toHaveLength(0);
  });

  it('regroupe malgré un numéro de commande qui change', () => {
    const transactions = mois.map((m, i) => ({
      libelle: `SPOTIFY FACTURE ${1000 + i}`,
      montantCents: -1099,
      date: `${m}-03`,
    }));
    expect(detecterAbonnements(transactions)).toHaveLength(1);
  });

  it('classe du plus cher au moins cher sur l’année', () => {
    const transactions = [
      ...mois.map((m) => ({ libelle: 'NETFLIX', montantCents: -1349, date: `${m}-15` })),
      ...mois.map((m) => ({ libelle: 'PROXIMUS', montantCents: -4500, date: `${m}-05` })),
    ];
    const abos = detecterAbonnements(transactions);
    expect(abos[0]?.libelle).toContain('PROXIMUS');
  });
});

describe('detecterTransfertsMiroir', () => {
  const t = (id: string, date: string, montantCents: number, importId: string | null) => ({
    id,
    date,
    montantCents,
    importId,
  });

  it('apparie un débit et son crédit dans un autre import, à deux jours près', () => {
    const ids = detecterTransfertsMiroir([
      t('a', '2026-08-03', -50_000, 'courant'),
      t('b', '2026-08-04', 50_000, 'epargne'),
      t('c', '2026-08-05', -3_299, 'courant'),
    ]);
    expect([...ids].sort()).toEqual(['a', 'b']);
  });

  it('ignore un reflet trop éloigné dans le temps', () => {
    const ids = detecterTransfertsMiroir([
      t('a', '2026-08-03', -50_000, 'courant'),
      t('b', '2026-08-10', 50_000, 'epargne'),
    ]);
    expect(ids.size).toBe(0);
  });

  it('ne prend pas un remboursement sur le même compte pour un transfert', () => {
    const ids = detecterTransfertsMiroir([
      t('a', '2026-08-03', -4_999, 'courant'),
      t('b', '2026-08-04', 4_999, 'courant'),
    ]);
    expect(ids.size).toBe(0);
  });

  it('n’apparie chaque ligne qu’une fois', () => {
    const ids = detecterTransfertsMiroir([
      t('a', '2026-08-03', -10_000, 'courant'),
      t('b', '2026-08-03', -10_000, 'courant'),
      t('c', '2026-08-03', 10_000, 'epargne'),
    ]);
    expect(ids.size).toBe(2);
    expect(ids.has('c')).toBe(true);
  });

  it('exige que les deux lignes viennent d’un import', () => {
    const ids = detecterTransfertsMiroir([
      t('a', '2026-08-03', -10_000, null),
      t('b', '2026-08-03', 10_000, 'epargne'),
    ]);
    expect(ids.size).toBe(0);
  });
});
