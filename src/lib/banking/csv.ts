/**
 * Import CSV d'extraits bancaires (doc 03 § filet de sécurité belge).
 *
 * L'import CSV couvre tout, tout de suite, et sans dépendre d'un agrégateur :
 * c'est ce qui rend l'app utilisable avant toute connexion PSD2, et ce qui la
 * garde utilisable quand une connexion casse — les consentements expirent tous
 * les 90 jours, c'est structurel.
 *
 * Fonctions pures : le fichier arrive en texte, il en ressort des transactions.
 */

export type LigneCSV = Record<string, string>;

/**
 * Découpe un CSV en respectant les guillemets.
 *
 * Un libellé bancaire belge contient très souvent une virgule (« ACHAT COLRUYT,
 * LIEGE ») ou un point-virgule. Découper naïvement sur le séparateur décale
 * toutes les colonnes suivantes et fabrique des montants absurdes.
 */
export function decouperCSV(texte: string, separateur: string): string[][] {
  const lignes: string[][] = [];
  let champs: string[] = [];
  let courant = '';
  let dansGuillemets = false;

  // On normalise les fins de ligne Windows en amont : les exports bancaires
  // belges arrivent presque toujours en CRLF.
  const contenu = texte.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i];

    if (dansGuillemets) {
      if (c === '"') {
        // Deux guillemets consécutifs = un guillemet littéral.
        if (contenu[i + 1] === '"') {
          courant += '"';
          i++;
        } else {
          dansGuillemets = false;
        }
      } else {
        courant += c;
      }
      continue;
    }

    if (c === '"') {
      dansGuillemets = true;
    } else if (c === separateur) {
      champs.push(courant.trim());
      courant = '';
    } else if (c === '\n') {
      champs.push(courant.trim());
      // On ignore les lignes entièrement vides.
      if (champs.some((v) => v !== '')) lignes.push(champs);
      champs = [];
      courant = '';
    } else {
      courant += c;
    }
  }

  champs.push(courant.trim());
  if (champs.some((v) => v !== '')) lignes.push(champs);

  return lignes;
}

/**
 * Devine le séparateur. Les banques belges exportent en point-virgule bien plus
 * souvent qu'en virgule, justement parce que la virgule est le séparateur
 * décimal.
 */
export function devinerSeparateur(texte: string): string {
  const premiereLigne = texte.split(/\r?\n/)[0] ?? '';
  const candidats = [';', ',', '\t', '|'];

  let meilleur = ';';
  let maximum = 0;

  for (const candidat of candidats) {
    // On ne compte que hors guillemets, sinon un libellé fausse le vote.
    let compte = 0;
    let dansGuillemets = false;
    for (const c of premiereLigne) {
      if (c === '"') dansGuillemets = !dansGuillemets;
      else if (c === candidat && !dansGuillemets) compte++;
    }
    if (compte > maximum) {
      maximum = compte;
      meilleur = candidat;
    }
  }

  return meilleur;
}

/**
 * Convertit un montant bancaire belge en centimes.
 *
 * Gère « 1.234,56 », « 1 234,56 », « 1,234.56 », « -12,50 », « 12,50-' » et les
 * montants entre parenthèses. Renvoie `null` si ce n'est pas un montant : mieux
 * vaut refuser une ligne que d'importer un zéro silencieux.
 */
export function parserMontant(brut: string): number | null {
  if (!brut) return null;

  let texte = brut.trim().replace(/[\s  ]/g, '');
  if (texte === '') return null;

  // Certaines banques suffixent le signe, d'autres parenthèsent les négatifs.
  let negatif = false;
  if (texte.endsWith('-')) {
    negatif = true;
    texte = texte.slice(0, -1);
  }
  if (texte.startsWith('(') && texte.endsWith(')')) {
    negatif = true;
    texte = texte.slice(1, -1);
  }
  if (texte.startsWith('+')) texte = texte.slice(1);
  if (texte.startsWith('-')) {
    negatif = true;
    texte = texte.slice(1);
  }

  texte = texte.replace(/(?:EUR|€)/gi, '');
  if (!/^[\d.,]+$/.test(texte) || texte === '') return null;

  const dernierePointe = texte.lastIndexOf('.');
  const derniereVirgule = texte.lastIndexOf(',');

  if (dernierePointe >= 0 && derniereVirgule >= 0) {
    // Le séparateur décimal est le dernier des deux ; l'autre groupe les milliers.
    if (derniereVirgule > dernierePointe) {
      texte = texte.replace(/\./g, '').replace(',', '.');
    } else {
      texte = texte.replace(/,/g, '');
    }
  } else if (derniereVirgule >= 0) {
    // Une virgule suivie de 3 chiffres est un séparateur de milliers, pas une décimale.
    const apres = texte.length - derniereVirgule - 1;
    texte = apres === 3 ? texte.replace(/,/g, '') : texte.replace(',', '.');
  } else if (dernierePointe >= 0) {
    const apres = texte.length - dernierePointe - 1;
    if (apres === 3) texte = texte.replace(/\./g, '');
  }

  const nombre = Number(texte);
  if (!Number.isFinite(nombre)) return null;

  const cents = Math.round(nombre * 100);
  return negatif ? -cents : cents;
}

/**
 * Convertit une date d'extrait en ISO.
 * Les banques belges écrivent en JJ/MM/AAAA ; certaines exportent en ISO.
 */
export function parserDate(brut: string): string | null {
  if (!brut) return null;
  const texte = brut.trim();

  const iso = texte.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const belge = texte.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (belge) {
    const jour = belge[1]!.padStart(2, '0');
    const mois = belge[2]!.padStart(2, '0');
    let annee = belge[3]!;
    if (annee.length === 2) annee = `20${annee}`;
    if (Number(mois) > 12 || Number(jour) > 31) return null;
    return `${annee}-${mois}-${jour}`;
  }

  return null;
}

export type MappageColonnes = {
  date: string;
  libelle: string;
  /** Colonne portant un montant signé. */
  montant?: string;
  /** Ou bien deux colonnes séparées débit / crédit. */
  debit?: string;
  credit?: string;
  contrepartie?: string;
  reference?: string;
};

/** Noms de colonnes rencontrés chez les banques belges, en FR, NL et EN. */
const SYNONYMES: Record<keyof MappageColonnes, string[]> = {
  date: ['date', 'datum', 'date valeur', 'valutadatum', 'date d’exécution', 'uitvoeringsdatum', 'transaction date', 'boekingsdatum', 'date comptable'],
  libelle: ['libellé', 'libelle', 'communication', 'mededeling', 'description', 'omschrijving', 'détails', 'details', 'transaction'],
  montant: ['montant', 'bedrag', 'amount', 'montant de la transaction', 'transactiebedrag'],
  debit: ['débit', 'debit', 'uitgave'],
  credit: ['crédit', 'credit', 'inkomen', 'ontvangst'],
  contrepartie: ['contrepartie', 'tegenpartij', 'bénéficiaire', 'beneficiaire', 'begunstigde', 'nom de la contrepartie', 'counterparty', 'name'],
  reference: ['référence', 'reference', 'referentie', 'numéro d’extrait', 'uittrekselnummer', 'numéro de séquence'],
};

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Devine le mappage des colonnes depuis l'en-tête.
 * L'utilisateur peut toujours le corriger : on propose, on n'impose pas.
 */
export function devinerMappage(entetes: readonly string[]): Partial<MappageColonnes> {
  const mappage: Partial<MappageColonnes> = {};
  const normalisees = entetes.map(normaliser);

  for (const [champ, synonymes] of Object.entries(SYNONYMES) as [
    keyof MappageColonnes,
    string[],
  ][]) {
    const cibles = synonymes.map(normaliser);

    // Correspondance exacte d'abord, sinon on accepte qu'elle soit contenue.
    let index = normalisees.findIndex((e) => cibles.includes(e));
    if (index === -1) {
      index = normalisees.findIndex((e) => e !== '' && cibles.some((c) => e.includes(c)));
    }

    const entete = index >= 0 ? entetes[index] : undefined;
    if (entete && !Object.values(mappage).includes(entete)) {
      mappage[champ] = entete;
    }
  }

  return mappage;
}

export type TransactionImportee = {
  date: string;
  libelle: string;
  montantCents: number;
  contrepartie: string | null;
  referenceExterne: string | null;
};

export type ResultatImport = {
  transactions: TransactionImportee[];
  /** Lignes refusées, avec la raison — on ne les avale pas en silence. */
  rejets: { ligne: number; raison: string }[];
  entetes: string[];
  separateur: string;
};

/**
 * Analyse un CSV complet en transactions.
 * Une ligne inexploitable est rejetée avec sa raison plutôt qu'importée à zéro.
 */
export function analyserCSV(
  texte: string,
  mappage?: Partial<MappageColonnes>,
): ResultatImport {
  const separateur = devinerSeparateur(texte);
  const lignes = decouperCSV(texte, separateur);

  if (lignes.length === 0) {
    return { transactions: [], rejets: [], entetes: [], separateur };
  }

  const entetes = lignes[0]!;
  const map = { ...devinerMappage(entetes), ...mappage };

  const index = (nom?: string) => (nom ? entetes.indexOf(nom) : -1);
  const iDate = index(map.date);
  const iLibelle = index(map.libelle);
  const iMontant = index(map.montant);
  const iDebit = index(map.debit);
  const iCredit = index(map.credit);
  const iContrepartie = index(map.contrepartie);
  const iReference = index(map.reference);

  const transactions: TransactionImportee[] = [];
  const rejets: { ligne: number; raison: string }[] = [];

  for (let n = 1; n < lignes.length; n++) {
    const ligne = lignes[n]!;
    const numero = n + 1;

    const date = parserDate(ligne[iDate] ?? '');
    if (!date) {
      rejets.push({ ligne: numero, raison: 'date illisible' });
      continue;
    }

    let montantCents: number | null = null;

    if (iMontant >= 0) {
      montantCents = parserMontant(ligne[iMontant] ?? '');
    } else if (iDebit >= 0 || iCredit >= 0) {
      // Deux colonnes séparées : le débit est une sortie, donc négatif.
      const debit = iDebit >= 0 ? parserMontant(ligne[iDebit] ?? '') : null;
      const credit = iCredit >= 0 ? parserMontant(ligne[iCredit] ?? '') : null;
      if (debit != null && debit !== 0) montantCents = -Math.abs(debit);
      else if (credit != null && credit !== 0) montantCents = Math.abs(credit);
    }

    if (montantCents == null) {
      rejets.push({ ligne: numero, raison: 'montant illisible' });
      continue;
    }

    const libelle = (ligne[iLibelle] ?? '').trim();
    const contrepartie = iContrepartie >= 0 ? (ligne[iContrepartie] ?? '').trim() : '';

    if (libelle === '' && contrepartie === '') {
      rejets.push({ ligne: numero, raison: 'ni libellé ni contrepartie' });
      continue;
    }

    transactions.push({
      date,
      libelle: libelle || contrepartie,
      montantCents,
      contrepartie: contrepartie || null,
      referenceExterne: iReference >= 0 ? (ligne[iReference] ?? '').trim() || null : null,
    });
  }

  return { transactions, rejets, entetes, separateur };
}

/**
 * Empreinte stable d'une transaction, pour la déduplication.
 *
 * Beaucoup d'extraits n'ont aucune référence exploitable. Sans empreinte,
 * réimporter le même fichier double tout le budget — et un budget faux est
 * pire qu'un budget absent.
 */
export function empreinteTransaction(
  t: TransactionImportee,
  identifiantCompte: string,
): string {
  if (t.referenceExterne) return `${identifiantCompte}:${t.referenceExterne}`;

  const libelleNormalise = normaliser(t.libelle).slice(0, 40);
  return `${identifiantCompte}:${t.date}:${t.montantCents}:${libelleNormalise}`;
}

/** Écarte les doublons internes à un même fichier. */
export function dedupliquer(
  transactions: readonly TransactionImportee[],
  identifiantCompte: string,
): { uniques: TransactionImportee[]; doublons: number } {
  const vues = new Set<string>();
  const uniques: TransactionImportee[] = [];
  let doublons = 0;

  for (const t of transactions) {
    const empreinte = empreinteTransaction(t, identifiantCompte);
    if (vues.has(empreinte)) {
      doublons++;
      continue;
    }
    vues.add(empreinte);
    uniques.push(t);
  }

  return { uniques, doublons };
}
