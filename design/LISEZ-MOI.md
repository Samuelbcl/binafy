# Direction visuelle

Quatre partis pris pour le tableau de bord, à trancher avant d'écrire la moindre
ligne de CSS dans `src/`. Chaque fichier `.dc.html` est une maquette statique :
on juge le look, pas l'interaction.

| Fichier               | Direction              | En une phrase                                              |
| --------------------- | ---------------------- | ---------------------------------------------------------- |
| `Main.dc.html`        | A — Nuit et laiton     | Le look actuel de `docs/05` : charbon, laiton, éditorial.   |
| `DirectionB.dc.html`  | B — Papier documentaire| Un relevé de compte : crème, serif de presse, filets.       |
| `DirectionC.dc.html`  | C — Contraste franc    | Noir et blanc, chiffres énormes, un bleu électrique.        |
| `DirectionD.dc.html`  | D — Chaleur belge      | Brique et ocre, formes rondes, typo humaniste.              |
| `MobileA.dc.html`     | A en 390 × 844         | La direction A déclinée sur téléphone.                      |

`canvas.json` place les planches sur le canevas et porte les notes qui expliquent,
pour chaque direction, ce qu'elle défend **et ce qu'elle coûte**.

## Régénérer le canevas

Le HTML assemblé fait 2,5 Mo et n'est pas versionné (voir `.gitignore`) : il se
rejoue à l'identique depuis les sources ci-dessus.

```bash
cd design
node "<dossier de la skill design>/seed-canvas.mjs" \
  --template "<dossier de la skill design>/payload.template.html" \
  --out nestor-directions-visuelles.html \
  --title "Nestor — directions visuelles" \
  --artboard Main.dc.html --artboard DirectionB.dc.html \
  --artboard DirectionC.dc.html --artboard DirectionD.dc.html \
  --artboard MobileA.dc.html \
  --canvas canvas.json
```

## Une fois la direction choisie

Les valeurs retenues remontent dans `src/app/globals.css` (`@theme inline`) et
dans `docs/05-design-system.md`. Aucune couleur ni taille ne vit en dur dans un
composant : les maquettes sont une étape, pas une référence permanente.
