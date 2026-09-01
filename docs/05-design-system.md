# 05 — Design system

Objectif : la qualité perçue d'une app fintech premium, avec une identité qui n'est
copiée sur personne. On reprend les **patterns** qui marchent (dashboard sombre dense,
donut d'allocation, Sankey budgétaire, cartes bento), pas la charte d'un concurrent.

## Direction artistique

**Registre : « Dark editorial fintech ».** Sombre, dense en information, mais avec une
typographie de magazine plutôt que de terminal. Accent laiton chaud plutôt que néon,
pour évoquer la banque privée sans la froideur du SaaS générique.

Trois mots directeurs : **précis, calme, sérieux**. On manipule l'argent de gens qui
n'en ont pas beaucoup ; l'interface ne doit ni gamifier ni dramatiser.

## Tokens

```css
:root {
  /* Fonds */
  --bg:            #0B0D10;
  --surface:       #14181D;
  --surface-2:     #1C2128;
  --surface-hover: #232A33;
  --border:        #2A323C;

  /* Texte */
  --text:          #ECEFF3;
  --text-muted:    #8A94A0;
  --text-subtle:   #5C6570;

  /* Marque */
  --primary:       #C6A15B;   /* laiton */
  --primary-hover: #D9B673;
  --primary-soft:  #C6A15B1A;

  /* Sémantique */
  --positive:      #4ADE9B;
  --negative:      #F2725C;
  --warning:       #F5B841;
  --info:          #6E9DF7;

  /* Palette de données (donut, Sankey, séries) */
  --data-1: #C6A15B;  --data-2: #6E9DF7;  --data-3: #4ADE9B;
  --data-4: #B07FE0;  --data-5: #F2725C;  --data-6: #45C4D6;
  --data-7: #F5B841;  --data-8: #7C8794;

  /* Rayons et ombres */
  --radius-sm: 8px; --radius: 12px; --radius-lg: 16px; --radius-xl: 24px;
  --shadow-card: 0 1px 2px rgba(0,0,0,.3), 0 8px 24px rgba(0,0,0,.18);
  --glow-primary: 0 0 48px rgba(198,161,91,.12);
}

/* Thème clair — obligatoire, beaucoup de Belges consultent leurs comptes en plein jour */
[data-theme="light"] {
  --bg: #FAFAF8; --surface: #FFFFFF; --surface-2: #F4F4F1;
  --border: #E4E4DF; --text: #14181D; --text-muted: #5C6570;
  --primary: #8A6D2F;
}
```

## Typographie

| Rôle | Police | Usage |
|---|---|---|
| Display | **Bricolage Grotesque** (600/700) | Titres, chiffres héros du dashboard |
| Interface | **Manrope** (400/500/600) | Corps, navigation, formulaires |
| Chiffres | **JetBrains Mono** (400/500) | Tous les montants en tableau |

Le mono sur les montants n'est pas un détail : en chiffres tabulaires, les colonnes
s'alignent et les valeurs deviennent comparables d'un coup d'œil. Utiliser
`font-variant-numeric: tabular-nums` partout où un montant apparaît.

Échelle : `12 / 14 / 16 / 20 / 24 / 32 / 44 / 60`. Chiffre héros du dashboard :
`clamp(2.5rem, 6vw, 3.75rem)`, `letter-spacing: -0.03em`.

## Règles de mise en forme des montants

- Format belge : `13 656,48 €` — espace insécable comme séparateur de milliers, virgule décimale
- Variations : toujours signées, `+1 240 €` en `--positive`, `−320 €` en `--negative`
  (vrai signe moins U+2212, pas un tiret)
- Grands nombres dans les graphiques : `13,7 k€`, `1,2 M€`
- Pourcentages à une décimale, jamais deux
- **Mode discrétion** : un bouton œil remplace tous les montants par `••••`.
  Indispensable dans un train ou un open space. À implémenter en V1, pas plus tard.

## Composants clés

### Carte KPI
Fond `--surface`, bordure 1px `--border`, rayon `--radius-lg`, padding 20-24px.
Structure : label en 12px `--text-muted` uppercase `letter-spacing: .06em`, valeur en
display, variation en dessous avec puce colorée. Hover : `--surface-hover` + translation
de 1px vers le haut, transition 160 ms.

### Graphique d'évolution
Aire avec dégradé vertical de `--primary` (opacité .25 → 0), ligne 2px, courbe
`monotone`. Grille horizontale seule, `--border` en pointillés. Tooltip sur carte
`--surface-2` avec date en muted et valeur en mono. Point actif avec halo.

### Donut d'allocation
Épaisseur 28px, `cornerRadius: 4`, écart de 2px entre segments. Centre : total en display
+ label « Total ». Légende à droite en liste avec barre de progression fine par ligne,
survol qui met le segment en avant et grise les autres.

### Sankey budgétaire
`d3-sankey` en SVG. Nœuds arrondis, liens en dégradé de la couleur source vers la cible,
opacité .55 montant à .85 au survol. Étiquettes dans une pastille `--surface-2`.
Clic sur un flux → filtre la liste des transactions. Sur mobile, remplacer par un
treemap ou une liste hiérarchique : un Sankey à 380px est illisible.

### Tableau d'actifs
Lignes de 56px, séparateurs `--border` à 50 % d'opacité, en-têtes triables avec chevron.
Colonne « Répartition » avec une micro-barre. Densité réglable (confortable / compact).

## Motion

Transitions courtes et sobres : 160 ms `cubic-bezier(.2,.8,.2,1)` pour les hovers,
240 ms pour les entrées de carte. Les graphiques s'animent **une seule fois** au montage
(600 ms), jamais à chaque re-render : sur des chiffres d'argent, une animation permanente
donne une impression d'instabilité. `prefers-reduced-motion` respecté partout.

## Accessibilité

- Contraste AA minimum sur tout texte ; les couleurs de données sont testées en
  deutéranopie (jamais la couleur seule pour porter le sens : ajouter forme ou libellé)
- Cibles tactiles ≥ 44px
- Focus visible sur tous les éléments interactifs, jamais `outline: none` sans remplacement
- Graphiques doublés d'un tableau accessible (`<table>` visuellement masqué ou toggle « voir les données »)

## À proscrire

- Le dégradé violet-bleu générique
- Inter comme unique police
- Les emojis dans l'interface produit
- Le rouge criard sur une baisse : `--negative` reste tempéré, on n'affole pas quelqu'un
  qui regarde son épargne
- Les animations de compteur qui font défiler les chiffres : on veut lire un montant, pas assister à un spectacle
