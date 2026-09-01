# 01 — Vision produit

## Le problème

Un jeune actif belge qui veut suivre son argent a trois options, toutes mauvaises :

1. **Excel.** Fonctionne, mais mourra le jour où il oublie de le mettre à jour.
2. **Un agrégateur français** (Finary, Finary Lite, Moka). UX excellente, mais la
   connexion aux banques belges est fragile, et toute la couche fiscale et produit
   (PEA, assurance-vie, PER, LEP) ne s'applique pas à lui.
3. **L'app de sa banque.** Ne voit que les comptes de cette banque.

Résultat : personne, en Belgique, n'a de vue consolidée fiable, et surtout personne
ne sait ce que son patrimoine lui coûtera réellement en impôts.

## La cible

**Cœur de cible (V1) :** 22-35 ans, Wallonie et Bruxelles, revenu 2 000-4 500 € net,
premier patrimoine en construction (épargne, peut-être un ETF, un premier achat immobilier
en vue). Souvent salarié + activité complémentaire.

**Cible secondaire (V2) :** indépendants complémentaires et jeunes indépendants à titre
principal, qui doivent arbitrer entre sortir du cash et le laisser en société.

**Hors cible :** les patrimoines à sept chiffres avec un banquier privé. On ne joue pas
sur la gestion privée, c'est là que Finary gagne et on n'a rien à y apporter.

## La proposition de valeur

> Tu vois ton patrimoine complet, et pour chaque euro, tu sais ce que l'État prendra.

Trois piliers, dans cet ordre :

### 1. Consolidation qui marche en Belgique
Connexion PSD2 aux grandes banques belges, plus un import CODA/CSV natif quand la
connexion casse. Le CODA est un format d'extrait bancaire belge que toutes les banques
exportent : c'est notre filet de sécurité, et aucun concurrent français ne le gère.

### 2. Moteur fiscal belge
Chaque montant affiché existe en version brute et en version nette d'impôt belge :
précompte mobilier, TOB, taxe sur les plus-values, revenu cadastral indexé,
droits d'enregistrement selon la Région. C'est la différence structurelle, pas une
fonctionnalité parmi d'autres.

### 3. Pédagogie
L'utilisateur ne veut pas juste un chiffre, il veut comprendre. Chaque calcul est
dépliable : formule, paramètres utilisés, source officielle, date de mise à jour.
C'est ce qui transforme l'app en outil de référence et ce qui fait venir le trafic SEO.

## Ce qu'on ne fait pas

- **Pas de courtage.** On ne devient ni broker ni assureur. Trop de capital, trop de
  réglementation, et ce n'est pas là que se trouve le manque du marché belge.
- **Pas de conseil personnalisé** tant qu'on n'a pas le statut adéquat (voir plus bas).
- **Pas de crypto trading.** On affiche les positions crypto, on n'en vend pas.
- **Pas de scoring de crédit ni de revente de données.** Jamais. C'est le socle de confiance.

## Cadre réglementaire — à lire avant d'écrire une ligne d'UI

En Belgique, le conseil en investissement et le courtage sont encadrés par la **FSMA**.
Un simple agrégateur qui affiche des données et des simulations **n'a pas besoin d'agrément**,
à condition de rester du côté de l'information.

Règles à respecter dans tout le produit :

| Autorisé | Interdit sans agrément |
|---|---|
| « Ton épargne rapporte X % ; l'inflation est de Y % » | « Tu devrais sortir de ton compte épargne » |
| « Voici comment fonctionne la taxe sur les plus-values » | « Ce placement est adapté à ton profil » |
| Simulateurs paramétrables par l'utilisateur | Recommandation d'un produit ou d'un émetteur nommé |
| Comparaison factuelle de frais, sourcée | Classement « meilleur placement » présenté comme un conseil |

Chaque page de simulateur porte une mention : *outil de simulation à titre informatif,
ne constitue pas un conseil en investissement*. À valider avec un avocat avant
l'ouverture au public, pas avant l'usage personnel.

RGPD : données financières = données sensibles de fait. Hébergement UE obligatoire,
chiffrement au repos, registre de traitement, DPA avec l'agrégateur bancaire.

## Modèle économique (à activer seulement après 500 utilisateurs actifs)

- **Gratuit** : consolidation manuelle illimitée, tous les simulateurs, tout le contenu fiscal.
  Le suivi complet ne doit jamais être payant, c'est exactement le reproche fait à Finary.
- **Nestor Plus (~6 €/mois)** : synchronisation bancaire automatique (elle a un coût réel
  par connexion), rapports mensuels, export comptable, scénarios illimités.
- **Nestor Pro (plus tard)** : vue société + personnel pour indépendants, export vers
  le comptable.

## Critère de réussite personnel

Avant tout objectif de croissance : **est-ce que Samuel ouvre Nestor tous les mois
pour mettre ses chiffres à jour, au lieu d'un fichier ?** Si la réponse est non au bout
de trois mois, le produit ne tient pas et il faut le simplifier, pas ajouter des features.
