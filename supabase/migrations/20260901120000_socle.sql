-- ─────────────────────────────────────────────────────────────
-- Nestor — socle : profils, détenteurs, institutions, connexions
-- Réf. docs/04-modele-de-donnees.md
--
-- Règles appliquées partout :
--   · tous les montants sont des `bigint` en centimes, jamais de float ;
--   · toutes les dates sont en UTC (`timestamptz`), affichées en Europe/Brussels ;
--   · RLS activée sur chaque table dès sa création, avec ses quatre policies.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Types ────────────────────────────────────────────────────
create type region_fiscale as enum ('wallonie', 'bruxelles', 'flandre');

create type statut_pro as enum (
  'salarie',
  'independant_complementaire',
  'independant_principal',
  'etudiant',
  'autre'
);

create type connexion_statut as enum ('active', 'expiree', 'erreur', 'revoquee');

-- ── Fonction utilitaire : updated_at ─────────────────────────
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Profils ──────────────────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  prenom text,
  region region_fiscale not null default 'wallonie',
  statut statut_pro not null default 'salarie',
  date_naissance date,
  situation_familiale text check (
    situation_familiale is null
    or situation_familiale in ('isole', 'cohabitant', 'marie')
  ),
  -- Les additionnels communaux varient fortement d'une commune à l'autre :
  -- la moyenne nationale ne suffit pas pour un taux marginal juste.
  commune text,
  additionnels_communaux numeric(5, 2),
  devise char(3) not null default 'EUR',
  locale text not null default 'fr-BE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

alter table profiles enable row level security;

create policy "lecture de son propre profil"
  on profiles for select using (auth.uid() = id);
create policy "creation de son propre profil"
  on profiles for insert with check (auth.uid() = id);
create policy "modification de son propre profil"
  on profiles for update using (auth.uid() = id);
create policy "suppression de son propre profil"
  on profiles for delete using (auth.uid() = id);

-- ── Détenteurs ───────────────────────────────────────────────
-- Permet la détention partagée en couple sans créer de comptes liés.
create table holders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  est_utilisateur boolean not null default false,
  created_at timestamptz not null default now()
);

alter table holders enable row level security;

create policy "lecture de ses propres detenteurs"
  on holders for select using (auth.uid() = user_id);
create policy "creation de ses propres detenteurs"
  on holders for insert with check (auth.uid() = user_id);
create policy "modification de ses propres detenteurs"
  on holders for update using (auth.uid() = user_id);
create policy "suppression de ses propres detenteurs"
  on holders for delete using (auth.uid() = user_id);

-- ── Institutions ─────────────────────────────────────────────
-- Table de référence : lecture pour tout utilisateur authentifié,
-- écriture réservée au service_role.
create table institutions (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  bic text,
  pays char(2) not null default 'BE',
  logo_url text,
  provider_ref text,
  created_at timestamptz not null default now()
);

alter table institutions enable row level security;

create policy "lecture des institutions"
  on institutions for select to authenticated using (true);

-- ── Connexions bancaires ─────────────────────────────────────
create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  institution_id uuid references institutions(id),
  provider text not null check (provider in ('gocardless', 'ponto', 'manuel')),
  provider_account_id text,
  -- Jamais en clair, jamais exposé à un Client Component.
  access_token_chiffre text,
  statut connexion_statut not null default 'active',
  -- PSD2 : le consentement expire après 90 jours et doit être renouvelé
  -- explicitement par l'utilisateur. L'écran de re-consentement et l'email
  -- de relance à J-7 s'appuient sur cette colonne.
  consentement_expire_le timestamptz,
  derniere_sync_le timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bank_connections_updated_at
  before update on bank_connections
  for each row execute function set_updated_at();

create index on bank_connections (user_id);
create index on bank_connections (consentement_expire_le)
  where statut = 'active';

alter table bank_connections enable row level security;

create policy "lecture de ses propres connexions"
  on bank_connections for select using (auth.uid() = user_id);
create policy "creation de ses propres connexions"
  on bank_connections for insert with check (auth.uid() = user_id);
create policy "modification de ses propres connexions"
  on bank_connections for update using (auth.uid() = user_id);
create policy "suppression de ses propres connexions"
  on bank_connections for delete using (auth.uid() = user_id);
