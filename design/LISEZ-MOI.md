# Direction visuelle

**Direction retenue : épurée.** Fond clair, un seul accent saturé, gros titres
gras, cartes très arrondies, boutons noirs en pilule, peu d'éléments par écran.
Choisie sur références le 06/09/2026.

Chaque `.dc.html` est une maquette statique : on juge le look, pas l'interaction.

## Le parcours

| Fichier                | Écran                | Ce qu'il démontre                                          |
| ---------------------- | -------------------- | ---------------------------------------------------------- |
| `Bienvenue.dc.html`    | Bienvenue            | Aplat de couleur, pile de cartes, promesse en trois mots.   |
| `Connexion.dc.html`    | Connexion            | Lien magique seul — ni Google ni Facebook, écartés du projet.|
| `Main.dc.html`         | Accueil              | Patrimoine net, variation, répartition, ce qui a bougé.     |
| `Patrimoine.dc.html`   | Patrimoine           | Les lignes réelles, groupées par nature.                    |
| `Fiscalite.dc.html`    | Détail d'un calcul   | Un chiffre, sa décomposition, l'hypothèse, les sources.     |
| `Bureau.dc.html`       | Bureau 1200 px       | Le même langage sur grand écran.                            |
| `Fondations.dc.html`   | Fondations           | Couleurs, typo, composants, rayons — les valeurs exactes.   |

`Direction{A,B,C,D}.dc.html` et `MobileA.dc.html` sont les quatre explorations
antérieures, gardées pour mémoire.

`canvas.json` place les planches et porte les notes qui expliquent chaque choix
**et son coût**.

## Régénérer le canevas

Le HTML assemblé fait 2,5 Mo et n'est pas versionné (voir `.gitignore`) : il se
rejoue à l'identique depuis les sources ci-dessus.

```bash
cd design
node "<dossier de la skill design>/seed-canvas.mjs" \
  --template "<dossier de la skill design>/payload.template.html" \
  --out nestor-directions-visuelles.html \
  --title "Nestor — direction épurée" \
  --artboard Main.dc.html --artboard Bienvenue.dc.html \
  --artboard Connexion.dc.html --artboard Patrimoine.dc.html \
  --artboard Fiscalite.dc.html --artboard Bureau.dc.html \
  --artboard Fondations.dc.html \
  --artboard DirectionA.dc.html --artboard DirectionB.dc.html \
  --artboard DirectionC.dc.html --artboard DirectionD.dc.html \
  --artboard MobileA.dc.html \
  --canvas canvas.json
```

## Passage au code

Les valeurs de `Fondations.dc.html` remontent dans `src/app/globals.css`
(`@theme inline`) et dans `docs/05-design-system.md`. Aucune couleur ni taille
ne vit en dur dans un composant : les maquettes sont une étape, pas une
référence permanente.

Point encore ouvert : l'accent `#4F3FF0` est une proposition, pas une décision.
Il se change en une valeur.
