# 11 — Paramètres fiscaux à vérifier

> **Fichier généré.** Régénérer avec `node scripts/generer-seed-fiscal.mjs`.
> Source : `src/lib/tax/parametres.ts`.

76 paramètres sont chargés pour 2026.
**38 sont confirmés** — leur valeur est chiffrée explicitement dans
`docs/06-fiscalite-belge.md`.
**38 attendent une confirmation** à la source officielle.

## Comment ça marche

Les valeurs non vérifiées sont des **ordres de grandeur**, nécessaires pour que
l’application calcule quelque chose. Elles portent `verifie = false`, et l’interface
affiche un avertissement sur tout résultat qui en dépend : on préfère le dire plutôt
que de laisser croire à une précision qu’on n’a pas.

Aucune de ces valeurs n’a été inventée silencieusement. Elles sont toutes ici.

## Procédure

Pour chaque paramètre ci-dessous :

1. ouvrir la source officielle indiquée ;
2. relever la valeur en vigueur pour l’année 2026 ;
3. corriger `valeur` dans `src/lib/tax/parametres.ts`, passer `verifie: true`
   et mettre `verifieLe` à la date du jour ;
4. régénérer le seed : `node scripts/generer-seed-fiscal.mjs` ;
5. relancer les tests : `npm test`.

Les tests du moteur fiscal encodent des cas métier chiffrés. Si une correction
en casse un, c’est le test qu’il faut relire d’abord : il documente peut-être la
bonne valeur.

## Liste par domaine

### credit

Source à consulter : Banque nationale de Belgique et pratique bancaire

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `credit.droit_hypotheque` | 1 pourcent | Droit d'hypothèque sur le montant emprunté |
| `credit.frais_acte_forfait` | 2200 eur | Acte de crédit — honoraires, inscription hypothécaire et débours |
| `credit.frais_dossier` | 500 eur | Frais de dossier bancaire |
| `credit.ratio_charge_max` | 33 pourcent | Ratio de charge maximum usuel — mensualité sur revenus nets |
| `credit.part_loyer_prise_en_compte` | 75 pourcent | Part du loyer attendu prise en compte dans les revenus (locatif) |

### droits_enregistrement

Source à consulter : Région concernée (logement.wallonie.be, vlaanderen.be, fiscalite.brussels)

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `droits_enregistrement.abattement` (bruxelles) | 200000 eur | Droits d'enregistrement — abattement sur la première tranche (Bruxelles) |
| `droits_enregistrement.abattement_prix_max` (bruxelles) | 600000 eur | Abattement bruxellois — prix d'achat maximum pour en bénéficier |

### epargne_pension

Source à consulter : SPF Finances — avantages fiscaux

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `epargne_pension.plafond_bas` | 1050 eur | Épargne-pension — plafond bas de versement |
| `epargne_pension.reduction_bas` | 30 pourcent | Épargne-pension — taux de réduction d'impôt au plafond bas |
| `epargne_pension.plafond_haut` | 1350 eur | Épargne-pension — plafond haut de versement |
| `epargne_pension.reduction_haut` | 25 pourcent | Épargne-pension — taux de réduction d'impôt au plafond haut |
| `epargne_pension.taxe_anticipative` | 8 pourcent | Épargne-pension — taxe anticipative prélevée à 60 ans |

### hypothese

Source à consulter : Hypothèse de simulation, pas un paramètre légal

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `hypothese.taux_retrait_defaut` | 4 pourcent | Taux de retrait annuel retenu par défaut |

### immobilier

Source à consulter : SPF Finances — revenus immobiliers

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `immobilier.forfait_charges_professionnel` | 40 pourcent | Location à usage professionnel — forfait légal de charges déductible |

### independant

Source à consulter : INASTI et caisses d’assurances sociales

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `independant.frais_gestion_caisse` | 4 pourcent | Frais de gestion de la caisse d'assurances sociales |
| `independant.cout_bce` | 105.5 eur | Inscription à la BCE via un guichet d'entreprises |
| `independant.cout_activation_tva` | 78 eur | Activation du numéro de TVA (TVAC) |

### ipp

Source à consulter : SPF Finances — barème IPP indexé de l’année

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `ipp.tranche_1.plafond` | 16320 eur | IPP — plafond de la tranche à 25 % |
| `ipp.tranche_2.plafond` | 28830 eur | IPP — plafond de la tranche à 40 % |
| `ipp.tranche_3.plafond` | 49840 eur | IPP — plafond de la tranche à 45 % |
| `ipp.quotite_exemptee` | 10570 eur | IPP — quotité de revenu exemptée d'impôt |
| `ipp.forfait_frais_professionnels` | 30 pourcent | Forfait légal de frais professionnels sur les revenus de remplacement |

### notaire

Source à consulter : Barème légal des honoraires notariaux (notaire.be)

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `notaire.achat.tranche_1.plafond` | 7500 eur | Honoraires notaire — plafond tranche 1 |
| `notaire.achat.tranche_1.taux` | 4.56 pourcent | Honoraires notaire — taux tranche 1 |
| `notaire.achat.tranche_2.plafond` | 17500 eur | Honoraires notaire — plafond tranche 2 |
| `notaire.achat.tranche_2.taux` | 2.85 pourcent | Honoraires notaire — taux tranche 2 |
| `notaire.achat.tranche_3.plafond` | 30000 eur | Honoraires notaire — plafond tranche 3 |
| `notaire.achat.tranche_3.taux` | 2.28 pourcent | Honoraires notaire — taux tranche 3 |
| `notaire.achat.tranche_4.plafond` | 45495 eur | Honoraires notaire — plafond tranche 4 |
| `notaire.achat.tranche_4.taux` | 1.71 pourcent | Honoraires notaire — taux tranche 4 |
| `notaire.achat.tranche_5.plafond` | 64095 eur | Honoraires notaire — plafond tranche 5 |
| `notaire.achat.tranche_5.taux` | 1.14 pourcent | Honoraires notaire — taux tranche 5 |
| `notaire.achat.tranche_6.plafond` | 250095 eur | Honoraires notaire — plafond tranche 6 |
| `notaire.achat.tranche_6.taux` | 0.57 pourcent | Honoraires notaire — taux tranche 6 |
| `notaire.achat.tranche_7.taux` | 0.057 pourcent | Honoraires notaire — taux au-delà de la tranche 6 |
| `notaire.frais_debours` | 1100 eur | Frais et débours administratifs forfaitaires (recherches, transcription) |

### rc

Source à consulter : Statbel — coefficient d’indexation du revenu cadastral

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `rc.coefficient_indexation` | 2.1763 coefficient | Revenu cadastral — coefficient d'indexation de l'année |

### reynders

Source à consulter : SPF Finances — plus-values de fonds obligataires

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `reynders.taux` | 30 pourcent | Taxe Reynders — taux sur la composante intérêts à la vente |

## Rappel

Cette vérification est une tâche récurrente inscrite dans la roadmap : chaque
janvier, une session dédiée met à jour `tax_parameters` pour la nouvelle année
(`docs/08-roadmap.md` § entretien récurrent).
