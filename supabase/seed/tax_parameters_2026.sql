-- ─────────────────────────────────────────────────────────────
-- Nestor — paramètres fiscaux belges 2026
--
-- ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
-- Source : src/lib/tax/parametres.ts
-- Régénérer : node scripts/generer-seed-fiscal.mjs
--
-- 76 paramètres, dont 38 confirmés à la source
-- et 38 en attente de vérification
-- (voir docs/11-parametres-a-verifier.md).
--
-- Mettre à jour un taux pour une nouvelle année = insérer des lignes ici,
-- jamais modifier du code.
-- ─────────────────────────────────────────────────────────────

insert into tax_parameters
  (cle, annee, region, valeur, unite, libelle, source_url, verifie_le, verifie)
values
  ('precompte_mobilier.taux', 2026, null, 30, 'pourcent', 'Précompte mobilier — taux standard sur dividendes et intérêts', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('precompte_mobilier.exoneration_dividendes', 2026, null, 833, 'eur', 'Dividendes — première tranche exonérée par personne et par an (via déclaration)', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true),
  ('epargne_reglementee.exoneration_interets', 2026, null, 1020, 'eur', 'Compte d''épargne réglementé — plafond annuel d''intérêts exonérés', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true),
  ('epargne_reglementee.taux_precompte_reduit', 2026, null, 15, 'pourcent', 'Compte d''épargne réglementé — précompte réduit au-delà du plafond exonéré', 'https://fin.belgium.be/fr/particuliers/declaration_impot/taux-imposition-revenus/revenus/revenus-mobiliers', '2026-09-06', true),
  ('tob.taux.actions_etrangeres', 2026, null, 0.12, 'pourcent', 'TOB — actions et ETF cotés hors registre belge', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true),
  ('tob.taux.distribuant_belge', 2026, null, 0.35, 'pourcent', 'TOB — actions et ETF distribuants inscrits en Belgique', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true),
  ('tob.taux.capitalisant_belge', 2026, null, 1.32, 'pourcent', 'TOB — fonds capitalisants inscrits en Belgique', 'https://finances.belgium.be/fr/particuliers/declaration_impot/taxe-operations-boursieres', '2026-09-01', true),
  ('tob.plafond.actions_etrangeres', 2026, null, 1300, 'eur', 'TOB — plafond par opération, actions et ETF hors registre belge', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true),
  ('tob.plafond.distribuant_belge', 2026, null, 1600, 'eur', 'TOB — plafond par opération, distribuants inscrits en Belgique', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true),
  ('tob.plafond.capitalisant_belge', 2026, null, 4000, 'eur', 'TOB — plafond par opération, fonds capitalisants inscrits en Belgique', 'https://blog.oeccbb.be/fr/article/circulaire-2026c42-faq-tob-taxe-sur-les-operations-de-bourse-version-2/30750', '2026-09-06', true),
  ('plus_values.taux', 2026, null, 10, 'pourcent', 'Taxe sur les plus-values sur actifs financiers', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('plus_values.exoneration_annuelle', 2026, null, 10000, 'eur', 'Taxe sur les plus-values — exonération annuelle par personne', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('reynders.seuil_part_obligataire', 2026, null, 10, 'pourcent', 'Taxe Reynders — seuil de part obligataire déclenchant la taxe', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('reynders.taux', 2026, null, 30, 'pourcent', 'Taxe Reynders — taux sur la composante intérêts à la vente', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', false),
  ('rc.coefficient_indexation', 2026, null, 2.1763, 'coefficient', 'Revenu cadastral — coefficient d''indexation de l''année', 'https://statbel.fgov.be/fr/themes/prix-la-consommation/indice-des-prix-la-consommation', '2026-09-01', false),
  ('rc.majoration_locatif', 2026, null, 1.4, 'coefficient', 'Revenu cadastral — majoration de 40 % pour un bien loué à usage privé', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-immobiliers', '2026-09-01', true),
  ('immobilier.forfait_charges_professionnel', 2026, null, 40, 'pourcent', 'Location à usage professionnel — forfait légal de charges déductible', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-immobiliers', '2026-09-01', false),
  ('droits_enregistrement.propre_unique', 2026, 'wallonie', 3, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true),
  ('droits_enregistrement.autre', 2026, 'wallonie', 12.5, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true),
  ('droits_enregistrement.propre_unique', 2026, 'flandre', 2, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true),
  ('droits_enregistrement.autre', 2026, 'flandre', 12, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true),
  ('droits_enregistrement.propre_unique', 2026, 'bruxelles', 12.5, 'pourcent', 'Droits d''enregistrement — habitation propre et unique (Bruxelles, avec abattement)', 'https://fiscalite.brussels', '2026-09-01', true),
  ('droits_enregistrement.autre', 2026, 'bruxelles', 12.5, 'pourcent', 'Droits d''enregistrement — autre bien ou locatif (Bruxelles)', 'https://fiscalite.brussels', '2026-09-01', true),
  ('droits_enregistrement.abattement', 2026, 'bruxelles', 200000, 'eur', 'Droits d''enregistrement — abattement sur la première tranche (Bruxelles)', 'https://fiscalite.brussels', '2026-09-01', false),
  ('droits_enregistrement.abattement_prix_max', 2026, 'bruxelles', 600000, 'eur', 'Abattement bruxellois — prix d''achat maximum pour en bénéficier', 'https://fiscalite.brussels', '2026-09-01', false),
  ('droits_enregistrement.abattement', 2026, 'wallonie', 0, 'eur', 'Droits d''enregistrement — pas d''abattement (Wallonie)', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true),
  ('droits_enregistrement.abattement', 2026, 'flandre', 0, 'eur', 'Droits d''enregistrement — pas d''abattement (Flandre)', 'https://www.vlaanderen.be/registratiebelasting', '2026-09-01', true),
  ('droits_enregistrement.duree_maintien_residence', 2026, 'wallonie', 3, 'annees', 'Taux réduit wallon — durée minimale de maintien de la résidence principale', 'https://logement.wallonie.be/fr/droits-enregistrement', '2026-09-01', true),
  ('immobilier.tva_neuf', 2026, null, 21, 'pourcent', 'TVA sur un bien neuf, en lieu et place des droits d’enregistrement', 'https://finances.belgium.be/fr/particuliers/habitation/tva', '2026-09-01', true),
  ('notaire.achat.tranche_1.plafond', 2026, null, 7500, 'eur', 'Honoraires notaire — plafond tranche 1', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_1.taux', 2026, null, 4.56, 'pourcent', 'Honoraires notaire — taux tranche 1', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_2.plafond', 2026, null, 17500, 'eur', 'Honoraires notaire — plafond tranche 2', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_2.taux', 2026, null, 2.85, 'pourcent', 'Honoraires notaire — taux tranche 2', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_3.plafond', 2026, null, 30000, 'eur', 'Honoraires notaire — plafond tranche 3', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_3.taux', 2026, null, 2.28, 'pourcent', 'Honoraires notaire — taux tranche 3', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_4.plafond', 2026, null, 45495, 'eur', 'Honoraires notaire — plafond tranche 4', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_4.taux', 2026, null, 1.71, 'pourcent', 'Honoraires notaire — taux tranche 4', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_5.plafond', 2026, null, 64095, 'eur', 'Honoraires notaire — plafond tranche 5', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_5.taux', 2026, null, 1.14, 'pourcent', 'Honoraires notaire — taux tranche 5', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_6.plafond', 2026, null, 250095, 'eur', 'Honoraires notaire — plafond tranche 6', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_6.taux', 2026, null, 0.57, 'pourcent', 'Honoraires notaire — taux tranche 6', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.achat.tranche_7.taux', 2026, null, 0.057, 'pourcent', 'Honoraires notaire — taux au-delà de la tranche 6', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.frais_debours', 2026, null, 1100, 'eur', 'Frais et débours administratifs forfaitaires (recherches, transcription)', 'https://www.notaire.be', '2026-09-01', false),
  ('notaire.tva_honoraires', 2026, null, 21, 'pourcent', 'TVA sur les honoraires du notaire', 'https://www.notaire.be', '2026-09-01', true),
  ('credit.droit_hypotheque', 2026, null, 1, 'pourcent', 'Droit d''hypothèque sur le montant emprunté', 'https://finances.belgium.be/fr/particuliers/habitation/emprunt', '2026-09-01', false),
  ('credit.frais_acte_forfait', 2026, null, 2200, 'eur', 'Acte de crédit — honoraires, inscription hypothécaire et débours', 'https://www.notaire.be', '2026-09-01', false),
  ('credit.frais_dossier', 2026, null, 500, 'eur', 'Frais de dossier bancaire', 'https://www.nbb.be', '2026-09-01', false),
  ('credit.quotite.propre', 2026, null, 90, 'pourcent', 'Quotité de financement usuelle — habitation propre', 'https://www.nbb.be/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires', '2026-09-01', true),
  ('credit.quotite.locatif', 2026, null, 80, 'pourcent', 'Quotité de financement usuelle — investissement locatif', 'https://www.nbb.be/fr/supervision-financiere/controle-prudentiel/domaines-de-controle/credits-hypothecaires', '2026-09-01', true),
  ('credit.ratio_charge_max', 2026, null, 33, 'pourcent', 'Ratio de charge maximum usuel — mensualité sur revenus nets', 'https://www.nbb.be', '2026-09-01', false),
  ('credit.part_loyer_prise_en_compte', 2026, null, 75, 'pourcent', 'Part du loyer attendu prise en compte dans les revenus (locatif)', 'https://www.nbb.be', '2026-09-01', false),
  ('ipp.tranche_1.plafond', 2026, null, 16320, 'eur', 'IPP — plafond de la tranche à 25 %', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', false),
  ('ipp.tranche_1.taux', 2026, null, 25, 'pourcent', 'IPP — taux de la tranche 1', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true),
  ('ipp.tranche_2.plafond', 2026, null, 28830, 'eur', 'IPP — plafond de la tranche à 40 %', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', false),
  ('ipp.tranche_2.taux', 2026, null, 40, 'pourcent', 'IPP — taux de la tranche 2', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true),
  ('ipp.tranche_3.plafond', 2026, null, 49840, 'eur', 'IPP — plafond de la tranche à 45 %', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', false),
  ('ipp.tranche_3.taux', 2026, null, 45, 'pourcent', 'IPP — taux de la tranche 3', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true),
  ('ipp.tranche_4.taux', 2026, null, 50, 'pourcent', 'IPP — taux marginal supérieur', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true),
  ('ipp.quotite_exemptee', 2026, null, 10570, 'eur', 'IPP — quotité de revenu exemptée d''impôt', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', false),
  ('ipp.additionnels_communaux_moyen', 2026, null, 7, 'pourcent', 'Additionnels communaux — moyenne nationale (variable par commune)', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', true),
  ('ipp.forfait_frais_professionnels', 2026, null, 30, 'pourcent', 'Forfait légal de frais professionnels sur les revenus de remplacement', 'https://finances.belgium.be/fr/particuliers/declaration_impot', '2026-09-01', false),
  ('independant.cotisations_taux', 2026, null, 20.5, 'pourcent', 'Cotisations sociales — taux sur le revenu net imposable', 'https://www.rsvz-inasti.fgov.be', '2026-09-01', true),
  ('independant.seuil_cotisations_complementaire', 2026, null, 1922.16, 'eur', 'Indépendant complémentaire — seuil annuel de revenu net sous lequel aucune cotisation n’est due', 'https://www.rsvz-inasti.fgov.be', '2026-09-01', true),
  ('independant.frais_gestion_caisse', 2026, null, 4, 'pourcent', 'Frais de gestion de la caisse d''assurances sociales', 'https://www.rsvz-inasti.fgov.be', '2026-09-01', false),
  ('independant.cout_bce', 2026, null, 105.5, 'eur', 'Inscription à la BCE via un guichet d''entreprises', 'https://economie.fgov.be', '2026-09-01', false),
  ('independant.cout_activation_tva', 2026, null, 78, 'eur', 'Activation du numéro de TVA (TVAC)', 'https://economie.fgov.be', '2026-09-01', false),
  ('tva.seuil_franchise', 2026, null, 25000, 'eur', 'TVA — seuil de chiffre d''affaires du régime de franchise', 'https://finances.belgium.be/fr/entreprises/tva/assujettissement/franchise', '2026-09-01', true),
  ('epargne_pension.plafond_bas', 2026, null, 1050, 'eur', 'Épargne-pension — plafond bas de versement', 'https://finances.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-01', false),
  ('epargne_pension.reduction_bas', 2026, null, 30, 'pourcent', 'Épargne-pension — taux de réduction d''impôt au plafond bas', 'https://finances.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-01', false),
  ('epargne_pension.plafond_haut', 2026, null, 1350, 'eur', 'Épargne-pension — plafond haut de versement', 'https://finances.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-01', false),
  ('epargne_pension.reduction_haut', 2026, null, 25, 'pourcent', 'Épargne-pension — taux de réduction d''impôt au plafond haut', 'https://finances.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-01', false),
  ('epargne_pension.taxe_anticipative', 2026, null, 8, 'pourcent', 'Épargne-pension — taxe anticipative prélevée à 60 ans', 'https://finances.belgium.be/fr/particuliers/avantages_fiscaux/epargne-pension', '2026-09-01', false),
  ('assurance.taxe_prime', 2026, null, 2, 'pourcent', 'Branche 21 et 23 — taxe sur la prime à l''entrée', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('branche21.duree_exoneration', 2026, null, 8, 'annees', 'Branche 21 — durée au-delà de laquelle les intérêts échappent au précompte', 'https://finances.belgium.be/fr/particuliers/declaration_impot/revenus-mobiliers', '2026-09-01', true),
  ('hypothese.inflation_defaut', 2026, null, 2, 'pourcent', 'Inflation annuelle retenue par défaut dans les projections', 'https://statbel.fgov.be/fr/themes/prix-la-consommation', '2026-09-01', true),
  ('hypothese.taux_retrait_defaut', 2026, null, 4, 'pourcent', 'Taux de retrait annuel retenu par défaut', 'https://statbel.fgov.be', '2026-09-01', false)
on conflict (cle, annee, region) do update set
  valeur = excluded.valeur,
  unite = excluded.unite,
  libelle = excluded.libelle,
  source_url = excluded.source_url,
  verifie_le = excluded.verifie_le,
  verifie = excluded.verifie,
  updated_at = now();
