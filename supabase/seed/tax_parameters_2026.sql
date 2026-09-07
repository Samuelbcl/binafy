-- ─────────────────────────────────────────────────────────────
-- Nestor — paramètres fiscaux belges 2026
--
-- ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
-- Source : src/lib/tax/parametres.ts
-- Régénérer : node scripts/generer-seed-fiscal.mjs
--
-- 88 paramètres : 83 confirmés à la source,
-- 5 règles légales en attente de vérification,
-- 7 pratiques de marché ou hypothèses de simulation
-- (voir docs/11-parametres-a-verifier.md).
--
-- Mettre à jour un taux pour une nouvelle année = insérer des lignes ici,
-- jamais modifier du code.
-- ─────────────────────────────────────────────────────────────

insert into tax_parameters
  (cle, annee, region, valeur, unite, libelle, source_url, verifie_le, verifie, hypothese)
values
  ('precompte_mobilier.taux', 2026, null, 30, 'pourcent', 'Précompte mobilier — taux standard sur dividendes et intérêts', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('precompte_mobilier.exoneration_dividendes', 2026, null, 833, 'eur', 'Dividendes — première tranche exonérée par personne et par an (via déclaration)', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true, false),
  ('epargne_reglementee.exoneration_interets', 2026, null, 1020, 'eur', 'Compte d''épargne réglementé — plafond annuel d''intérêts exonérés', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true, false),
  ('epargne_reglementee.taux_precompte_reduit', 2026, null, 15, 'pourcent', 'Compte d''épargne réglementé — précompte réduit au-delà du plafond exonéré', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true, false),
  ('tob.taux.actions_etrangeres', 2026, null, 0.12, 'pourcent', 'TOB — actions et ETF cotés hors registre belge', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true, false),
  ('tob.taux.distribuant_belge', 2026, null, 0.35, 'pourcent', 'TOB — actions et ETF distribuants inscrits en Belgique', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true, false),
  ('tob.taux.capitalisant_belge', 2026, null, 1.32, 'pourcent', 'TOB — fonds capitalisants inscrits en Belgique', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true, false),
  ('tob.plafond.actions_etrangeres', 2026, null, 1300, 'eur', 'TOB — plafond par opération, actions et ETF hors registre belge', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true, false),
  ('tob.plafond.distribuant_belge', 2026, null, 1600, 'eur', 'TOB — plafond par opération, distribuants inscrits en Belgique', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true, false),
  ('tob.plafond.capitalisant_belge', 2026, null, 4000, 'eur', 'TOB — plafond par opération, fonds capitalisants inscrits en Belgique', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true, false),
  ('plus_values.taux', 2026, null, 10, 'pourcent', 'Taxe sur les plus-values sur actifs financiers', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('plus_values.exoneration_annuelle', 2026, null, 10000, 'eur', 'Taxe sur les plus-values — exonération annuelle par personne', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('reynders.seuil_part_obligataire', 2026, null, 10, 'pourcent', 'Taxe Reynders — seuil de part obligataire déclenchant la taxe', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('reynders.taux', 2026, null, 30, 'pourcent', 'Taxe Reynders — taux sur la composante intérêts à la vente', 'https://curvo.eu/fr/article/taxe-reynders', '2026-09-06', true, false),
  ('rc.coefficient_indexation', 2026, null, 2.3, 'coefficient', 'Revenu cadastral — coefficient d''indexation de l''année', 'https://www.securex.be/fr/lex4you/employeur/actualites/les-nouveaux-montants-fiscaux-indexes-pour-2026-c381d184ee6ae843ae2af770a61faa5e', '2026-09-06', true, false),
  ('rc.majoration_locatif', 2026, null, 1.4, 'coefficient', 'Revenu cadastral — majoration de 40 % pour un bien loué à usage privé', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-immobiliers', '2026-09-01', true, false),
  ('immobilier.coefficient_revalorisation', 2026, null, 5.75, 'coefficient', 'Coefficient de revalorisation du RC — plafonne le forfait de charges', 'https://fin.belgium.be/fr/particuliers/habitation/louer-donner-location/revenus-locatifs/professionnel', '2026-09-06', true, false),
  ('immobilier.forfait_charges_professionnel', 2026, null, 40, 'pourcent', 'Location à usage professionnel — forfait légal de charges déductible', 'https://fin.belgium.be/fr/particuliers/habitation/louer-donner-location/revenus-locatifs/professionnel', '2026-09-06', true, false),
  ('droits_enregistrement.propre_unique', 2026, 'wallonie', 3, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true, false),
  ('droits_enregistrement.autre', 2026, 'wallonie', 12.5, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true, false),
  ('droits_enregistrement.propre_unique', 2026, 'flandre', 2, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true, false),
  ('droits_enregistrement.autre', 2026, 'flandre', 12, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true, false),
  ('droits_enregistrement.propre_unique', 2026, 'bruxelles', 12.5, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Bruxelles, avec abattement)', 'https://fiscalite.brussels', '2026-09-01', true, false),
  ('droits_enregistrement.autre', 2026, 'bruxelles', 12.5, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Bruxelles)', 'https://fiscalite.brussels', '2026-09-01', true, false),
  ('droits_enregistrement.abattement', 2026, 'bruxelles', 200000, 'eur', 'Droits d''enregistrement — abattement sur la première tranche (Bruxelles)', 'https://www.notaire.be/immobilier/acheter-et-vendre-un-bien-immobilier/les-frais-lies-lachat/droits-denregistrement-reduction-et-abattement-bruxelles', '2026-09-06', true, false),
  ('droits_enregistrement.abattement_prix_max', 2026, 'bruxelles', 600000, 'eur', 'Abattement bruxellois — prix d''achat maximum pour en bénéficier', 'https://www.notaire.be/immobilier/acheter-et-vendre-un-bien-immobilier/les-frais-lies-lachat/droits-denregistrement-reduction-et-abattement-bruxelles', '2026-09-06', true, false),
  ('droits_enregistrement.abattement', 2026, 'wallonie', 0, 'eur', 'Droits d''enregistrement — pas d''abattement (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true, false),
  ('droits_enregistrement.abattement', 2026, 'flandre', 0, 'eur', 'Droits d''enregistrement — pas d''abattement (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true, false),
  ('droits_enregistrement.duree_maintien_residence', 2026, 'wallonie', 3, 'annees', 'Taux réduit wallon — durée minimale de maintien de la résidence principale', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true, false),
  ('immobilier.tva_neuf', 2026, null, 21, 'pourcent', 'TVA sur un bien neuf, en lieu et place des droits d’enregistrement', 'https://finances.belgium.be/fr/particuliers/habitation/tva', '2026-09-01', true, false),
  ('notaire.droit_annexes', 2026, null, 100, 'eur', 'Droit pour les annexes de l''acte', 'https://www.notaire.be/calcul-de-frais/achat', '2026-09-06', true, false),
  ('notaire.frais_administratifs', 2026, null, 855, 'eur', 'Frais administratifs du notaire', 'https://www.notaire.be/calcul-de-frais/achat', '2026-09-06', true, false),
  ('notaire.debours', 2026, null, 309, 'eur', 'Débours — recherches et formalités avancées par le notaire', 'https://www.notaire.be/calcul-de-frais/achat', '2026-09-06', true, false),
  ('notaire.transcription_hypothecaire', 2026, null, 285, 'eur', 'Transcription hypothécaire de l''acte d''achat', 'https://www.notaire.be/calcul-de-frais/achat', '2026-09-06', true, false),
  ('notaire.droit_ecriture', 2026, null, 100, 'eur', 'Droit d''écriture', 'https://www.notaire.be/calcul-de-frais/achat', '2026-09-06', true, false),
  ('notaire.tva_honoraires', 2026, null, 21, 'pourcent', 'TVA sur les honoraires du notaire', 'https://www.notaire.be', '2026-09-01', true, false),
  ('credit.accessoires', 2026, null, 10, 'pourcent', 'Accessoires de l''hypothèque — majoration du montant inscrit', 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire', '2026-09-06', true, false),
  ('credit.droits_enregistrement', 2026, null, 1, 'pourcent', 'Droits d''enregistrement de l''inscription hypothécaire', 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire', '2026-09-06', true, false),
  ('credit.retribution_hypotheque', 2026, null, 270, 'eur', 'Rétribution du bureau Sécurité juridique', 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire', '2026-09-06', true, false),
  ('credit.droit_hypotheque', 2026, null, 0.3, 'pourcent', 'Droit d''hypothèque sur le montant inscrit', 'https://www.notaire.be/calcul-de-frais/credit-hypothecaire', '2026-09-06', true, false),
  ('credit.frais_dossier', 2026, null, 500, 'eur', 'Frais de dossier bancaire', 'https://www.nbb.be', '2026-09-06', true, true),
  ('credit.quotite.propre', 2026, null, 90, 'pourcent', 'Quotité de financement usuelle — habitation propre', 'https://www.nbb.be/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires', '2026-09-01', true, true),
  ('credit.quotite.locatif', 2026, null, 80, 'pourcent', 'Quotité de financement usuelle — investissement locatif', 'https://www.nbb.be/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires', '2026-09-01', true, true),
  ('credit.ratio_charge_max', 2026, null, 33, 'pourcent', 'Ratio de charge maximum usuel — mensualité sur revenus nets', 'https://www.nbb.be', '2026-09-06', true, true),
  ('credit.part_loyer_prise_en_compte', 2026, null, 75, 'pourcent', 'Part du loyer attendu prise en compte dans les revenus (locatif)', 'https://www.nbb.be', '2026-09-06', true, true),
  ('ipp.tranche_1.plafond', 2026, null, 16720, 'eur', 'IPP — plafond de la tranche à 25 %', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_1.taux', 2026, null, 25, 'pourcent', 'IPP — taux de la tranche 1', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_2.plafond', 2026, null, 29510, 'eur', 'IPP — plafond de la tranche à 40 %', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_2.taux', 2026, null, 40, 'pourcent', 'IPP — taux de la tranche 2', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_3.plafond', 2026, null, 51070, 'eur', 'IPP — plafond de la tranche à 45 %', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_3.taux', 2026, null, 45, 'pourcent', 'IPP — taux de la tranche 3', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.tranche_4.taux', 2026, null, 50, 'pourcent', 'IPP — taux marginal supérieur', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.quotite_exemptee', 2026, null, 11180, 'eur', 'IPP — quotité de revenu exemptée d''impôt', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/taux-imposition', '2026-09-06', true, false),
  ('ipp.additionnels_communaux_moyen', 2026, null, 7, 'pourcent', 'Additionnels communaux — moyenne nationale (variable par commune)', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true, false),
  ('independant.tranche_1.taux', 2026, null, 20.5, 'pourcent', 'Cotisations sociales — taux de la première tranche', 'https://www.rsvz-inasti.fgov.be/fr/faq/combien-de-cotisations-sociales-dois-je-payer', '2026-09-07', true, false),
  ('independant.tranche_1.plafond', 2026, null, 75024.54, 'eur', 'Cotisations sociales — plafond de la première tranche', 'https://www.rsvz-inasti.fgov.be/fr/faq/combien-de-cotisations-sociales-dois-je-payer', '2026-09-07', true, false),
  ('independant.tranche_2.taux', 2026, null, 14.16, 'pourcent', 'Cotisations sociales — taux de la deuxième tranche', 'https://www.liantis.be/sites/default/files/uploads/tableau_cotisations_2026_1225_FR_digitaal.pdf', '2026-09-07', true, false),
  ('independant.tranche_2.plafond', 2026, null, 110562.42, 'eur', 'Cotisations sociales — plafond au-delà duquel plus rien n’est dû', 'https://www.liantis.be/sites/default/files/uploads/tableau_cotisations_2026_1225_FR_digitaal.pdf', '2026-09-07', true, false),
  ('independant.tranche_3.taux', 2026, null, 0, 'pourcent', 'Cotisations sociales — au-delà du plafond, plus aucune cotisation', 'https://www.liantis.be/sites/default/files/uploads/tableau_cotisations_2026_1225_FR_digitaal.pdf', '2026-09-07', true, false),
  ('independant.revenu_plancher_principal', 2026, null, 17374.08, 'eur', 'Indépendant à titre principal — revenu plancher servant à la cotisation minimale', 'https://www.rsvz-inasti.fgov.be/fr/faq/combien-de-cotisations-sociales-dois-je-payer', '2026-09-07', true, false),
  ('independant.seuil_cotisations_complementaire', 2026, null, 1922.16, 'eur', 'Indépendant complémentaire — seuil annuel de revenu net sous lequel aucune cotisation n’est due', 'https://www.rsvz-inasti.fgov.be/fr/independant-titre-complementaire', '2026-09-07', true, false),
  ('independant.frais_gestion.acerta', 2026, null, 3.05, 'pourcent', 'Frais de gestion — Acerta', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.xerius', 2026, null, 3.05, 'pourcent', 'Frais de gestion — Xerius', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.liantis', 2026, null, 3.4, 'pourcent', 'Frais de gestion — Liantis', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.securex', 2026, null, 3.65, 'pourcent', 'Frais de gestion — Securex', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.group_s', 2026, null, 3.8, 'pourcent', 'Frais de gestion — Group S', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.partena', 2026, null, 4.25, 'pourcent', 'Frais de gestion — Partena Professional', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.ucm', 2026, null, 4.25, 'pourcent', 'Frais de gestion — UCM', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion.cnasti', 2026, null, 4.25, 'pourcent', 'Frais de gestion — Caisse nationale auxiliaire (CNASTI)', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.frais_gestion_caisse', 2026, null, 3.65, 'pourcent', 'Frais de gestion — valeur retenue à défaut de caisse choisie', 'https://www.mon-secretariat-social.be/caisse-assurance-sociale/', '2026-09-06', true, false),
  ('independant.cout_bce', 2026, null, 105.5, 'eur', 'Inscription à la BCE via un guichet d''entreprises', 'https://economie.fgov.be', '2026-09-01', false, false),
  ('independant.cout_activation_tva', 2026, null, 78, 'eur', 'Activation du numéro de TVA (TVAC)', 'https://economie.fgov.be', '2026-09-01', false, false),
  ('tva.seuil_franchise', 2026, null, 25000, 'eur', 'TVA — seuil de chiffre d''affaires du régime de franchise', 'https://finances.belgium.be/fr/entreprises/tva/assujettissement/franchise', '2026-09-01', true, false),
  ('epargne_pension.plafond_bas', 2026, null, 1050, 'eur', 'Épargne-pension — plafond bas de versement', 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-06', true, false),
  ('epargne_pension.reduction_bas', 2026, null, 30, 'pourcent', 'Épargne-pension — taux de réduction d''impôt au plafond bas', 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-06', true, false),
  ('epargne_pension.plafond_haut', 2026, null, 1350, 'eur', 'Épargne-pension — plafond haut de versement', 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-06', true, false),
  ('epargne_pension.reduction_haut', 2026, null, 25, 'pourcent', 'Épargne-pension — taux de réduction d''impôt au plafond haut', 'https://fin.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-06', true, false),
  ('epargne_pension.taxe_anticipative', 2026, null, 8, 'pourcent', 'Épargne-pension — taxe anticipative prélevée à 60 ans', 'https://www.wikifin.be/fr/pension-et-preparation-de-la-retraite/epargne-pension/comment-votre-epargne-pension-est-elle-taxee', '2026-09-06', true, false),
  ('epargne_long_terme.plafond_absolu', 2026, null, 2450, 'eur', 'Épargne à long terme — plafond annuel de versement', 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme', '2026-09-06', true, false),
  ('epargne_long_terme.reduction', 2026, null, 30, 'pourcent', 'Épargne à long terme — taux de réduction d''impôt', 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme', '2026-09-06', true, false),
  ('epargne_long_terme.taxe_anticipative', 2026, null, 10, 'pourcent', 'Épargne à long terme — taxe prélevée à 60 ans', 'https://www.wikifin.be/fr/impots-emploi-et-revenus/declaration-dimpots/reductions-fiscales/reduction-pour-lepargne-long-terme', '2026-09-06', true, false),
  ('epargne_long_terme.seuil_bareme', 2026, null, 17070, 'eur', 'Épargne à long terme — seuil de revenus du barème du plafond', 'https://calculateur-de-salaire.be/guide/epargne-long-terme-belgique', '2026-09-06', false, false),
  ('epargne_long_terme.taux_premiere_tranche', 2026, null, 15, 'pourcent', 'Épargne à long terme — taux sur la première tranche de revenus', 'https://calculateur-de-salaire.be/guide/epargne-long-terme-belgique', '2026-09-06', false, false),
  ('epargne_long_terme.taux_tranche_superieure', 2026, null, 6, 'pourcent', 'Épargne à long terme — taux au-delà du seuil', 'https://calculateur-de-salaire.be/guide/epargne-long-terme-belgique', '2026-09-06', false, false),
  ('assurance.taxe_prime', 2026, null, 2, 'pourcent', 'Branche 21 et 23 — taxe sur la prime à l''entrée', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('branche21.duree_exoneration', 2026, null, 8, 'annees', 'Branche 21 — durée au-delà de laquelle les intérêts échappent au précompte', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true, false),
  ('hypothese.inflation_defaut', 2026, null, 2, 'pourcent', 'Inflation annuelle retenue par défaut dans les projections', 'https://statbel.fgov.be/fr/themes/prix-la-consommation', '2026-09-01', true, true),
  ('hypothese.taux_retrait_defaut', 2026, null, 4, 'pourcent', 'Taux de retrait annuel retenu par défaut', 'https://statbel.fgov.be', '2026-09-06', true, true)
on conflict (cle, annee, region) do update set
  valeur = excluded.valeur,
  unite = excluded.unite,
  libelle = excluded.libelle,
  source_url = excluded.source_url,
  verifie_le = excluded.verifie_le,
  verifie = excluded.verifie,
  hypothese = excluded.hypothese,
  updated_at = now();

-- Le catalogue fait autorité : un paramètre retiré du code doit disparaître de
-- la base, sinon il continuerait d'être lu sans que rien ne le signale.
delete from tax_parameters
where annee = 2026
  and cle not in ('precompte_mobilier.taux', 'precompte_mobilier.exoneration_dividendes', 'epargne_reglementee.exoneration_interets', 'epargne_reglementee.taux_precompte_reduit', 'tob.taux.actions_etrangeres', 'tob.taux.distribuant_belge', 'tob.taux.capitalisant_belge', 'tob.plafond.actions_etrangeres', 'tob.plafond.distribuant_belge', 'tob.plafond.capitalisant_belge', 'plus_values.taux', 'plus_values.exoneration_annuelle', 'reynders.seuil_part_obligataire', 'reynders.taux', 'rc.coefficient_indexation', 'rc.majoration_locatif', 'immobilier.coefficient_revalorisation', 'immobilier.forfait_charges_professionnel', 'droits_enregistrement.propre_unique', 'droits_enregistrement.autre', 'droits_enregistrement.abattement', 'droits_enregistrement.abattement_prix_max', 'droits_enregistrement.duree_maintien_residence', 'immobilier.tva_neuf', 'notaire.droit_annexes', 'notaire.frais_administratifs', 'notaire.debours', 'notaire.transcription_hypothecaire', 'notaire.droit_ecriture', 'notaire.tva_honoraires', 'credit.accessoires', 'credit.droits_enregistrement', 'credit.retribution_hypotheque', 'credit.droit_hypotheque', 'credit.frais_dossier', 'credit.quotite.propre', 'credit.quotite.locatif', 'credit.ratio_charge_max', 'credit.part_loyer_prise_en_compte', 'ipp.tranche_1.plafond', 'ipp.tranche_1.taux', 'ipp.tranche_2.plafond', 'ipp.tranche_2.taux', 'ipp.tranche_3.plafond', 'ipp.tranche_3.taux', 'ipp.tranche_4.taux', 'ipp.quotite_exemptee', 'ipp.additionnels_communaux_moyen', 'independant.tranche_1.taux', 'independant.tranche_1.plafond', 'independant.tranche_2.taux', 'independant.tranche_2.plafond', 'independant.tranche_3.taux', 'independant.revenu_plancher_principal', 'independant.seuil_cotisations_complementaire', 'independant.frais_gestion.acerta', 'independant.frais_gestion.xerius', 'independant.frais_gestion.liantis', 'independant.frais_gestion.securex', 'independant.frais_gestion.group_s', 'independant.frais_gestion.partena', 'independant.frais_gestion.ucm', 'independant.frais_gestion.cnasti', 'independant.frais_gestion_caisse', 'independant.cout_bce', 'independant.cout_activation_tva', 'tva.seuil_franchise', 'epargne_pension.plafond_bas', 'epargne_pension.reduction_bas', 'epargne_pension.plafond_haut', 'epargne_pension.reduction_haut', 'epargne_pension.taxe_anticipative', 'epargne_long_terme.plafond_absolu', 'epargne_long_terme.reduction', 'epargne_long_terme.taxe_anticipative', 'epargne_long_terme.seuil_bareme', 'epargne_long_terme.taux_premiere_tranche', 'epargne_long_terme.taux_tranche_superieure', 'assurance.taxe_prime', 'branche21.duree_exoneration', 'hypothese.inflation_defaut', 'hypothese.taux_retrait_defaut');
