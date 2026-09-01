# 04 — Modèle de données

Postgres / Supabase. Tous les montants en **centimes** (`bigint`). Toutes les tables
ont `id uuid primary key default gen_random_uuid()`, `created_at`, `updated_at`, et RLS active.

## Schéma SQL

```sql
-- ─────────────────────────────────────────────
-- Profils et détenteurs
-- ─────────────────────────────────────────────
create type region_fiscale as enum ('wallonie', 'bruxelles', 'flandre');
create type statut_pro as enum ('salarie','independant_complementaire','independant_principal','etudiant','autre');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  prenom text,
  region region_fiscale not null default 'wallonie',
  statut statut_pro not null default 'salarie',
  date_naissance date,
  situation_familiale text,          -- isole, cohabitant, marie
  devise char(3) not null default 'EUR',
  locale text not null default 'fr-BE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Permet la détention partagée (couple) sans créer de comptes liés
create table holders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  est_utilisateur boolean not null default false,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Institutions et connexions bancaires
-- ─────────────────────────────────────────────
create table institutions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,                  -- ING, KBC, Belfius, BNP Paribas Fortis, Argenta...
  bic text,
  pays char(2) not null default 'BE',
  logo_url text,
  provider_ref text                   -- identifiant chez l'agrégateur
);

create type connexion_statut as enum ('active','expiree','erreur','revoquee');

create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  institution_id uuid references institutions(id),
  provider text not null,             -- 'gocardless' | 'ponto' | 'manuel'
  provider_account_id text,
  access_token_chiffre text,          -- Vault / pgcrypto — jamais en clair
  statut connexion_statut not null default 'active',
  consentement_expire_le timestamptz, -- PSD2 : 90 jours
  derniere_sync_le timestamptz,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Actifs et passifs
-- ─────────────────────────────────────────────
create type classe_actif as enum (
  'compte_courant','compte_epargne','compte_titres','etf','action','obligation',
  'fonds','crypto','immobilier','assurance_groupe','epargne_pension','branche21',
  'branche23','parts_societe','creance','metaux','autre'
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  connection_id uuid references bank_connections(id) on delete set null,
  institution_id uuid references institutions(id),
  nom text not null,
  classe classe_actif not null,
  isin text,
  ticker text,
  quantite numeric(24,8),             -- null pour un compte
  valeur_unitaire_cents bigint,       -- null pour un compte
  solde_cents bigint,                 -- pour les comptes
  devise char(3) not null default 'EUR',
  -- Attributs fiscaux belges
  capitalisant boolean,               -- influe sur la TOB et la taxe Reynders
  part_obligataire numeric(5,2),      -- > 10 % → taxe sur la plus-value obligataire
  compte_epargne_reglemente boolean,  -- exonération partielle des intérêts
  taux_base numeric(6,4),             -- compte d'épargne
  prime_fidelite numeric(6,4),
  -- Immobilier
  revenu_cadastral_cents bigint,
  usage_bien text,                    -- 'propre' | 'locatif_prive' | 'locatif_pro'
  date_acquisition date,
  prix_acquisition_cents bigint,
  est_manuel boolean not null default true,
  archive boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table asset_holders (           -- quote-part de détention
  asset_id uuid references assets(id) on delete cascade,
  holder_id uuid references holders(id) on delete cascade,
  quote_part numeric(5,2) not null check (quote_part > 0 and quote_part <= 100),
  primary key (asset_id, holder_id)
);

create type type_passif as enum ('credit_hypothecaire','pret_temperament','pret_prive','leasing','autre');

create table liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,  -- bien financé
  nom text not null,
  type type_passif not null,
  capital_initial_cents bigint not null,
  capital_restant_cents bigint not null,
  taux_annuel numeric(6,4) not null,
  taux_fixe boolean not null default true,
  duree_mois int not null,
  date_debut date not null,
  mensualite_cents bigint not null,
  created_at timestamptz default now()
);

-- Historique : source unique de vérité de la courbe de patrimoine
create table asset_snapshots (
  id bigserial primary key,
  asset_id uuid not null references assets(id) on delete cascade,
  date date not null,
  valeur_cents bigint not null,
  unique (asset_id, date)
);

create table net_worth_snapshots (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  actifs_cents bigint not null,
  passifs_cents bigint not null,
  net_cents bigint not null,
  impot_latent_cents bigint,          -- différenciateur Nestor
  unique (user_id, date)
);

-- ─────────────────────────────────────────────
-- Budget
-- ─────────────────────────────────────────────
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,  -- null = catégorie système
  nom text not null,
  parent_id uuid references categories(id),
  type text not null check (type in ('revenu','depense','investissement','transfert')),
  couleur text,
  icone text
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  category_id uuid references categories(id),
  date date not null,
  montant_cents bigint not null,      -- négatif = sortie
  libelle text not null,
  contrepartie text,
  reference_externe text,             -- id fournisseur ou n° d'extrait CODA
  source text not null default 'manuel', -- 'psd2' | 'coda' | 'csv' | 'manuel'
  recurrente boolean default false,
  exclue_du_budget boolean default false,
  created_at timestamptz default now(),
  unique (user_id, reference_externe)  -- anti-doublon d'import
);

create table categorisation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,  -- null = règle globale
  motif text not null,                -- ILIKE sur le libellé
  category_id uuid not null references categories(id),
  priorite int not null default 100
);

-- ─────────────────────────────────────────────
-- Objectifs
-- ─────────────────────────────────────────────
create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  type text not null default 'libre', -- 'libre' | 'precaution' | 'apport_immo'
  montant_cible_cents bigint,         -- null si calculé automatiquement
  echeance date,
  parametres jsonb,                   -- ex: { mois_de_charges: 4 }
  created_at timestamptz default now()
);

create table goal_assets (
  goal_id uuid references goals(id) on delete cascade,
  asset_id uuid references assets(id) on delete cascade,
  primary key (goal_id, asset_id)
);

-- ─────────────────────────────────────────────
-- Moteur fiscal — le cœur du produit
-- ─────────────────────────────────────────────
create table tax_parameters (
  id uuid primary key default gen_random_uuid(),
  cle text not null,                  -- 'precompte_mobilier.taux'
  annee int not null,
  region region_fiscale,              -- null = fédéral
  valeur numeric not null,
  unite text not null,                -- 'pourcent' | 'eur' | 'coefficient'
  libelle text not null,
  source_url text not null,
  verifie_le date not null,
  unique (cle, annee, region)
);

create table tax_events (             -- pour la taxe sur les plus-values
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  date date not null,
  type text not null,                 -- 'plus_value','dividende','interet','tob','precompte'
  base_cents bigint not null,
  impot_cents bigint not null,
  annee_fiscale int not null,
  detail jsonb
);

create table simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null,                 -- 'patrimoine','interets','emprunt','locatif'
  parametres jsonb not null,
  resultat jsonb,
  partage_token text unique,          -- lien public en lecture seule
  created_at timestamptz default now()
);

create table audit_log (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  ressource text,
  ip inet,
  created_at timestamptz default now()
);
```

## Politiques RLS — modèle à répliquer sur chaque table

```sql
alter table assets enable row level security;

create policy "lecture de ses propres actifs"
  on assets for select using (auth.uid() = user_id);
create policy "creation de ses propres actifs"
  on assets for insert with check (auth.uid() = user_id);
create policy "modification de ses propres actifs"
  on assets for update using (auth.uid() = user_id);
create policy "suppression de ses propres actifs"
  on assets for delete using (auth.uid() = user_id);
```

`tax_parameters`, `categories` (système) et `institutions` sont en lecture publique
authentifiée, écriture réservée au rôle `service_role`.

## Index à créer d'emblée

```sql
create index on transactions (user_id, date desc);
create index on transactions (user_id, category_id);
create index on asset_snapshots (asset_id, date desc);
create index on net_worth_snapshots (user_id, date desc);
create index on tax_events (user_id, annee_fiscale);
create index on assets (user_id) where archive = false;
```

## Note sur `tax_parameters`

C'est la table la plus importante du projet. Chaque taux, seuil et coefficient fiscal
y vit, avec son année, sa Région, sa source officielle et sa date de vérification.
Conséquences :
- la mise à jour annuelle des montants indexés est une **insertion de données**, pas un déploiement ;
- l'app peut afficher « chiffre vérifié le … , source … » sous chaque calcul ;
- on peut rejouer une simulation avec les paramètres d'une année antérieure.
