import type { Peremption, RegionFiscale, TaxParameter, TaxParamSet, UniteParametre } from './types';

/**
 * Catalogue des paramètres fiscaux belges.
 *
 * ⚠️ Ce fichier est le **miroir applicatif** de la table `tax_parameters`.
 * Il sert au mode démo, aux tests et aux outils publics sans compte.
 * La source de vérité en production reste la base : mettre à jour un taux,
 * c'est insérer une ligne, pas déployer du code (doc 04 § note tax_parameters).
 *
 * `verifie: true`  → valeur confirmée à une source officielle, avec sa date.
 * `verifie: false` → ordre de grandeur nécessaire au fonctionnement de l'app,
 *                    en attente de confirmation. Voir docs/11-parametres-a-verifier.md.
 *                    L'interface avertit sur tout calcul qui en dépend.
 *
 * ⚠️ **Que désigne `annee` ?** Question ouverte, et elle n'est pas cosmétique.
 * La fiscalité belge distingue l'*année de revenus* de l'*exercice d'imposition*,
 * qui la suit d'un an. Les montants indexés diffèrent entre les deux : la quotité
 * exemptée vaut 10 910 € pour l'exercice 2026 (revenus 2025) et 11 180 € pour
 * l'exercice 2027 (revenus 2026).
 *
 * Ce catalogue traite `annee` comme l'**année de revenus** — c'est ce que
 * l'utilisateur a en tête quand il regarde sa position de l'année en cours.
 * Les paramètres marqués vérifiés ci-dessous respectent cette convention ou
 * sont insensibles à la distinction : le SPF indique explicitement que les
 * exonérations mobilières de 833 € et 1 020 € valent pour les revenus 2025
 * **et** 2026.
 *
 * Le barème IPP ci-dessous est donc celui des **revenus 2026** (exercice 2027),
 * et non celui de l'exercice 2026 que la plupart des sources mettent en avant.
 * Les deux figurent sur la même page du SPF ; les confondre décale toutes les
 * tranches d'environ 2,5 %.
 */

const SPF = 'https://finances.belgium.be';
const WALLONIE = 'https://logement.wallonie.be';
const INASTI = 'https://www.rsvz-inasti.fgov.be';
const BNB = 'https://www.nbb.be';
const STATBEL = 'https://statbel.fgov.be';
const NOTAIRE = 'https://www.notaire.be';
// Loi du 6 avril 2026 instaurant la taxe sur les plus-values, texte intégral.
const LOI_PLUS_VALUES =
  'https://www.ejustice.just.fgov.be/cgi/article.pl?language=fr&sum_date=2026-04-21&lg_txt=f&pd_search=2026-04-21&s_editie=1&numac_search=2026002780&caller=sum&2026002780=1&view_numac=2026002780nx2026002780f';
// Tableau des cotisations 2026 d'une caisse agréée : l'INASTI publie le premier
// taux, les tranches supérieures ne se trouvent que dans les barèmes de caisse.
const LIANTIS_2026 =
  'https://www.liantis.be/sites/default/files/uploads/tableau_cotisations_2026_1225_FR_digitaal.pdf';

/** Date de rédaction de docs/06. Sert de date de vérification aux valeurs qui en viennent. */
const DOC_06 = '2026-09-01';

type Def = {
  cle: string;
  valeur: number;
  unite: UniteParametre;
  libelle: string;
  sourceUrl: string;
  region?: RegionFiscale;
  /** Défaut `false` : on ne considère vérifié que ce qui est explicitement sourcé. */
  verifie?: boolean;
  verifieLe?: string;
  /** Pratique de marché ou hypothèse de simulation, pas une règle légale. */
  hypothese?: boolean;
  /** Rythme de péremption, quand la déduction depuis l'unité ne convient pas. */
  peremption?: Peremption;
};

function def(annee: number, d: Def): TaxParameter {
  return {
    cle: d.cle,
    annee,
    region: d.region ?? null,
    valeur: d.valeur,
    unite: d.unite,
    libelle: d.libelle,
    sourceUrl: d.sourceUrl,
    verifieLe: d.verifieLe ?? DOC_06,
    verifie: d.verifie ?? false,
    ...(d.peremption ? { peremption: d.peremption } : {}),
    hypothese: d.hypothese ?? false,
  };
}

const DEFS_2026: Def[] = [
  // ───────────────────────────────────────────────────────────
  // 1. Revenus mobiliers
  // ───────────────────────────────────────────────────────────
  {
    cle: 'precompte_mobilier.taux',
    valeur: 30,
    unite: 'pourcent',
    libelle: 'Précompte mobilier — taux standard sur dividendes et intérêts',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  {
    cle: 'precompte_mobilier.exoneration_dividendes',
    valeur: 833,
    unite: 'eur',
    libelle: 'Dividendes — première tranche exonérée par personne et par an (via déclaration)',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'epargne_reglementee.exoneration_interets',
    valeur: 1020,
    unite: 'eur',
    libelle: "Compte d'épargne réglementé — plafond annuel d'intérêts exonérés",
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'epargne_reglementee.taux_precompte_reduit',
    valeur: 15,
    unite: 'pourcent',
    libelle: "Compte d'épargne réglementé — précompte réduit au-delà du plafond exonéré",
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  // Taxe sur les opérations de bourse — taux et plafonds par opération.
  //
  // ⚠️ Les trois plafonds sont confirmés par la circulaire 2026/C/42, mais la
  // nomenclature de docs/06 ne recouvre pas exactement les catégories légales :
  // la circulaire rattache le taux de 0,12 % aux obligations et aux SICAV
  // distribuantes offertes publiquement, et le taux de 0,35 % aux « autres
  // titres », dont les actions ordinaires. Le rattachement d'un ETF donné à
  // l'une ou l'autre catégorie demande une vérification métier avant mise en
  // production — les taux, eux, sont justes.
  {
    cle: 'tob.taux.actions_etrangeres',
    valeur: 0.12,
    unite: 'pourcent',
    libelle: 'TOB — actions et ETF cotés hors registre belge',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/taxe-operations-boursieres`,
    verifie: true,
  },
  {
    cle: 'tob.taux.distribuant_belge',
    valeur: 0.35,
    unite: 'pourcent',
    libelle: 'TOB — actions et ETF distribuants inscrits en Belgique',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/taxe-operations-boursieres`,
    verifie: true,
  },
  {
    cle: 'tob.taux.capitalisant_belge',
    valeur: 1.32,
    unite: 'pourcent',
    libelle: 'TOB — fonds capitalisants inscrits en Belgique',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/taxe-operations-boursieres`,
    verifie: true,
  },
  {
    cle: 'tob.plafond.actions_etrangeres',
    valeur: 1300,
    unite: 'eur',
    libelle: 'TOB — plafond par opération, actions et ETF hors registre belge',
    sourceUrl: 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'tob.plafond.distribuant_belge',
    valeur: 1600,
    unite: 'eur',
    libelle: 'TOB — plafond par opération, distribuants inscrits en Belgique',
    sourceUrl: 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'tob.plafond.capitalisant_belge',
    valeur: 4000,
    unite: 'eur',
    libelle: 'TOB — plafond par opération, fonds capitalisants inscrits en Belgique',
    sourceUrl: 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  // Taxe sur les plus-values sur actifs financiers (depuis 2026)
  {
    cle: 'plus_values.taux',
    valeur: 10,
    unite: 'pourcent',
    libelle: 'Taxe sur les plus-values sur actifs financiers',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  {
    cle: 'plus_values.exoneration_annuelle',
    valeur: 10000,
    unite: 'eur',
    libelle: 'Taxe sur les plus-values — exonération annuelle par personne',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  // Report de l'exonération non utilisée — art. 96/2, al. 1er, 3° et al. 3 du
  // CIR 92, insérés par la loi du 6 avril 2026 (Moniteur belge du 21/04/2026),
  // lue au texte le 07/09/2026. La part d'exonération non consommée une année
  // s'ajoute aux suivantes, par tranches annuelles, jusqu'à un plafond cumulé ;
  // les plus anciennes s'imputent d'abord.
  //
  // Les montants ci-dessous sont les valeurs indexées annoncées par les
  // sources professionnelles (480 € et 2 426 € de base). La loi ne garantit
  // le montant exact de 1 000 € qu'à partir des revenus 2027 (art. 33) ; pour
  // les revenus 2026, la valeur indexée reste à confirmer à l'avis officiel
  // d'indexation. D'où `verifie: false`, et l'avertissement dans l'interface.
  {
    cle: 'plus_values.report_annuel',
    valeur: 1000,
    unite: 'eur',
    libelle: "Taxe sur les plus-values — part d'exonération non utilisée reportable par an",
    sourceUrl: LOI_PLUS_VALUES,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'plus_values.report_plafond',
    valeur: 5000,
    unite: 'eur',
    libelle: "Taxe sur les plus-values — plafond cumulé de l'exonération reportée",
    sourceUrl: LOI_PLUS_VALUES,
    verifieLe: '2026-09-07',
  },
  // Taxe Reynders — plus-values des fonds obligataires
  {
    cle: 'reynders.seuil_part_obligataire',
    valeur: 10,
    unite: 'pourcent',
    libelle: 'Taxe Reynders — seuil de part obligataire déclenchant la taxe',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  {
    cle: 'reynders.taux',
    valeur: 30,
    unite: 'pourcent',
    libelle: 'Taxe Reynders — taux sur la composante intérêts à la vente',
    sourceUrl: 'https://curvo.eu/fr/article/taxe-reynders',
    verifie: true,
    verifieLe: '2026-09-06',
  },

  // ───────────────────────────────────────────────────────────
  // 2. Revenus immobiliers
  // ───────────────────────────────────────────────────────────
  {
    cle: 'rc.coefficient_indexation',
    valeur: 2.3,
    unite: 'coefficient',
    libelle: "Revenu cadastral — coefficient d'indexation de l'année",
    // Confirmé par deux publications Securex de janvier 2026 : le coefficient
    // passe de 2,2446 à 2,30. Plusieurs sources secondaires citent encore
    // 2,1763, qui correspond à une année antérieure.
    sourceUrl: 'https://www.securex.be/fr/lex4you/employeur/actualites/les-nouveaux-montants-fiscaux-indexes-pour-2026-c381d184ee6ae843ae2af770a61faa5e',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'rc.majoration_locatif',
    valeur: 1.4,
    unite: 'coefficient',
    libelle: 'Revenu cadastral — majoration de 40 % pour un bien loué à usage privé',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-immobiliers`,
    verifie: true,
  },
  {
    cle: 'immobilier.coefficient_revalorisation',
    valeur: 5.75,
    unite: 'coefficient',
    libelle: 'Coefficient de revalorisation du RC — plafonne le forfait de charges',
    // À ne pas confondre avec le coefficient d'indexation (2,30) : celui-ci ne
    // sert qu'au plafond du forfait de charges d'une location professionnelle.
    // 5,63 pour les revenus 2025, 5,75 pour les revenus 2026.
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/habitation/louer-donner-location/revenus-locatifs/professionnel',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'immobilier.forfait_charges_professionnel',
    valeur: 40,
    unite: 'pourcent',
    libelle: 'Location à usage professionnel — forfait légal de charges déductible',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/habitation/louer-donner-location/revenus-locatifs/professionnel',
    verifie: true,
    verifieLe: '2026-09-06',
  },

  // Droits d'enregistrement — habitation propre et unique
  {
    cle: 'droits_enregistrement.propre_unique',
    valeur: 3,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — habitation propre et unique (Wallonie)",
    sourceUrl: `${WALLONIE}/fr/droits-enregistrement`,
    region: 'wallonie',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.autre',
    valeur: 12.5,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — autre bien ou locatif (Wallonie)",
    sourceUrl: `${WALLONIE}/fr/droits-enregistrement`,
    region: 'wallonie',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.propre_unique',
    valeur: 2,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — habitation propre et unique (Flandre)",
    sourceUrl: 'https://www.vlaanderen.be/registratiebelasting',
    region: 'flandre',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.autre',
    valeur: 12,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — autre bien ou locatif (Flandre)",
    sourceUrl: 'https://www.vlaanderen.be/registratiebelasting',
    region: 'flandre',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.propre_unique',
    valeur: 12.5,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — habitation propre et unique (Bruxelles, avec abattement)",
    sourceUrl: 'https://fiscalite.brussels',
    region: 'bruxelles',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.autre',
    valeur: 12.5,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement — autre bien ou locatif (Bruxelles)",
    sourceUrl: 'https://fiscalite.brussels',
    region: 'bruxelles',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.abattement',
    valeur: 200000,
    unite: 'eur',
    libelle: "Droits d'enregistrement — abattement sur la première tranche (Bruxelles)",
    sourceUrl: 'https://www.notaire.be/immobilier/acheter-et-vendre-un-bien-immobilier/les-frais-lies-lachat/droits-denregistrement-reduction-et-abattement-bruxelles',
    region: 'bruxelles',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'droits_enregistrement.abattement_prix_max',
    valeur: 600000,
    unite: 'eur',
    libelle: "Abattement bruxellois — prix d'achat maximum pour en bénéficier",
    sourceUrl: 'https://www.notaire.be/immobilier/acheter-et-vendre-un-bien-immobilier/les-frais-lies-lachat/droits-denregistrement-reduction-et-abattement-bruxelles',
    region: 'bruxelles', verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'droits_enregistrement.abattement',
    valeur: 0,
    unite: 'eur',
    libelle: "Droits d'enregistrement — pas d'abattement (Wallonie)",
    sourceUrl: `${WALLONIE}/fr/droits-enregistrement`,
    region: 'wallonie',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.abattement',
    valeur: 0,
    unite: 'eur',
    libelle: "Droits d'enregistrement — pas d'abattement (Flandre)",
    sourceUrl: 'https://www.vlaanderen.be/registratiebelasting',
    region: 'flandre',
    verifie: true,
  },
  {
    cle: 'droits_enregistrement.duree_maintien_residence',
    valeur: 3,
    unite: 'annees',
    libelle: 'Taux réduit wallon — durée minimale de maintien de la résidence principale',
    sourceUrl: `${WALLONIE}/fr/droits-enregistrement`,
    region: 'wallonie',
    verifie: true,
  },
  {
    cle: 'immobilier.tva_neuf',
    valeur: 21,
    unite: 'pourcent',
    libelle: 'TVA sur un bien neuf, en lieu et place des droits d’enregistrement',
    sourceUrl: `${SPF}/fr/particuliers/habitation/tva`,
    verifie: true,
  },
  // Frais d'acte — barème notarial dégressif sur le prix d'achat
                          
  // ── Postes d'un acte d'achat ────────────────────────────────
  // Relevés sur le calculateur officiel de notaire.be, deux simulations
  // concordantes du 06/09/2026. La formule de TVA en a été déduite et vérifiée
  // au centime sur les deux : elle porte sur les honoraires, les frais
  // administratifs, les débours et le droit d'écriture — pas sur les droits
  // d'enregistrement ni sur la transcription hypothécaire.
  {
    cle: 'notaire.droit_annexes',
    valeur: 100,
    unite: 'eur',
    libelle: "Droit pour les annexes de l'acte",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/achat',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'notaire.frais_administratifs',
    valeur: 855,
    unite: 'eur',
    libelle: 'Frais administratifs du notaire',
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/achat',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'notaire.debours',
    valeur: 309,
    unite: 'eur',
    libelle: 'Débours — recherches et formalités avancées par le notaire',
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/achat',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'notaire.transcription_hypothecaire',
    valeur: 285,
    unite: 'eur',
    libelle: "Transcription hypothécaire de l'acte d'achat",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/achat',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'notaire.droit_ecriture',
    valeur: 100,
    unite: 'eur',
    libelle: "Droit d'écriture",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/achat',
    verifie: true,
    verifieLe: '2026-09-06',
  },
        {
    cle: 'notaire.tva_honoraires',
    valeur: 21,
    unite: 'pourcent',
    libelle: 'TVA sur les honoraires du notaire',
    sourceUrl: NOTAIRE,
    verifie: true,
  },

  // ── Acte de crédit hypothécaire ─────────────────────────────
  // Relevés sur le calculateur officiel de notaire.be, deux simulations
  // concordantes du 06/09/2026 (150 000 € et 252 000 €). Les deux formules
  // proportionnelles portent sur le montant emprunté majoré des accessoires,
  // et reproduisent les deux relevés au centime.
  {
    cle: 'credit.accessoires',
    valeur: 10,
    unite: 'pourcent',
    libelle: "Accessoires de l'hypothèque — majoration du montant inscrit",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'credit.droits_enregistrement',
    valeur: 1,
    unite: 'pourcent',
    libelle: "Droits d'enregistrement de l'inscription hypothécaire",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'credit.retribution_hypotheque',
    valeur: 270,
    unite: 'eur',
    libelle: "Rétribution du bureau Sécurité juridique",
    sourceUrl: 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'credit.droit_hypotheque',
    valeur: 0.3,
    unite: 'pourcent',
    // Assiette confirmée le 07/09/2026 : « calculé sur le montant du capital et
    // des accessoires, comme le droit d'enregistrement » — donc le montant
    // inscrit, pas le seul montant emprunté. Articles 259 à 267 du Code des
    // droits d'enregistrement, d'hypothèque et de greffe, non lus au texte.
    libelle: "Droit d'hypothèque sur le montant inscrit (capital et accessoires)",
    sourceUrl:
      'https://www.notaire.be/immobilier/acheter-et-vendre-un-bien-immobilier/les-frais-lies-lachat/les-frais-lies-au-credit-hypothecaire',
    verifie: true,
    verifieLe: '2026-09-07',
  },
    {
    cle: 'credit.frais_dossier',
    valeur: 500,
    unite: 'eur',
    libelle: 'Frais de dossier bancaire',
    sourceUrl: BNB,
    hypothese: true,
    verifie: true,
    verifieLe: '2026-09-06',
  },
  // Quotités de financement recommandées par la BNB
  {
    cle: 'credit.quotite.propre',
    valeur: 90,
    unite: 'pourcent',
    libelle: 'Quotité de financement usuelle — habitation propre',
    sourceUrl: `${BNB}/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires`,
    verifie: true,
    hypothese: true,
  },
  {
    cle: 'credit.quotite.locatif',
    valeur: 80,
    unite: 'pourcent',
    libelle: 'Quotité de financement usuelle — investissement locatif',
    sourceUrl: `${BNB}/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires`,
    verifie: true,
    hypothese: true,
  },
  {
    cle: 'credit.ratio_charge_max',
    valeur: 33,
    unite: 'pourcent',
    libelle: 'Ratio de charge maximum usuel — mensualité sur revenus nets',
    sourceUrl: BNB,
    hypothese: true,
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'credit.part_loyer_prise_en_compte',
    valeur: 75,
    unite: 'pourcent',
    libelle: 'Part du loyer attendu prise en compte dans les revenus (locatif)',
    sourceUrl: BNB,
    hypothese: true,
    verifie: true,
    verifieLe: '2026-09-06',
  },
  // ───────────────────────────────────────────────────────────
  // 3. Impôt des personnes physiques
  // ───────────────────────────────────────────────────────────
  {
    cle: 'ipp.tranche_1.plafond',
    valeur: 16720,
    unite: 'eur',
    libelle: 'IPP — plafond de la tranche à 25 %',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_1.taux',
    valeur: 25,
    unite: 'pourcent',
    libelle: 'IPP — taux de la tranche 1',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_2.plafond',
    valeur: 29510,
    unite: 'eur',
    libelle: 'IPP — plafond de la tranche à 40 %',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_2.taux',
    valeur: 40,
    unite: 'pourcent',
    libelle: 'IPP — taux de la tranche 2',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_3.plafond',
    valeur: 51070,
    unite: 'eur',
    libelle: 'IPP — plafond de la tranche à 45 %',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_3.taux',
    valeur: 45,
    unite: 'pourcent',
    libelle: 'IPP — taux de la tranche 3',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.tranche_4.taux',
    valeur: 50,
    unite: 'pourcent',
    libelle: 'IPP — taux marginal supérieur',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'ipp.quotite_exemptee',
    valeur: 11180,
    unite: 'eur',
    libelle: "IPP — quotité de revenu exemptée d'impôt",
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition',
    verifieLe: '2026-09-06',
    verifie: true,
  },
  {
    cle: 'ipp.additionnels_communaux_moyen',
    valeur: 7,
    unite: 'pourcent',
    libelle: 'Additionnels communaux — moyenne nationale (variable par commune)',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot`,
    verifie: true,
  },
  // ───────────────────────────────────────────────────────────
  // 4. Statut d'indépendant
  // ───────────────────────────────────────────────────────────
  // Barème dégressif des cotisations, confirmé à l'INASTI le 07/09/2026 et
  // recoupé sur les tableaux 2026 de deux caisses agréées.
  //
  // Il a longtemps été simplifié en un taux plat de 20,5 %, ce qui restait juste
  // pour la cible — un complémentaire gagne rarement plus de 75 000 € — mais
  // surestimait les cotisations dès qu'on dépassait la première tranche.
  {
    cle: 'independant.tranche_1.taux',
    valeur: 20.5,
    unite: 'pourcent',
    libelle: 'Cotisations sociales — taux de la première tranche',
    sourceUrl: `${INASTI}/fr/faq/combien-de-cotisations-sociales-dois-je-payer`,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.tranche_1.plafond',
    valeur: 75024.54,
    unite: 'eur',
    libelle: 'Cotisations sociales — plafond de la première tranche',
    sourceUrl: `${INASTI}/fr/faq/combien-de-cotisations-sociales-dois-je-payer`,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.tranche_2.taux',
    valeur: 14.16,
    unite: 'pourcent',
    libelle: 'Cotisations sociales — taux de la deuxième tranche',
    sourceUrl: LIANTIS_2026,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.tranche_2.plafond',
    valeur: 110562.42,
    unite: 'eur',
    libelle: 'Cotisations sociales — plafond au-delà duquel plus rien n’est dû',
    sourceUrl: LIANTIS_2026,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.tranche_3.taux',
    valeur: 0,
    unite: 'pourcent',
    libelle: 'Cotisations sociales — au-delà du plafond, plus aucune cotisation',
    sourceUrl: LIANTIS_2026,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    // Le titre principal cotise sur un revenu plancher même si le revenu réel
    // est inférieur : c'est ce qui produit la cotisation minimale publiée de
    // 890,42 € par trimestre. Le complémentaire, lui, n'a pas de plancher — il
    // est simplement dispensé sous son seuil.
    cle: 'independant.revenu_plancher_principal',
    valeur: 17374.08,
    unite: 'eur',
    libelle: 'Indépendant à titre principal — revenu plancher servant à la cotisation minimale',
    sourceUrl: `${INASTI}/fr/faq/combien-de-cotisations-sociales-dois-je-payer`,
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.seuil_cotisations_complementaire',
    valeur: 1922.16,
    unite: 'eur',
    libelle: 'Indépendant complémentaire — seuil annuel de revenu net sous lequel aucune cotisation n’est due',
    // Vérifié le 07/09/2026 : c'est bien une dispense totale, pas un revenu
    // plancher. Au-dessus du seuil, la cotisation reste proportionnelle, sans
    // minimum — contrairement au titre principal.
    sourceUrl: `${INASTI}/fr/independant-titre-complementaire`,
    verifie: true,
    verifieLe: '2026-09-07',
  },

  // Frais de gestion par caisse d'assurances sociales. Ce sont des tarifs
  // commerciaux, pas des taux légaux : ils varient du simple au tiers en plus
  // d'une caisse à l'autre, et l'utilisateur choisit la sienne.
  {
    cle: 'independant.frais_gestion.acerta',
    valeur: 3.05,
    unite: 'pourcent',
    libelle: "Frais de gestion — Acerta",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.xerius',
    valeur: 3.05,
    unite: 'pourcent',
    libelle: "Frais de gestion — Xerius",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.liantis',
    valeur: 3.4,
    unite: 'pourcent',
    libelle: "Frais de gestion — Liantis",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.securex',
    valeur: 3.65,
    unite: 'pourcent',
    libelle: "Frais de gestion — Securex",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.group_s',
    valeur: 3.8,
    unite: 'pourcent',
    libelle: "Frais de gestion — Group S",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.partena',
    valeur: 4.25,
    unite: 'pourcent',
    libelle: "Frais de gestion — Partena Professional",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.ucm',
    valeur: 4.25,
    unite: 'pourcent',
    libelle: "Frais de gestion — UCM",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion.cnasti',
    valeur: 4.25,
    unite: 'pourcent',
    libelle: "Frais de gestion — Caisse nationale auxiliaire (CNASTI)",
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.frais_gestion_caisse',
    valeur: 3.65,
    unite: 'pourcent',
    libelle: "Frais de gestion — valeur retenue à défaut de caisse choisie",
    // Médiane des huit caisses, qui s'échelonnent de 3,05 % à 4,25 %.
    sourceUrl: 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'independant.cout_bce',
    valeur: 111.5,
    unite: 'eur',
    // Tarif 2026 identique chez UCM, Acerta et Securex, qualifié de « mission
    // légale non soumise à TVA » : un tarif réglementé, pas commercial. Reste en
    // dette tant que l'arrêté qui le fixe n'a pas été lu au texte.
    libelle: "Inscription à la BCE via un guichet d'entreprises (par unité d'établissement)",
    sourceUrl: 'https://www.ucm.be/documents/je-demarre/note-dinfo-tarifs-guichet-dentreprises-2026',
    verifieLe: '2026-09-07',
  },
  {
    cle: 'independant.cout_activation_tva',
    valeur: 78,
    unite: 'eur',
    // Trois guichets, trois prix : 60 € HTVA chez Securex, 78,65 € chez Xerius,
    // 84,70 € TVAC chez UCM. Il n'y a pas de valeur officielle — c'est un
    // service payant hors missions légales. La valeur retenue est au milieu de
    // la fourchette, et sa péremption est celle d'un tarif de marché.
    libelle: 'Activation du numéro de TVA par le guichet (TVAC, de 60 à 85 € selon l’enseigne)',
    sourceUrl: 'https://www.xerius.be/fr-be/numero-tva-independant-complementaire',
    verifie: true,
    verifieLe: '2026-09-07',
    hypothese: true,
  },
  {
    cle: 'tva.seuil_franchise',
    valeur: 25000,
    unite: 'eur',
    libelle: "TVA — seuil de chiffre d'affaires du régime de franchise",
    sourceUrl: `${SPF}/fr/entreprises/tva/assujettissement/franchise`,
    verifie: true,
  },
  // ───────────────────────────────────────────────────────────
  // 5. Enveloppes d'épargne
  // ───────────────────────────────────────────────────────────
  {
    cle: 'epargne_pension.plafond_bas',
    valeur: 1050,
    unite: 'eur',
    libelle: 'Épargne-pension — plafond bas de versement',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'epargne_pension.reduction_bas',
    valeur: 30,
    unite: 'pourcent',
    libelle: "Épargne-pension — taux de réduction d'impôt au plafond bas",
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'epargne_pension.plafond_haut',
    valeur: 1350,
    unite: 'eur',
    libelle: 'Épargne-pension — plafond haut de versement',
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'epargne_pension.reduction_haut',
    valeur: 25,
    unite: 'pourcent',
    libelle: "Épargne-pension — taux de réduction d'impôt au plafond haut",
    sourceUrl: 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'epargne_pension.taxe_anticipative',
    valeur: 8,
    unite: 'pourcent',
    libelle: 'Épargne-pension — taxe anticipative prélevée à 60 ans',
    sourceUrl: 'https://www.wikifin.be/fr/pension-et-preparation-de-la-retraite/epargne-pension/comment-votre-epargne-pension-est-elle-taxee',
    verifie: true,
    verifieLe: '2026-09-06',
  },

  // ── Épargne à long terme ────────────────────────────────────
  // Dispositif distinct de l'épargne-pension : son plafond dépend des revenus
  // et se partage avec les réductions liées au crédit hypothécaire.
  {
    cle: 'epargne_long_terme.plafond_absolu',
    valeur: 2450,
    unite: 'eur',
    libelle: 'Épargne à long terme — plafond annuel de versement',
    sourceUrl: 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'epargne_long_terme.reduction',
    valeur: 30,
    unite: 'pourcent',
    libelle: "Épargne à long terme — taux de réduction d'impôt",
    sourceUrl: 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'epargne_long_terme.taxe_anticipative',
    valeur: 10,
    unite: 'pourcent',
    libelle: 'Épargne à long terme — taxe prélevée à 60 ans',
    // À ne pas confondre avec celle de l'épargne-pension, qui est de 8 %.
    sourceUrl: 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme',
    verifie: true,
    verifieLe: '2026-09-06',
  },
  {
    cle: 'epargne_long_terme.seuil_bareme',
    valeur: 2040,
    unite: 'eur',
    libelle: 'Épargne à long terme — seuil de revenus du barème du plafond',
    // Corrigé le 07/09/2026 : la valeur précédente (17 070 €) ne correspondait à
    // aucune source — huit fois trop haute. La circulaire 2026/C/6 donne les
    // montants de base (1 250 € et 1 500 €) et leurs équivalents indexés
    // 2025-2030 (2 040 € et 2 450 €), et gèle cette indexation jusqu'à
    // l'exercice 2030 : la valeur tient donc pour les revenus 2025 à 2029, d'où
    // la péremption légale plutôt qu'annuelle. Recoupement arithmétique : la
    // formule à un terme de CBC (183,60 € + 6 % du revenu) vaut exactement
    // 2 040 € × (15 % − 6 %) + 6 % du revenu. Reste en dette tant que la
    // circulaire n'est pas lue en primaire.
    sourceUrl:
      'https://blog.forumforthefuture.be/fr/article/circulaire-2026c6-relative-au-gel-de-lindexation-de-depenses-fiscales/29822',
    verifieLe: '2026-09-07',
    peremption: 'legale',
  },
  {
    cle: 'epargne_long_terme.taux_premiere_tranche',
    valeur: 15,
    unite: 'pourcent',
    libelle: 'Épargne à long terme — taux sur la première tranche de revenus',
    // Confirmé le 07/09/2026 par convergence : identique chez toutes les sources
    // depuis des années, et cohérent au centime avec le seuil et la formule de
    // CBC. L'article du CIR 92 qui le fixe n'a pas été lu au texte.
    sourceUrl: 'https://www.cbc.be/particuliers/fr/epargner/calcul-epargne-long-terme.html',
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'epargne_long_terme.taux_tranche_superieure',
    valeur: 6,
    unite: 'pourcent',
    libelle: 'Épargne à long terme — taux au-delà du seuil',
    sourceUrl: 'https://www.cbc.be/particuliers/fr/epargner/calcul-epargne-long-terme.html',
    verifie: true,
    verifieLe: '2026-09-07',
  },
  {
    cle: 'assurance.taxe_prime',
    valeur: 2,
    unite: 'pourcent',
    libelle: "Branche 21 et 23 — taxe sur la prime à l'entrée",
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  {
    cle: 'branche21.duree_exoneration',
    valeur: 8,
    unite: 'annees',
    libelle: 'Branche 21 — durée au-delà de laquelle les intérêts échappent au précompte',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
    verifie: true,
  },
  // ───────────────────────────────────────────────────────────
  // 6. Hypothèses macro par défaut des simulateurs (doc 07)
  // ───────────────────────────────────────────────────────────
  {
    cle: 'hypothese.inflation_defaut',
    valeur: 2,
    unite: 'pourcent',
    libelle: 'Inflation annuelle retenue par défaut dans les projections',
    sourceUrl: `${STATBEL}/fr/themes/prix-la-consommation`,
    verifie: true,
    hypothese: true,
  },
  {
    cle: 'hypothese.taux_retrait_defaut',
    valeur: 4,
    unite: 'pourcent',
    libelle: 'Taux de retrait annuel retenu par défaut',
    sourceUrl: STATBEL,
    hypothese: true,
    verifie: true,
    verifieLe: '2026-09-06',
  },
];

export const PARAMETRES_2026: readonly TaxParameter[] = DEFS_2026.map((d) => def(2026, d));

export const TAX_PARAMS_2026: TaxParamSet = {
  annee: 2026,
  parametres: PARAMETRES_2026,
};

/** Année fiscale par défaut de l'application. */
export const ANNEE_COURANTE = 2026;

const SETS: Record<number, TaxParamSet> = {
  2026: TAX_PARAMS_2026,
};

export function getTaxParams(annee: number = ANNEE_COURANTE): TaxParamSet {
  const set = SETS[annee];
  if (!set) {
    throw new Error(
      `Aucun jeu de paramètres fiscaux pour ${annee}. ` +
        `Charge-les depuis tax_parameters ou ajoute l'année dans src/lib/tax/parametres.ts.`,
    );
  }
  return set;
}

/** Les paramètres qui attendent encore une confirmation à la source officielle. */
/**
 * Les règles légales encore à confirmer à leur source.
 *
 * Les pratiques de marché et hypothèses de simulation en sont exclues : les
 * compter reviendrait à promettre une vérification qui n'existe pas — aucun
 * texte ne publie « le » ratio de charge d'un tiers.
 */
export function parametresNonVerifies(set: TaxParamSet = TAX_PARAMS_2026): TaxParameter[] {
  return set.parametres.filter((p) => !p.verifie && !p.hypothese);
}

/** Les valeurs qui relèvent du choix ou de l'usage, non de la loi. */
export function parametresHypothese(set: TaxParamSet = TAX_PARAMS_2026): TaxParameter[] {
  return set.parametres.filter((p) => p.hypothese);
}
