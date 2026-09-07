# 11 — Paramètres fiscaux à vérifier

> **Fichier généré.** Régénérer avec `node scripts/generer-seed-fiscal.mjs`.
> Source : `src/lib/tax/parametres.ts`.

90 paramètres sont chargés pour 2026.
**89 sont confirmés** — leur valeur est chiffrée explicitement dans
`docs/06-fiscalite-belge.md`.
**1 règles légales attendent une confirmation** à la source officielle.
8 autres valeurs sont des pratiques de marché ou des hypothèses de
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

### independant

Source à consulter : INASTI et caisses d’assurances sociales

| Clé | Valeur provisoire | Libellé |
|---|---|---|
| `independant.frais_gestion.cnasti` | 4.2 pourcent | Frais de gestion — Caisse nationale auxiliaire |

## Rappel

Cette vérification est une tâche récurrente inscrite dans la roadmap : chaque
janvier, une session dédiée met à jour `tax_parameters` pour la nouvelle année
(`docs/08-roadmap.md` § entretien récurrent).
