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

## Démarrer

```bash
npm install
cp .env.example .env.local     # puis renseigner ce dont tu as besoin
npm run dev                    # http://localhost:3000
```

Sans Supabase, l'application démarre en **mode démo** sur des données fictives cohérentes :
tous les écrans sont visitables, aucun compte n'est nécessaire, rien n'est stocké.

### Commandes

```bash
npm run dev          # serveur de développement
npm test             # 257 tests — le moteur de calcul doit rester vert
npm run typecheck    # tsc --noEmit
npm run build        # build de production
npm run lint         # ESLint

npm run db:migrer    # applique les migrations et le seed fiscal
npm run db:types     # régénère les types TypeScript depuis le schéma réel
npm run db:cron      # vérifie le job d'instantanés de bout en bout
npm run db:import    # vérifie l'import CSV contre la base
npm run db:rgpd      # vérifie que la suppression de compte n'oublie rien

node scripts/generer-seed-fiscal.mjs   # régénère le seed SQL et docs/11
```

Les scripts `db:*` s'exécutent **contre la vraie base** : ils créent un compte de test,
vérifient, puis nettoient. Ils échouent bruyamment plutôt que de supposer.

---

## État du projet

| Brique | État |
|---|---|
| Moteur fiscal belge (`src/lib/tax`) | Précompte, TOB, plus-values 2026 et impôt latent, Reynders, RC indexé, droits d'enregistrement par Région, IPP, indépendant complémentaire |
| Moteurs financiers (`src/lib/finance`) | Intérêts composés, crédit et amortissement, capacité d'emprunt, projection de patrimoine, rendement locatif, taux d'épargne |
| Tests | 257, dont les cas métier chiffrés de `docs/06` et `docs/07` |
| Authentification | Lien magique, protection des routes, création automatique du profil |
| Patrimoine | Actifs et passifs persistés, quotes-parts, base fiscale par position |
| Budget | Import CSV belge, catégorisation automatique, déduplication, Sankey |
| Instantanés | Job quotidien Vercel Cron : la courbe d'évolution se construit toute seule |
| Fiscalité | Position de l'année, impôt latent ligne par ligne, alertes |
| Outils publics | Quatre simulateurs, état dans l'URL, images de partage calculées |
| RGPD | Export complet et suppression définitive, vérifiés contre la base |
| Sécurité | RLS sur les 20 tables, CSP, limitation de débit, en-têtes durcis |

### Ce qui reste

Connexion PSD2 et parseur CODA, module immobilier, objectifs libres persistés,
2FA TOTP, rapports mensuels par email, `nl-BE`. Voir `docs/08-roadmap.md`.

---

## ⚠️ Avant toute ouverture au public

Deux points bloquants, aucun n'est technique.

**1. Les paramètres fiscaux.** 5 règles fiscales sur 83 sont encore des ordres de grandeur
qui attendent confirmation à leur source officielle. Elles portent `verifie: false`,
l'interface avertit sur tout calcul qui en dépend, et elles sont toutes listées dans
`docs/11-parametres-a-verifier.md` avec la source à consulter et la procédure.

Une application qui annonce à quelqu'un « ton achat te coûtera 26 600 € de plus »
doit avoir le bon chiffre.

**2. Le cadre juridique.** Les pages `/confidentialite`, `/conditions` et
`/mentions-legales` décrivent fidèlement le fonctionnement réel, mais n'ont pas été
relues par un juriste — elles portent un bandeau qui le dit. Il manque le numéro BCE
et l'adresse complète, obligatoires (art. XII.6 du Code de droit économique).

À faire aussi : renseigner `NEXT_PUBLIC_SITE_URL` avec le domaine de production,
sans quoi les images de partage et le sitemap pointeront vers `localhost`.

---

## Organisation du dossier

```
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
docs/11-parametres-a-verifier.md       ← généré : les taux à confirmer à la source

src/lib/tax/       moteur fiscal belge — fonctions pures, testées
src/lib/finance/   intérêts composés, amortissement, projections
src/lib/banking/   parseur CSV belge et catégorisation
src/lib/db/        accès Supabase typé
src/lib/demo/      données fictives du mode démo
supabase/          migrations versionnées et seed fiscal
scripts/           vérifications contre la base réelle
```

---

## Nom et identité

`Nestor` — le majordome belge qui tient les comptes. Court, prononçable en FR et NL,
et ça ne ressemble à aucun concurrent.

Le dépôt s'appelle `binafy` et le dossier local `belfy` : sans conséquence technique,
mais à aligner si le nom se fixe.

---

## Règle non négociable

Nestor **informe**, il ne conseille pas. Aucun écran ne dit « investis dans X ».
Le conseil en investissement est une activité réglementée en Belgique (FSMA).
Voir `docs/01-vision-produit.md` § Cadre réglementaire.
