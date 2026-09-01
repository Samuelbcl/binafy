# Nestor — Le patrimoine, version belge

> Suivre. Comprendre. Décider. Sans devoir traduire la fiscalité française.

Nestor est une application de suivi et de pilotage de patrimoine pensée **pour la Belgique** :
connexion aux banques belges, fiscalité belge intégrée dans chaque calcul, et un moteur
pédagogique qui explique *pourquoi* un chiffre est ce qu'il est.

Projet porté par **Biancola Studio** (Samuel Biancola, Liège).

---

## Pourquoi ce projet existe

Les outils du marché (Finary en tête) sont excellents sur l'UX et **structurellement français** :

| Problème constaté | Réponse Nestor |
|---|---|
| Connexions bancaires belges instables ou absentes | Agrégateur PSD2 choisi pour sa couverture BE + import CODA/CSV natif en secours |
| Fiscalité PEA / assurance-vie / PER, inapplicable en Belgique | Moteur fiscal belge : précompte mobilier, TOB, taxe sur les plus-values, RC indexé, droits d'enregistrement par Région |
| Fonctionnalités de base derrière un paywall | Le suivi complet reste gratuit ; le payant porte sur l'automatisation et le conseil |
| Aucun contenu sur le statut d'indépendant belge | Module dédié : complémentaire vs principal, cotisations, TVA, IPP marginal |

**Positionnement en une phrase :** l'outil que tout jeune actif ou indépendant belge ouvre
pour savoir où il en est et ce que ça lui coûtera vraiment en impôts.

---

## Comment utiliser ce dossier

Ce dossier est fait pour être ouvert dans **VS Code + Claude Code**. Ordre de lecture :

```
README.md                              ← tu es ici
CLAUDE.md                              ← à lire par Claude Code à chaque session
docs/01-vision-produit.md              ← positionnement, cible, ce qu'on ne fait pas
docs/02-specifications-fonctionnelles.md ← tous les écrans, module par module
docs/03-architecture-technique.md      ← stack, agrégation bancaire, cotations
docs/04-modele-de-donnees.md           ← schéma Postgres complet + RLS
docs/05-design-system.md               ← tokens, typo, composants, graphiques
docs/06-fiscalite-belge.md             ← le cœur métier, à traiter comme une spec
docs/07-moteurs-de-calcul.md           ← formules exactes des simulateurs
docs/08-roadmap.md                     ← MVP → V1 → V2, avec critères de sortie
docs/09-contenu-seo.md                 ← site public, pages piliers, outils gratuits
docs/10-benchmark-finary.md            ← ce qu'on reprend, ce qu'on fait autrement
```

### Démarrage

```bash
npx create-next-app@latest nestor --typescript --tailwind --app --src-dir
cd nestor
# copier ce dossier docs/ + CLAUDE.md à la racine du repo
claude
```

Puis, dans Claude Code :

```
Lis CLAUDE.md et docs/08-roadmap.md. On attaque le Lot 1 du MVP.
Commence par le schéma Supabase de docs/04-modele-de-donnees.md.
```

---

## Nom et identité

`Nestor` — le majordome belge qui tient les comptes. Court, prononçable en FR et NL,
`.be` probablement libre, et ça ne ressemble à aucun concurrent.

Alternatives si le domaine est pris : **Kapitaan**, **Patrimo**, **Ostra**, **Belvest**.

---

## Règle non négociable

Nestor **informe**, il ne conseille pas. Aucun écran ne dit « investis dans X ».
Le conseil en investissement est une activité réglementée en Belgique (FSMA).
Voir `docs/01-vision-produit.md` § Cadre réglementaire.
