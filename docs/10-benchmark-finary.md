# 10 — Benchmark : ce qu'on reprend, ce qu'on fait autrement

Analyse de la référence du marché, à partir de son site public et des captures fournies.
Objectif : reprendre les décisions d'interface qui ont fait leurs preuves, et identifier
précisément où la place est libre.

## Architecture d'information observée

Application : Dashboard → Patrimoine (actifs / passifs) → Objectifs → Insights →
Budget (cashflow) → Investir → Outils → Communauté.

Site public : Solutions (trois niveaux d'abonnement) · Fonctionnalités (suivi, budget,
scanner de frais, revenus passifs, diversification, classement) · Outils gratuits
(simulateur de patrimoine, calculateur de budget, intérêts composés, crédit immobilier) ·
Blog très fourni · Communauté.

**Lecture :** le produit est structuré autour de trois questions — *combien j'ai*,
*combien je dépense*, *où je vais*. C'est la bonne structure, on la garde.

## Ce qu'on reprend (patterns, pas contenu)

| Élément | Pourquoi ça marche |
|---|---|
| Chiffre de patrimoine net en héros + sélecteur de période | Réponse immédiate à la seule question qui compte |
| Donut d'allocation avec légende en pourcentages | Lecture de la diversification en un coup d'œil |
| Sankey du budget avec phrase de synthèse | Meilleure vulgarisation du taux d'épargne que j'aie vue |
| Simulateurs paramétrés par URL | Partageable, rejouable, excellent pour le SEO |
| Outils gratuits sans compte comme porte d'entrée | Le moteur d'acquisition du modèle |
| Distinction « taux d'épargne » et « taux d'épargne possible » | Montre l'écart entre ce qu'on fait et ce qu'on pourrait faire |
| Scanner d'abonnements et de frais | Valeur perçue immédiate, coût de dev faible |

## Ce qu'on fait autrement

| Constat | Décision Nestor |
|---|---|
| Connexions aux banques belges instables | Agrégateur choisi pour la couverture BE **et** import CODA/CSV natif comme filet |
| Fiscalité entièrement française (PEA, assurance-vie, PER) | Moteur fiscal belge dans chaque calcul, pas en option |
| Beaucoup de fonctions derrière l'abonnement, y compris des scanners de base | Le suivi complet reste gratuit ; on ne facture que ce qui coûte réellement (la sync) |
| Création d'objectifs indisponible sur le web, renvoyée au mobile | Web complet dès le premier jour |
| Patrimoine affiché en brut | Patrimoine brut **et** net d'impôt latent |
| Blog dense mais sans aucune spécificité belge | Contenu belge sourcé, avec date de vérification affichée |
| Produits maison mis en avant (assurance-vie, crypto) | Aucun produit maison : pas de conflit d'intérêts, on le dit clairement |

## Où on ne va pas les concurrencer

Gestion privée, courtage, assurance-vie maison, communauté d'un million d'utilisateurs,
notoriété presse. Rien de tout cela n'est atteignable ni utile pour un dev solo.
La bataille se joue sur un seul axe : **être l'outil manifestement conçu pour la Belgique.**

## Angle de positionnement

> Finary est excellent, et il est français. Nestor est l'équivalent belge :
> tes banques, ta fiscalité, tes Régions.

C'est un positionnement de niche assumé. Le marché belge francophone est petit, mais
il est mal servi, et personne d'assez gros ne trouvera rentable de le servir correctement.

## Point juridique à ne pas franchir

Reprendre des patterns d'interface répandus (dashboard, donut, Sankey, cartes KPI)
est licite : ce sont des conventions de l'industrie. Ce qui ne l'est pas : reproduire
une charte graphique reconnaissable, un logo, des textes de blog ou de page produit,
des visuels, ou laisser croire à une affiliation. Nestor a ses propres couleurs,
ses propres polices, ses propres textes. Voir `05-design-system.md`.
