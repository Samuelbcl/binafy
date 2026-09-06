import type { RegionFiscale, TaxParameter, TaxParamSet, UniteParametre } from './types';

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
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-mobiliers`,
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
    cle: 'immobilier.forfait_charges_professionnel',
    valeur: 40,
    unite: 'pourcent',
    libelle: 'Location à usage professionnel — forfait légal de charges déductible',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot/revenus-immobiliers`,
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
  // ⚠️ **Un seul barème est modélisé, il en existe deux.**
  //
  // Depuis la réforme du 01/01/2023, l'AR du 16/12/1950 distingue le barème J
  // (cas général) du barème **Jbis**, réduit, qui s'applique à l'acquisition en
  // pleine propriété par des personnes physiques d'un immeuble qu'elles
  // occuperont comme habitation propre et unique — c'est-à-dire le cas central
  // de la cible de Nestor.
  //
  // Les taux du Jbis ne sont pas publiés en clair : seul le calculateur de
  // notaire.be les applique. Les honoraires calculés ici suivent donc le barème
  // J et sont **surestimés** pour une première acquisition. Tant que le Jbis
  // n'est pas obtenu, l'écart joue en faveur de la prudence — l'utilisateur
  // prévoit plus de cash qu'il n'en faudra — mais il doit être comblé.
  //
  // Conditions du Jbis, telles que le tarif les énonce : pleine propriété,
  // immeuble affecté uniquement à l'habitation, aucun autre droit réel
  // immobilier détenu, et domicile légal fixé dans l'année sous peine de devoir
  // verser la différence au notaire.
  { cle: 'notaire.achat.tranche_1.plafond', valeur: 7500, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 1', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_1.taux', valeur: 4.56, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 1', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_2.plafond', valeur: 17500, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 2', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_2.taux', valeur: 2.85, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 2', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_3.plafond', valeur: 30000, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 3', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_3.taux', valeur: 2.28, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 3', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  { cle: 'notaire.achat.tranche_4.plafond', valeur: 45495, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 4', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_4.taux', valeur: 1.71, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 4', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_5.plafond', valeur: 64095, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 5', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_5.taux', valeur: 1.14, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 5', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_6.plafond', valeur: 250095, unite: 'eur', libelle: 'Honoraires notaire — plafond tranche 6', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_6.taux', valeur: 0.57, unite: 'pourcent', libelle: 'Honoraires notaire — taux tranche 6', sourceUrl: NOTAIRE },
  { cle: 'notaire.achat.tranche_7.taux', valeur: 0.057, unite: 'pourcent', libelle: 'Honoraires notaire — taux au-delà de la tranche 6', sourceUrl: NOTAIRE, verifie: true, verifieLe: '2026-09-06' },
  {
    cle: 'notaire.frais_debours',
    valeur: 1100,
    unite: 'eur',
    libelle: 'Frais et débours administratifs forfaitaires (recherches, transcription)',
    sourceUrl: NOTAIRE,
  },
  {
    cle: 'notaire.tva_honoraires',
    valeur: 21,
    unite: 'pourcent',
    libelle: 'TVA sur les honoraires du notaire',
    sourceUrl: NOTAIRE,
    verifie: true,
  },
  {
    cle: 'credit.droit_hypotheque',
    valeur: 1,
    unite: 'pourcent',
    libelle: "Droit d'hypothèque sur le montant emprunté",
    sourceUrl: `${SPF}/fr/particuliers/habitation/emprunt`,
  },
  {
    cle: 'credit.frais_acte_forfait',
    valeur: 2200,
    unite: 'eur',
    libelle: "Acte de crédit — honoraires, inscription hypothécaire et débours",
    sourceUrl: NOTAIRE,
  },
  {
    cle: 'credit.frais_dossier',
    valeur: 500,
    unite: 'eur',
    libelle: 'Frais de dossier bancaire',
    sourceUrl: BNB,
  },

  // Quotités de financement recommandées par la BNB
  {
    cle: 'credit.quotite.propre',
    valeur: 90,
    unite: 'pourcent',
    libelle: 'Quotité de financement usuelle — habitation propre',
    sourceUrl: `${BNB}/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires`,
    verifie: true,
  },
  {
    cle: 'credit.quotite.locatif',
    valeur: 80,
    unite: 'pourcent',
    libelle: 'Quotité de financement usuelle — investissement locatif',
    sourceUrl: `${BNB}/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires`,
    verifie: true,
  },
  {
    cle: 'credit.ratio_charge_max',
    valeur: 33,
    unite: 'pourcent',
    libelle: 'Ratio de charge maximum usuel — mensualité sur revenus nets',
    sourceUrl: BNB,
  },
  {
    cle: 'credit.part_loyer_prise_en_compte',
    valeur: 75,
    unite: 'pourcent',
    libelle: 'Part du loyer attendu prise en compte dans les revenus (locatif)',
    sourceUrl: BNB,
  },

  // ───────────────────────────────────────────────────────────
  // 3. Impôt des personnes physiques
  // ───────────────────────────────────────────────────────────
  // Barème des revenus 2026 (exercice d'imposition 2027), publié par le SPF.
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
  {
    cle: 'ipp.forfait_frais_professionnels',
    valeur: 30,
    unite: 'pourcent',
    libelle: 'Forfait légal de frais professionnels sur les revenus de remplacement',
    sourceUrl: `${SPF}/fr/particuliers/declaration_impot`,
  },

  // ───────────────────────────────────────────────────────────
  // 4. Statut d'indépendant
  // ───────────────────────────────────────────────────────────
  {
    cle: 'independant.cotisations_taux',
    valeur: 20.5,
    unite: 'pourcent',
    libelle: 'Cotisations sociales — taux sur le revenu net imposable',
    // Simplification assumée : le barème réel est dégressif — 20,5 % jusqu'à
    // 75 024,54 €, puis 14,16 %, et rien au-delà de 110 562,42 € (INASTI, 2026).
    // Pour la cible — un indépendant complémentaire — le premier taux couvre la
    // quasi-totalité des cas. À affiner si le module indépendant s'étend au
    // statut principal.
    sourceUrl: INASTI,
    verifie: true,
  },
  {
    cle: 'independant.seuil_cotisations_complementaire',
    valeur: 1922.16,
    unite: 'eur',
    libelle: 'Indépendant complémentaire — seuil annuel de revenu net sous lequel aucune cotisation n’est due',
    sourceUrl: INASTI,
    verifie: true,
  },
  {
    cle: 'independant.frais_gestion_caisse',
    valeur: 4,
    unite: 'pourcent',
    libelle: "Frais de gestion de la caisse d'assurances sociales",
    sourceUrl: INASTI,
  },
  {
    cle: 'independant.cout_bce',
    valeur: 105.5,
    unite: 'eur',
    libelle: "Inscription à la BCE via un guichet d'entreprises",
    sourceUrl: 'https://economie.fgov.be',
  },
  {
    cle: 'independant.cout_activation_tva',
    valeur: 78,
    unite: 'eur',
    libelle: 'Activation du numéro de TVA (TVAC)',
    sourceUrl: 'https://economie.fgov.be',
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
  },
  {
    cle: 'hypothese.taux_retrait_defaut',
    valeur: 4,
    unite: 'pourcent',
    libelle: 'Taux de retrait annuel retenu par défaut',
    sourceUrl: STATBEL,
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
export function parametresNonVerifies(set: TaxParamSet = TAX_PARAMS_2026): TaxParameter[] {
  return set.parametres.filter((p) => !p.verifie);
}
