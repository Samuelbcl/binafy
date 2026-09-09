# 05 — Design system

Objectif : la qualité perçue d'une app grand public soignée, avec une identité qui n'est
copiée sur personne. On reprend les **patterns** qui marchent (carte du chiffre principal,
donut d'allocation, Sankey budgétaire, cartes bento), pas la charte d'un concurrent.

> **Révision du 07/09/2026 — passage au registre épuré.** La direction précédente
> (« dark editorial fintech », fond charbon et accent laiton) a été abandonnée après
> une comparaison de cinq partis pris. Les maquettes des deux directions sont dans
> `design/` ; les quatre explorations écartées y restent en archive. Ce qui a motivé
> le changement : le sombre dense est le terrain de Finary et de la moitié des
> néobanques — crédible, mais pas reconnaissable, et illisible en plein soleil sur un
> téléphone.

## Direction artistique

> **Révision du 07/09/2026, le soir — le sombre devient le défaut, et l'identité
> se renforce.** Après avoir vécu avec le registre épuré clair, le constat de Samuel
> était précis : « tout est blanc, tout est noir, les polices se ressemblent ». Trois
> reproches, trois corrections aux fondations : un second accent (l'ambre), des
> dégradés et une lueur de page, et une seconde famille (Fraunces) pour les titres.
> Puis la comparaison des deux thèmes, côte à côte, sur les mêmes écrans : le sombre
> était sans discussion celui qui donne envie d'ouvrir l'application. Il devient la
> racine. Le clair reste disponible et complet ; l'argument du plein soleil tient
> toujours, il ne l'emporte plus.

> **Révision du 08/09/2026, le soir — lavande.** Samuel a apporté trois maquettes et
> dit : « je veux que mon application ressemble à ça, autant la police que les couleurs
> et l'UX ». Elles sont claires : fond lavande, cartes blanches à ombre douce, un violet
> franc, des pastels par catégorie, un serif à fort contraste pour le mot d'accueil au-
> dessus d'une interface en grotesque. C'est la décision qui remplace celle de la veille
> (le sombre par défaut) — pas un retour en arrière : le sombre construit hier reste
> complet, un geste plus loin, et tout ce qu'on a appris entre-temps (jetons, barre en
> verre liquide, scènes vivantes, « un designer enlève ») tient dans les deux thèmes.
> Instrument Serif remplace Young Serif pour la même raison : c'est la voix des maquettes.

> **Révision du 09/09/2026 — le test de la mère.** Samuel a montré l'application à sa
> mère : « on ne comprend rien ». Trop d'éléments sur chaque page, une police qu'il n'aime
> toujours pas, et « ça fait encore trop Claude ». Il est bloqué sur le contenu tant que
> ça ne passe pas. Deux réponses. **La police** : une seule famille, choisie pour être
> lue par quelqu'un qui a du mal à lire — Atkinson Hyperlegible Next, dessinée par le
> Braille Institute, republiée en 2025 avec sept graisses ; les titres par la taille et
> le gras, pas par une seconde voix. **Le nombre d'éléments** : un écran = une question,
> cinq blocs au plus sur téléphone, pas de sous-titre de zone, pas de jeton de zone, pas
> de phrase de plus de douze mots hors des guides. L'accueil n'est plus un résumé de
> l'application ; c'est sa porte : bonjour, le chiffre, quatre gestes, les objectifs, un
> guide. La courbe, la répartition, l'impôt latent vivent sur leur page.

**Registre : « lavande ».** Fond clair teinté de violet, cartes blanches qui flottent par
une ombre douce, un violet franc qui désigne, des pastels qui classent (une couleur par
sujet, partout la même), titres en Instrument Serif, interface et chiffres en Schibsted
Grotesk, cartes très arrondies, peu d'éléments par écran.

Trois mots directeurs : **clair, direct, honnête**. On manipule l'argent de gens qui n'en
ont pas beaucoup ; l'interface ne doit ni gamifier ni dramatiser — mais elle n'a pas à
être austère pour être sérieuse.

Le clair lavande est le mode **par défaut**. Le sombre reste disponible et complet, avec
la même grammaire.

> **Révision du 08/09/2026 — sortir du gabarit.** Le verdict de Samuel sur la version
> précédente : « ça se voit à dix kilomètres que c'est codé par un modèle ». Il avait
> raison, et la cause est nommable : Plus Jakarta Sans, Fraunces et des icônes Lucide au
> trait dans des carrés arrondis teintés sont précisément la panoplie que les modèles
> sortent par défaut. Ce n'est pas un choix, c'est un réflexe. Trois remplacements, et
> une règle : **si un choix est celui qu'un générateur ferait spontanément, ce n'est pas
> un choix.**

**Deux polices.** **Instrument Serif** porte les `h1`, `h2` et tout ce qui demande
`font-display` : un serif à fort contraste, étroit, presque calligraphique — le mot
d'accueil des maquettes. Une seule graisse, jamais synthétisée en gras (un gras de synthèse
est ce qui trahit une maquette) : la hiérarchie vient de la taille. **Schibsted Grotesk** garde l'interface, les libellés et **tous les montants** —
un grotesque dessiné pour la presse, dont le *a*, le *g* et le *y* ont une inflexion, avec
des chiffres tabulaires. Les montants sont en graisse moyenne (500–600), grands plutôt
que gros : un chiffre qui n'a pas besoin de crier.

**Les icônes.** **Solar** (480 Design, CC BY 4.0), choisie en cherchant — pas Lucide,
pas Phosphor, les deux que tout générateur sort. Solar a un dessin à part : des coins
adoucis jusqu'au bout, une chaleur de pictogramme d'objet plutôt que de schéma. Trois
styles : `bold-duotone` dans les pastilles (la forme pleine en transparence sous le
trait), `bold` pour ce qui est choisi ou actif, `linear` au repos. Les icônes sont
extraites une par une dans `src/lib/icones/solar.ts` par `node scripts/generer-icones.mjs`
(pas de paquet React : le paquet officiel pèse cinquante mégaoctets et passe par un
contexte, donc pas de rendu serveur). Lucide reste pour les glyphes utilitaires (flèches,
chevrons, croix, plus). **Aucune émoticône, nulle part.**

**Pas d'orange.** Samuel ne l'aime pas. Le second accent est un rose framboise, qui tient
aussi le rôle de couleur d'attention ; le bouton flottant et les boutons d'engagement sont
violets. Aucune teinte de la palette de données n'est orange.

**Une section vide se replie** sur une ligne (`<details>`) : un titre au-dessus de rien
prend la place d'une section pleine et se lit comme un trou.

**Mis de côté pour le moment** (le code reste, sans lien vers lui) : les objectifs — trop
de choses à la fois, on y reviendra quand le reste sera limpide — et le simulateur
d'épargne-pension.

**Les pastilles.** Rondes, éclairées par le haut, avec un liseré : des jetons, pas des
carrés teintés. Chaque outil et chaque zone d'écran garde sa couleur d'une page à l'autre
(`PastilleIcone`, sept teintes). C'est la version honnête des émoticônes : même fonction
de repère, sans le registre enfantin ni le rendu qui varie selon le système.

**La barre d'onglets est en verre liquide.** Détachée du bord, en verre dépoli, elle
porte une **lentille** — une capsule de verre plus clair, moins floue, avec un reflet net
sur son bord haut — qui marque l'onglet actif et glisse d'un onglet à l'autre en
**s'étirant** au passage (`scaleX` 1 → 1,22 → 1 sur 460 ms, `cubic-bezier(0.22, 1, 0.36,
1)`) : c'est l'étirement qui fait le liquide, pas un rebond. Elle **suit le doigt** le long
de la barre et se pose sur l'onglet lâché. Elle part dès le tap, sans attendre la page
(`vise`, caduc dès que l'URL change). Deux règles techniques, apprises d'une première
version qui traînait et laissait des artefacts sur Safari : **pas de `mask-image` avec
`backdrop-filter`**, et **une seule propriété animée par élément** — la translation sur la
lentille, l'étirement sur son verre intérieur.

**Les scènes vivantes.** Un objectif a une progression et un sujet ; la scène
(`SceneObjectif`) est une illustration SVG dont l'état dépend de la progression — la
maison se monte brique par brique, l'avion avance d'escale en escale, le soleil se lève.
La progression pilote des **étapes discrètes**, jamais un morphing : on doit pouvoir dire
« il manque le toit ». La dernière étape est la récompense et n'apparaît qu'à 100 %. Une
seule règle CSS (`.scene-etape`) porte le mouvement, au montage comme sous un curseur.
Décorative (`aria-hidden`) : la progression est déjà dite en texte et en barre.

**Les grands chiffres effacent leurs décimales** (`decimalesDiscretes` sur `Montant`) :
« 13 349,88 € » se lit 13 349, les centimes sont là pour qui les cherche.

**Un designer enlève ; un générateur remplit.** Verdict du premier passage du
`directeur-artistique` (08/09/2026) : la panoplie avait disparu, le remplissage restait
— un `+0,00 €` en pastille, le même total lu quatre fois, deux boutons pour un geste,
deux états vides côte à côte, huit cartes identiques, un graphique d'une droite. Règle :
un élément qui ne dit rien que l'écran ne dise déjà s'enlève. Et **l'ambre est la couleur
de l'engagement** — créer un compte, un objectif, un actif, le bouton flottant — là où le
violet est celle du repère (la bulle de la barre, les liens, l'onglet actif) ; les deux
dans la même robe, l'œil les lit comme une paire.

**Les cartes sombres n'ont presque plus de trait** (`--border` à 6 % de blanc) : elles se
détachent par leur surface et le voile de lumière du haut. Le contour net sur fond sombre
est un autre tic de gabarit.

Une règle porte l'essentiel du registre : **l'accent ne décore jamais, il désigne.** La
seule surface colorée d'un écran est la carte du chiffre principal. Partout ailleurs, le
violet signale ce qu'il faut lire — un lien, un onglet actif, un segment de graphique.
C'est pour cela que l'action principale est noire et non violette : sans cette
séparation, tout ce qui est coloré devient du bouton et l'accent perd son sens.

## Tokens

Valeurs de référence : `src/app/globals.css`. Aucune couleur ni taille ne vit en dur
dans un composant.

```css
:root {
  color-scheme: light;

  /* Fonds */
  --bg:            #F6F6F8;
  --surface:       #FFFFFF;
  --surface-2:     #F1F1F4;
  --surface-hover: #EFEFF2;
  --border:        #ECECEF;

  /* Texte */
  --text:          #0E0E12;
  --text-muted:    #71717A;
  --text-subtle:   #A1A1AA;

  /* Marque — l'accent porte l'information */
  --primary:       #4F3FF0;
  --primary-hover: #3B2ED4;
  --primary-soft:  #EEEBFF;
  --on-primary:    #FFFFFF;

  /* Action principale — distincte de la marque */
  --action:        #101014;
  --action-hover:  #26262E;
  --on-action:     #FFFFFF;

  /* Sémantique */
  --positive:      #0FA968;
  --negative:      #E5484D;
  --warning:       #F5A524;
  --info:          #2563EB;

  /* Palette de données (donut, Sankey, séries) */
  --data-1: #4F3FF0;  --data-2: #0FA968;  --data-3: #F5A524;
  --data-4: #EC4899;  --data-5: #2563EB;  --data-6: #14B8A6;
  --data-7: #F97316;  --data-8: #A1A1AA;

  /* Rayons — la pilule pour l'action, l'arrondi généreux pour la carte */
  --radius-sm: 11px; --radius: 14px; --radius-lg: 22px; --radius-xl: 26px;
  --shadow-card: 0 1px 2px rgba(14,14,18,.04);
}

/* Thème sombre — la même grammaire, pas un autre design */
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0E0E12; --surface: #17171C; --surface-2: #1F1F26;
  --border: #26262E; --text: #F4F4F5; --text-muted: #A1A1AA;
  --primary: #8B7CFF;              /* éclairci pour tenir le contraste */
  --action: #FFFFFF; --on-action: #0E0E12;   /* l'action s'inverse */
}
```

## Typographie

**Une seule famille : Plus Jakarta Sans** (400/500/600/700/800).

| Rôle | Graisse | Usage |
|---|---|---|
| Chiffre héros | 800, `-0.035em` | Le chiffre principal d'un écran |
| Titre de page | 800, `-0.025em` | `h1` |
| Titre de carte | 700 | `h2`, `h3` |
| Corps | 400/500 | Texte courant, navigation, formulaires |
| Légende | 400, `--text-muted` | Unités, mentions de source, précisions |

Ses chiffres tabulaires alignent les colonnes sans qu'on charge une monospace pour ça :
trois polices en moins à télécharger sur une connexion mobile. `--font-mono` pointe donc
sur la même famille, et une règle de base applique `tabular-nums` à `.font-mono` — les
appels existants continuent de rendre des colonnes alignées.

Ce n'est pas un détail : en chiffres tabulaires, les colonnes s'alignent et les valeurs
deviennent comparables d'un coup d'œil. `font-variant-numeric: tabular-nums` partout où
un montant apparaît.

Échelle : `12 / 13 / 14 / 16 / 20 / 22 / 26 / 36 / 60`. Chiffre héros :
`clamp(2.5rem, 6vw, 3.75rem)`.

Les étiquettes ne sont **plus en capitales** : dans ce registre, la hiérarchie vient de
la taille et de la couleur, pas de la casse.

## Règles de mise en forme des montants

- Format belge : `13 656,48 €` — espace insécable comme séparateur de milliers, virgule décimale
- Variations : toujours signées, `+1 240 €` en `--positive`, `−320 €` en `--negative`
  (vrai signe moins U+2212, pas un tiret)
- Grands nombres dans les graphiques : `13,7 k€`, `1,2 M€`
- Pourcentages à une décimale, jamais deux
- **Mode discrétion** : un bouton œil remplace tous les montants par `••••`.
  Indispensable dans un train ou un open space.
- Sur un aplat d'accent, une variation n'est **pas** colorée en vert ou en rouge : ces
  couleurs y deviennent illisibles, et le signe suffit à lire le sens.

## Composants clés

### Carte du chiffre principal (`CarteHero`)
Aplat `--primary`, rayon `--radius-xl`, padding 24-32px. Label 13px à 75 % d'opacité,
chiffre en `.chiffre-hero` sur `--on-primary`, variation en pastilles. Chiffre secondaire
optionnel aligné à droite.

**Une seule par écran.** Si deux cartes d'accent apparaissent au même endroit, l'une des
deux n'est pas le chiffre principal.

### Carte KPI (`CarteKPI`)
Fond `--surface`, bordure 1px `--border`, rayon `--radius-lg`, padding 20-24px.
Structure : label 13px `--text-muted`, valeur en 26px/800, variation en dessous avec puce
colorée. Hover : `--surface-hover` + translation de 1px vers le haut, transition 160 ms.

### Boutons
Trois classes dans `globals.css`, hauteur 44px, rayon pilule :

| Classe | Fond | Quand |
|---|---|---|
| `.bouton-principal` | `--action` (noir) | L'action qui engage — une seule par écran |
| `.bouton-marque` | `--primary` | Action liée à l'identité (page d'accueil publique) |
| `.bouton-secondaire` | `--surface` + bordure | Tout le reste |

Le look vit dans la classe, la mise en page reste sur l'élément : `w-full`, `mt-4` ou une
icône s'ajoutent sans toucher au style.

### Navigation
Écran large : barre latérale fixe de 248px en **deux groupes** — « Mon patrimoine »
(vue d'ensemble, patrimoine, budget, projections, objectifs, fiscalité) et « Comprendre »
(apprendre, outils). Entrée active en `--primary-soft` + `--primary`.

Ce second groupe n'est pas cosmétique : les guides et les calculateurs n'existaient que
sur le site public, donc devenaient inatteignables une fois connecté. C'est pourtant
connecté qu'on en a le plus besoin — on lit le guide sur la TOB parce qu'on vient de voir
une ligne de TOB dans son propre portefeuille.

Mobile : **barre d'onglets en bas**, cinq destinations à largeur égale — Accueil,
Patrimoine, Budget, Fiscalité, Apprendre. L'ajout d'un actif est un **bouton flottant**
`--action` au-dessus de la barre, à droite : au centre de la barre il coûtait une
destination et renvoyait vers `/patrimoine#ajouter` même depuis le budget. Un menu
hamburger en haut à gauche est le point le plus difficile à atteindre au pouce sur un
écran de 390px ; le tiroir du haut ne garde que le secondaire — projections, objectifs,
paramètres. Le contenu réserve `pb-28` sous lui, sinon la barre recouvre le dernier bloc.

### Graphique d'évolution
Aire avec dégradé vertical de `--primary` (opacité .25 → 0), ligne 2px, courbe
`monotone`. Grille horizontale seule, `--border` en pointillés. Tooltip sur carte
`--surface` avec date en muted et valeur en tabulaire. Point actif avec halo.
Sur la carte héros, la courbe passe en blanc sur l'aplat.

### Donut d'allocation
Épaisseur 28px, `cornerRadius: 4`, écart de 2px entre segments. Centre : total en 800
+ label « Total ». Légende à droite en liste avec barre de progression fine par ligne,
survol qui met le segment en avant et grise les autres.

### Sankey budgétaire
`d3-sankey` en SVG. Nœuds arrondis, liens en dégradé de la couleur source vers la cible,
opacité .55 montant à .85 au survol. Étiquettes dans une pastille `--surface-2`.
Clic sur un flux → filtre la liste des transactions. Sur mobile, remplacer par un
treemap ou une liste hiérarchique : un Sankey à 380px est illisible.

### Tableau d'actifs
Lignes de 56px, séparateurs `--border`, en-têtes triables avec chevron.
Colonne « Répartition » avec une micro-barre. Densité réglable (confortable / compact).

### Pastille (`.puce`)
Rayon pilule, 12px/600. Sert aux états : « Vérifié le 06/09/2026 » en `--positive` sur
`--positive` à 12 %, « Hypothèse » en `--warning`, période active en `--action`.

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

- **Le dégradé** violet-bleu générique. L'accent est un aplat, jamais un dégradé — la
  seule exception est le remplissage sous une courbe, qui va de l'accent au transparent.
- Inter comme unique police
- Les emojis dans l'interface produit
- Le rouge criard sur une baisse : `--negative` reste tempéré, on n'affole pas quelqu'un
  qui regarde son épargne
- Les animations de compteur qui font défiler les chiffres : on veut lire un montant, pas assister à un spectacle
- Deux surfaces d'accent sur un même écran
