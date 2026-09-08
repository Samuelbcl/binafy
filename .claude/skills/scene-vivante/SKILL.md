---
name: scene-vivante
description: Ajouter ou retoucher une scène vivante d'objectif dans Nestor — l'illustration SVG qui se construit avec la progression (maison brique par brique, avion d'escale en escale). À invoquer quand une inspiration d'objectif n'a pas encore sa scène, ou qu'une scène existante doit changer.
---

# Scène vivante d'objectif

Une scène est une illustration SVG dont l'état dépend de la progression d'un
objectif (0 → 1). Elle vit dans `src/components/objectifs/scene-objectif.tsx`
et s'affiche en bande sur la carte d'objectif, en vignette sur le tableau de
bord, et en direct sous les curseurs du parcours de création.

## Avant de dessiner

1. Lis `scene-objectif.tsx` en entier : `Etapes`, `etapesAtteintes`, et les
   scènes existantes (`Maison`, `Matelas`, `Voyage`, `Soleil`, `Bocal`).
2. Lis la section « Les scènes vivantes » de `docs/05-design-system.md` et la
   règle CSS `.scene-etape` dans `src/app/globals.css`.
3. Si le sujet demande une réflexion sur le mouvement (quelque chose se
   déplace plutôt que de se poser), demande une partition à l'agent
   `motion-designer` avant d'écrire.

## Règles

- **ViewBox `0 0 160 100`**, formes simples, deux tons issus de
  `var(--teinte)` (pleine, et `opacity` 0.62) plus `var(--surface)` pour les
  creux et `var(--text-subtle)` pour le sol ou les nuages. Aucun détail sous 4
  unités : la scène vit à 96 px de large sur le tableau de bord.
- **La progression pilote des étapes discrètes.** Une brique, une escale, un
  rayon. Jamais un morphing continu : on doit pouvoir dire ce qui manque.
  `etapesAtteintes(progression, total)` fait l'arrondi et garde la dernière
  étape pour 100 %.
- **L'ordre raconte le sujet**, de la base vers la récompense. La dernière
  étape est la récompense : fumée, fanion, écusson, couvercle.
- **Une étape = un `<g className="scene-etape">`** rendu par `Etapes`. Le rang
  décide du délai de pose (55 ms par rang, plafonné à 18). Ce qui se déplace
  au lieu de se poser (avion, soleil) porte sa propre classe avec une
  `transition` sur `transform` ou l'attribut concerné.
- **Décorative** : le `<svg>` racine est `aria-hidden`. La progression est
  déjà dite en texte et en barre.
- **Aucune valeur métier** dans la scène : elle reçoit une progression, pas
  des euros.

## Brancher une nouvelle scène

1. Écris la fonction `MaScene({ progression })` sur le modèle des existantes :
   construis le tableau `etapes`, calcule `atteint`, rends les éléments fixes
   puis `<Etapes etapes={etapes} atteint={atteint} />`.
2. Ajoute-la dans `SCENES` sous la clé d'icône (`IconeObjectif`) qu'elle
   illustre. Tant qu'une clé n'a pas de scène, `Bocal` sert de repli.
3. Vérifie à trois progressions — 0, ~0,6 et 1 — avec
   `node scripts/captures-mobile.mjs captures` (le script sème deux objectifs)
   puis `node scripts/rogner-capture.mjs captures/app-objectifs.png
   captures/zone.png 900 600` pour la zone concernée. Pour tester une
   progression donnée, change temporairement le seed du script, jamais le
   composant.
4. `npm run typecheck`, `npm run lint`. Pas de test unitaire sur un dessin ;
   `etapesAtteintes` est la seule logique, et elle est partagée.
