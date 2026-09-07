@AGENTS.md

# CLAUDE.md — Instructions permanentes pour Claude Code

Tu travailles sur **Nestor**, une app de suivi de patrimoine pour la Belgique.
Lis ce fichier au début de chaque session, puis le doc correspondant au lot en cours.

## Contexte du dev

- Développeur solo (Samuel, Biancola Studio, Liège). Salarié à temps plein à côté :
  le temps de dev est fragmenté. Privilégie les incréments livrables en une session.
- Français belge dans tout le code visible par l'utilisateur, les commits et les commentaires.
- L'app est d'abord un outil personnel, ensuite un produit. Ne sur-architecture pas
  pour 100 000 utilisateurs tant qu'on n'en a pas 100.

## Stack imposée

- Next.js 16 (App Router, Server Components par défaut, Turbopack) + TypeScript strict
  `strict: true` et `noUncheckedIndexedAccess: true` sont activés.
- Tailwind CSS v4 + shadcn/ui
- Supabase : Postgres + Auth + RLS + Storage, région `eu-central-1`
- Vercel pour l'hébergement, Resend pour l'email transactionnel
- TanStack Query côté client, Zod pour toute validation d'entrée
- Recharts pour les graphiques standards, `d3-sankey` pour le flux budgétaire
- `next-intl` dès le départ : `fr-BE` par défaut, `nl-BE` et `en` prévus

Ne remplace aucune de ces briques sans le demander.

## Règles de code

1. **Aucun montant en dur.** Tous les paramètres fiscaux vivent dans la table
   `tax_parameters`, versionnée par année, avec une URL de source. Un taux écrit
   en dur dans un composant est un bug.
2. **L'argent est en centimes.** Type `bigint` en base, jamais de `float` sur un montant.
   Un helper `formatEUR()` unique gère l'affichage (`1 234,56 €`, espace insécable).
3. **Les dates sont en UTC en base**, affichées en `Europe/Brussels`.
4. **RLS activée sur chaque table** dès sa création. Aucune table sans policy.
5. **Aucun secret côté client.** Les tokens d'agrégation bancaire ne sortent jamais
   du serveur ; ils sont chiffrés en base (pgcrypto ou Supabase Vault).
6. **Chaque calcul fiscal est une fonction pure testée.** `lib/tax/*.ts` + Vitest.
   Un calcul sans test unitaire ne part pas en prod.
7. **Tout résultat chiffré affiché doit pouvoir s'expliquer.** Chaque calculateur
   retourne `{ result, breakdown[], sources[] }`. Le breakdown est affiché dans l'UI.

## Ce que tu ne fais pas

- Pas de conseil en investissement. Aucun texte du type « tu devrais acheter ».
  On montre des chiffres et des règles, l'utilisateur décide.
- Pas d'ordre de bourse, pas de mouvement d'argent. L'accès bancaire est en lecture seule.
- Pas de copie du contenu, des visuels ou des textes de Finary ou d'un autre concurrent.
  On s'inspire des patterns d'interface, on écrit nos propres textes.

## Conventions de repo

```
src/
  app/(marketing)/      # site public, SEO, outils gratuits sans compte
  app/(app)/            # application authentifiée
  components/ui/        # shadcn
  components/charts/    # wrappers Recharts / Sankey
  lib/tax/              # moteur fiscal belge — fonctions pures
  lib/finance/          # intérêts composés, amortissement, projections
  lib/banking/          # agrégateur PSD2 + parsers CODA/CSV
  lib/db/               # accès Supabase typé
supabase/migrations/    # SQL versionné
docs/                   # ce dossier
```

Commits en français, format `type(scope): message` — `feat(patrimoine): ajout du donut d'allocation`.

## Avant de coder un module

Relis la section correspondante de `docs/02-specifications-fonctionnelles.md`,
et si le module touche à un chiffre fiscal, `docs/06-fiscalite-belge.md`.
Si un paramètre fiscal manque ou te semble périmé, **demande plutôt que d'inventer**.


## Décisions prises pendant la construction du socle

Ces points complètent la doc, ils ne la remplacent pas.

1. **Next 16 plutôt que 15.** `create-next-app@latest` installe Next 16 ; l'App Router
   et les RSC sont identiques, Turbopack est stable par défaut. Choix validé avec Samuel.
2. **Trois ajouts au schéma de `docs/04`**, tous justifiés en commentaire dans les
   migrations : `assets.valeur_reference_2025_cents` (sans elle, l'impôt latent est
   faux), la table `asset_transactions` (les plus-values réalisées et la TOB ont besoin
   des mouvements titres), et les colonnes de quote-part sur `net_worth_snapshots`.
3. **`tax_parameters.verifie`.** Distingue une valeur confirmée à la source d'un ordre
   de grandeur provisoire. L'interface avertit sur tout calcul qui dépend d'un paramètre
   non vérifié. La liste de travail est dans `docs/11-parametres-a-verifier.md`, générée
   depuis le catalogue par `node scripts/generer-seed-fiscal.mjs`.

4. **Chaque valeur porte une durée de validité.** `verifie` dit si une valeur a
   été confirmée ; il ne dit pas si elle l'est encore. Or la Belgique indexe ses
   montants chaque année : un chiffre exact le jour où on l'écrit devient faux
   tout seul. D'où `peremption` sur `TaxParameter`, déduite de l'unité à défaut
   d'être déclarée — un montant en euros est indexé (365 j), un taux relève de la
   loi (730 j), une pratique de marché change sans prévenir (183 j). La page
   Fiscalité affiche l'état, et `scripts/verifier-fraicheur.mjs` le rend
   exploitable en CI.

## Commandes

```bash
npm run dev         # serveur de développement
npm test            # Vitest — le moteur de calcul doit rester vert
npm run typecheck   # tsc --noEmit
npm run build       # build de production
node scripts/generer-seed-fiscal.mjs   # régénère le seed SQL et docs/11
node scripts/verifier-fraicheur.mjs   # liste les valeurs fiscales périmées
                                      # (sort en code 1 s'il y en a)
node scripts/captures-mobile.mjs captures   # capture chaque écran en 390×844
                                            # et signale les débordements
                                            # (serveur lancé, compte de test créé
                                            #  puis supprimé) ; `--clair` pour
                                            # le thème clair
```
