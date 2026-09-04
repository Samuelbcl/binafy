import { euros } from '../money';
import type { Actif, Passif, Patrimoine, PointHistorique } from '../patrimoine/types';
import { totalActifs, totalPassifs } from '../patrimoine/types';
import type { RegionFiscale } from '../tax/types';

/**
 * Jeu de données fictives mais cohérentes (doc 03 § environnements).
 *
 * Sert au mode démo, aux captures et aux tests d'interface. Aucune donnée réelle
 * ne doit jamais entrer ici. Les montants sont calés sur le critère de sortie du
 * Lot 2 de la roadmap : « mes 13 656 € apparaissent, ventilés, avec un historique ».
 */

export const PROFIL_DEMO = {
  prenom: 'Samuel',
  region: 'wallonie' as RegionFiscale,
  statut: 'salarie' as const,
  commune: 'Liège',
  additionnelsCommunauxPourcent: 8.5,
  revenuImposableAnnuelCents: euros(38_400),
  locale: 'fr-BE',
};

export const ACTIFS_DEMO: Actif[] = [
  {
    id: 'a1',
    nom: 'Compte à vue',
    institution: 'BNP Paribas Fortis',
    classe: 'compte_courant',
    valeurCents: euros(2_340.12),
    variationJourCents: euros(-42.5),
    quotePart: 100,
    supportTOB: null,
  },
  {
    id: 'a2',
    nom: 'Compte d’épargne',
    institution: 'ING',
    classe: 'compte_epargne',
    valeurCents: euros(6_800),
    variationJourCents: euros(0.31),
    quotePart: 100,
    compteEpargneReglemente: true,
    tauxBase: 0.5,
    primeFidelite: 0.75,
    supportTOB: null,
  },
  {
    id: 'a3',
    nom: 'iShares Core MSCI World',
    institution: 'Degiro',
    classe: 'etf',
    valeurCents: euros(4_210.36),
    variationJourCents: euros(18.44),
    quantite: 42.5,
    isin: 'IE00B4L5Y983',
    prixAcquisitionCents: euros(3_600),
    valeurReference2025Cents: euros(3_910),
    dateAcquisition: '2023-04-18',
    supportTOB: 'actions_etrangeres',
    capitalisant: true,
    inscritEnBelgique: false,
    quotePart: 100,
  },
  {
    id: 'a4',
    nom: 'Bitcoin',
    institution: 'Bitstamp',
    classe: 'crypto',
    valeurCents: euros(806),
    variationJourCents: euros(-23.9),
    quantite: 0.0092,
    prixAcquisitionCents: euros(520),
    valeurReference2025Cents: euros(742),
    dateAcquisition: '2024-11-02',
    supportTOB: null,
    quotePart: 100,
  },
];

export const PASSIFS_DEMO: Passif[] = [
  {
    id: 'p1',
    nom: 'Prêt à tempérament — vélo électrique',
    type: 'pret_temperament',
    capitalRestantCents: euros(500),
    capitalInitialCents: euros(2_400),
    tauxAnnuel: 6.9,
    dureeMois: 36,
    dateDebut: '2024-03-01',
    mensualiteCents: euros(74.2),
  },
];

/**
 * Historique mensuel reconstruit sur 18 mois.
 *
 * Déterministe : une graine fixe évite que les captures et les tests changent à
 * chaque rendu, et que le serveur et le client divergent.
 */
export function historiqueDemo(mois = 18): PointHistorique[] {
  const netFinal = totalActifs(ACTIFS_DEMO) - totalPassifs(PASSIFS_DEMO);
  const points: PointHistorique[] = [];

  for (let i = mois - 1; i >= 0; i--) {
    const progression = (mois - 1 - i) / (mois - 1);
    const base = netFinal * (0.52 + 0.48 * progression);
    // Oscillation légère : les marchés ne montent pas en ligne droite.
    const oscillation = Math.sin((mois - i) * 0.9) * netFinal * 0.022;

    const date = new Date(Date.UTC(2026, 8 - i, 1));
    const moisCivil = date.getUTCMonth() + 1;
    // Pécule de vacances en juin, prime en décembre : deux bosses annuelles.
    const bonus = moisCivil === 6 || moisCivil === 12 ? netFinal * 0.05 : 0;

    const net = Math.round(base + oscillation + bonus);
    const passifs = Math.round(
      totalPassifs(PASSIFS_DEMO) + (euros(1_900) * i) / (mois - 1 || 1),
    );

    points.push({
      date: date.toISOString().slice(0, 10),
      actifsCents: net + passifs,
      passifsCents: passifs,
      netCents: net,
    });
  }

  // Le dernier point doit coller exactement au patrimoine affiché aujourd'hui.
  const dernier = points[points.length - 1];
  if (dernier) {
    dernier.netCents = netFinal;
    dernier.actifsCents = totalActifs(ACTIFS_DEMO);
    dernier.passifsCents = totalPassifs(PASSIFS_DEMO);
  }

  return points;
}

/** Le patrimoine de démo, dans la forme commune attendue par les écrans. */
export function patrimoineDemo(): Patrimoine {
  return {
    actifs: ACTIFS_DEMO,
    passifs: PASSIFS_DEMO,
    historique: historiqueDemo(),
    demo: true,
  };
}

/** Budget mensuel des 12 derniers mois, avec les deux mois belges atypiques. */
export function budgetDemo() {
  const mois: { mois: string; revenusCents: number; depensesCents: number; investiCents: number }[] =
    [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(Date.UTC(2026, 8 - i, 1));
    const cle = date.toISOString().slice(0, 7);
    const moisCivil = date.getUTCMonth() + 1;

    // Pécule de vacances en juin, prime de fin d'année en décembre.
    const bonus = moisCivil === 6 ? euros(1_650) : moisCivil === 12 ? euros(2_100) : 0;
    const revenus = euros(2_480) + bonus;
    // Les dépenses montent un peu en décembre, pas autant que les revenus.
    const depenses = euros(1_940) + (moisCivil === 12 ? euros(380) : 0);

    mois.push({
      mois: cle,
      revenusCents: revenus,
      depensesCents: depenses,
      investiCents: euros(250) + (bonus > 0 ? euros(500) : 0),
    });
  }

  return mois;
}

/** Catégories de dépenses du dernier mois, pour le donut et le Sankey. */
export const CATEGORIES_DEMO = [
  { nom: 'Logement', montantCents: euros(780), couleur: 'var(--data-1)', type: 'depense' as const },
  { nom: 'Courses', montantCents: euros(420), couleur: 'var(--data-2)', type: 'depense' as const },
  { nom: 'Transport', montantCents: euros(185), couleur: 'var(--data-3)', type: 'depense' as const },
  { nom: 'Abonnements', montantCents: euros(96), couleur: 'var(--data-4)', type: 'depense' as const },
  { nom: 'Loisirs', montantCents: euros(240), couleur: 'var(--data-5)', type: 'depense' as const },
  { nom: 'Santé', montantCents: euros(118), couleur: 'var(--data-6)', type: 'depense' as const },
  { nom: 'Divers', montantCents: euros(101), couleur: 'var(--data-7)', type: 'depense' as const },
];

/** Abonnements détectés — coût annualisé, la valeur perçue immédiate. */
export const ABONNEMENTS_DEMO = [
  { nom: 'Proximus', montantMensuelCents: euros(45), periodicite: 'mensuelle' as const },
  { nom: 'Spotify', montantMensuelCents: euros(10.99), periodicite: 'mensuelle' as const },
  { nom: 'Netflix', montantMensuelCents: euros(13.49), periodicite: 'mensuelle' as const },
  { nom: 'Salle de sport', montantMensuelCents: euros(26.5), periodicite: 'mensuelle' as const },
];

/** Dernières variations significatives — la liste « Ce qui a bougé » du dashboard. */
export const MOUVEMENTS_DEMO = [
  {
    id: 'm1',
    libelle: 'iShares Core MSCI World',
    detail: 'Cours du jour',
    montantCents: euros(18.44),
    date: '2026-09-01',
  },
  {
    id: 'm2',
    libelle: 'Bitcoin',
    detail: 'Cours du jour',
    montantCents: euros(-23.9),
    date: '2026-09-01',
  },
  {
    id: 'm3',
    libelle: 'Versement mensuel ETF',
    detail: 'Degiro',
    montantCents: euros(250),
    date: '2026-08-28',
  },
  {
    id: 'm4',
    libelle: 'Colruyt',
    detail: 'Courses',
    montantCents: euros(-87.32),
    date: '2026-08-27',
  },
  {
    id: 'm5',
    libelle: 'Prêt à tempérament',
    detail: 'Mensualité',
    montantCents: euros(-74.2),
    date: '2026-08-25',
  },
];
