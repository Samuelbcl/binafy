# 03 — Architecture technique

## Stack

| Couche | Choix | Raison |
|---|---|---|
| Framework | Next.js 15, App Router | Déjà maîtrisé, RSC pour les pages SEO |
| Langage | TypeScript strict | `strict: true`, `noUncheckedIndexedAccess: true` |
| UI | Tailwind v4 + shadcn/ui | Vitesse, et on possède le code des composants |
| Base | Supabase Postgres, `eu-central-1` | RGPD, RLS native, déjà maîtrisé |
| Auth | Supabase Auth (email + magic link, TOTP en V1) | Données financières → 2FA non négociable |
| Graphiques | Recharts + `d3-sankey` | Recharts couvre 90 % ; Sankey n'existe pas dedans |
| État serveur | TanStack Query | Cache et revalidation des cotations |
| Validation | Zod | Une seule source de vérité des types d'entrée |
| Jobs | Vercel Cron + Supabase Edge Functions | Cotations quotidiennes, snapshots, sync bancaire |
| Email | Resend | Rapports mensuels, alertes |
| i18n | next-intl | `fr-BE` défaut, `nl-BE` obligatoire pour la Flandre en V2 |
| Tests | Vitest (unitaires), Playwright (parcours critiques) | Le moteur fiscal doit être testé à 100 % |

## Agrégation bancaire — le point critique du projet

C'est là que Finary échoue en Belgique, donc c'est là qu'il faut être bon.

### Options évaluées

| Fournisseur | Couverture BE | Modèle | Verdict |
|---|---|---|---|
| **GoCardless Bank Account Data** (ex-Nordigen) | Bonne sur les grandes banques BE | Palier gratuit généreux, puis à la connexion | **Retenu pour le MVP** |
| **Ponto** (Isabel Group, belge) | Excellente, c'est leur marché | Payant dès le départ, orienté B2B | Retenu comme plan B / offre Pro |
| Tink (Visa) | Bonne | Entreprise, contrat lourd | Trop tôt |
| Powens / Plaid | Variable en BE | Entreprise | Non |

**Décision :** GoCardless BAD pour la V1, avec une couche d'abstraction
`lib/banking/provider.ts` qui définit une interface `BankProvider` afin de pouvoir
basculer vers Ponto sans toucher au reste du code. Ne jamais coder en direct contre
le SDK d'un fournisseur.

### Le filet de sécurité belge : import CODA

Toutes les banques belges permettent d'exporter des extraits au format **CODA**
(format bancaire belge) et beaucoup en **CAMT.053** (ISO 20022) ou en CSV.
Un parseur CODA rend l'app utilisable même quand une connexion PSD2 casse — et les
connexions PSD2 cassent, c'est structurel : les consentements expirent tous les 90 jours.

Implémenter dans cet ordre :
1. Import CSV avec mapping de colonnes configurable (couvre tout, tout de suite)
2. Parseur CODA (spécificité belge, aucun concurrent français ne le fait)
3. Connexion PSD2 automatique

Le parseur CODA est un lot de travail à part entière : format à enregistrements de
128 caractères, positions fixes. Bien testé, il devient un actif réutilisable.

### Contraintes PSD2 à intégrer dès la conception

- Consentement valable 90 jours puis renouvellement explicite par l'utilisateur
  → prévoir l'écran de re-consentement et l'email de relance à J-7
- Limite du nombre d'appels non initiés par l'utilisateur (4/jour typiquement)
  → une seule synchronisation quotidienne planifiée, plus les rafraîchissements manuels
- Accès en lecture seule uniquement. Aucune initiation de paiement, jamais.

## Cotations et prix

| Donnée | Source envisagée | Fréquence |
|---|---|---|
| Actions, ETF, fonds | EOD Historical Data ou Twelve Data (plan gratuit pour démarrer) | 1×/jour après clôture |
| Crypto | CoinGecko API gratuite | 1×/heure |
| Indices de référence | Même source que les actions | 1×/jour |
| Indexation du RC, index santé | Statbel, saisie manuelle annuelle | 1×/an |

Un job quotidien écrit un `asset_snapshots` par actif. L'historique du patrimoine se
reconstruit à partir de ces snapshots, jamais recalculé à la volée.

**Attention aux ETF européens :** beaucoup d'API grand public sont centrées sur les
tickers US. Vérifier la couverture des ISIN cotés à Euronext Bruxelles, Amsterdam et
Xetra **avant** de choisir le fournisseur. Prévoir une saisie manuelle de VL en secours.

## Sécurité

1. **RLS sur toutes les tables.** Policy type : `auth.uid() = user_id`. Testée.
2. **Tokens bancaires chiffrés** via Supabase Vault ou `pgcrypto`, jamais en clair,
   jamais exposés à un Client Component.
3. **2FA TOTP** avant toute ouverture publique.
4. **Rate limiting** sur les routes d'API sensibles (Upstash ou middleware Vercel).
5. **En-têtes de sécurité** : CSP stricte, HSTS, `X-Frame-Options: DENY`.
6. **Journal d'audit** : table `audit_log` sur les accès aux données bancaires.
7. **Aucune donnée financière dans les logs.** Un montant dans Sentry est une fuite.
8. **Export et suppression RGPD** implémentés dès le MVP, pas rajoutés après.

## Performance

- Pages marketing et outils : statiques ou ISR, elles portent le SEO
- Dashboard : Server Component avec les données agrégées, îlots clients pour les graphes
- Calculs de projection : côté client, ce sont des fonctions pures et rapides
- Objectif : LCP < 2 s sur les pages publiques, dashboard interactif < 1,5 s

## Environnements

`local` (Supabase CLI) → `preview` (branche Vercel + projet Supabase de staging) → `production`.
Aucune donnée réelle en staging. Un seed de données fictives cohérentes est fourni
pour les captures et les démos.
