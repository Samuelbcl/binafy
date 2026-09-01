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

- Next.js 15 (App Router, Server Components par défaut) + TypeScript strict
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
