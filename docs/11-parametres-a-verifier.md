# 11 — Paramètres fiscaux à vérifier

> **Fichier généré.** Régénérer avec `node scripts/generer-seed-fiscal.mjs`.
> Source : `src/lib/tax/parametres.ts`.

84 paramètres sont chargés pour 2026.
**69 sont confirmés** — leur valeur est chiffrée explicitement dans
`docs/06-fiscalite-belge.md`.
**11 règles légales attendent une confirmation** à la source officielle.
7 autres valeurs sont des pratiques de marché ou des hypothèses de
simulation : elles ne relèvent d'aucun texte et ne figurent pas dans cette liste.

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

### independant

Source à consulter : INASTI et caisses d’assurances sociales

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `independant.cout_bce` | 105.5 eur | Inscription à la BCE via un guichet d'entreprises |
| `independant.cout_activation_tva` | 78 eur | Activation du numéro de TVA (TVAC) |

### notaire

Source à consulter : Barème légal des honoraires notariaux (notaire.be)

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `notaire.achat.tranche_4.plafond` | 45495 eur | Honoraires notaire — plafond tranche 4 |
| `notaire.achat.tranche_4.taux` | 1.71 pourcent | Honoraires notaire — taux tranche 4 |
| `notaire.achat.tranche_5.plafond` | 64095 eur | Honoraires notaire — plafond tranche 5 |
| `notaire.achat.tranche_5.taux` | 1.14 pourcent | Honoraires notaire — taux tranche 5 |
| `notaire.achat.tranche_6.plafond` | 250095 eur | Honoraires notaire — plafond tranche 6 |
| `notaire.achat.tranche_6.taux` | 0.57 pourcent | Honoraires notaire — taux tranche 6 |
| `notaire.frais_debours` | 1100 eur | Frais et débours administratifs forfaitaires (recherches, transcription) |

## Rappel

Cette vérification est une tâche récurrente inscrite dans la roadmap : chaque
janvier, une session dédiée met à jour `tax_parameters` pour la nouvelle année
(`docs/08-roadmap.md` § entretien récurrent).
