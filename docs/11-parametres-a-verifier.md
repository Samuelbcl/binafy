# 11 — Paramètres fiscaux à vérifier

> **Fichier généré.** Régénérer avec `node scripts/generer-seed-fiscal.mjs`.
> Source : `src/lib/tax/parametres.ts`.

88 paramètres sont chargés pour 2026.
**83 sont confirmés** — leur valeur est chiffrée explicitement dans
`docs/06-fiscalite-belge.md`.
**5 règles légales attendent une confirmation** à la source officielle.
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

### epargne_long_terme

Source à consulter : à déterminer

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `epargne_long_terme.seuil_bareme` | 17070 eur | Épargne à long terme — seuil de revenus du barème du plafond |
| `epargne_long_terme.taux_premiere_tranche` | 15 pourcent | Épargne à long terme — taux sur la première tranche de revenus |
| `epargne_long_terme.taux_tranche_superieure` | 6 pourcent | Épargne à long terme — taux au-delà du seuil |

### independant

Source à consulter : INASTI et caisses d’assurances sociales

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `independant.cout_bce` | 105.5 eur | Inscription à la BCE via un guichet d'entreprises |
| `independant.cout_activation_tva` | 78 eur | Activation du numéro de TVA (TVAC) |

## Rappel

Cette vérification est une tâche récurrente inscrite dans la roadmap : chaque
janvier, une session dédiée met à jour `tax_parameters` pour la nouvelle année
(`docs/08-roadmap.md` § entretien récurrent).
