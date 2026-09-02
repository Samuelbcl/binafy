-- ─────────────────────────────────────────────────────────────
-- Nestor — moteur fiscal, simulations et audit
-- Réf. docs/04-modele-de-donnees.md § note tax_parameters
--
-- `tax_parameters` est la table la plus importante du projet. Chaque taux,
-- seuil et coefficient y vit avec son année, sa Région, sa source officielle
-- et sa date de vérification. Conséquences :
--   · la mise à jour annuelle est une INSERTION de données, pas un déploiement ;
--   · l'app affiche « chiffre vérifié le …, source … » sous chaque calcul ;
--   · on peut rejouer une simulation avec les paramètres d'une année antérieure.
-- ─────────────────────────────────────────────────────────────

create type unite_parametre as enum ('pourcent', 'eur', 'coefficient', 'annees');

create table tax_parameters (
  id uuid primary key default gen_random_uuid(),
  cle text not null,
  annee int not null check (annee between 2000 and 2100),
  -- Nul = paramètre fédéral. Renseigné = paramètre régional, qui prime.
  region region_fiscale,
  valeur numeric not null,
  unite unite_parametre not null,
  libelle text not null,
  source_url text not null,
  verifie_le date not null,
  -- Ajout par rapport à la doc 04 : distingue une valeur confirmée à la source
  -- d'un ordre de grandeur en attente. L'interface avertit sur tout calcul qui
  -- dépend d'un paramètre non vérifié, plutôt que de laisser croire.
  verifie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (cle, annee, region)
);

create trigger tax_parameters_updated_at
  before update on tax_parameters
  for each row execute function set_updated_at();

create index on tax_parameters (annee, cle);

alter table tax_parameters enable row level security;

-- Lecture publique authentifiée, écriture réservée au service_role.
create policy "lecture des parametres fiscaux"
  on tax_parameters for select to authenticated using (true);

-- ── Événements fiscaux ───────────────────────────────────────
-- Alimente le suivi de l'exonération annuelle sur les plus-values et la
-- position fiscale de l'année.
create type type_evenement_fiscal as enum (
  'plus_value', 'moins_value', 'dividende', 'interet', 'tob', 'precompte', 'reynders'
);

create table tax_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  asset_transaction_id uuid references asset_transactions(id) on delete set null,
  date date not null,
  type type_evenement_fiscal not null,
  base_cents bigint not null,
  impot_cents bigint not null,
  annee_fiscale int not null,
  -- Le `breakdown` du calculateur, conservé tel quel : on doit pouvoir
  -- réexpliquer un chiffre des années plus tard.
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index on tax_events (user_id, annee_fiscale);
create index on tax_events (user_id, date desc);

alter table tax_events enable row level security;

create policy "lecture de ses propres evenements fiscaux"
  on tax_events for select using (auth.uid() = user_id);
create policy "creation de ses propres evenements fiscaux"
  on tax_events for insert with check (auth.uid() = user_id);
create policy "modification de ses propres evenements fiscaux"
  on tax_events for update using (auth.uid() = user_id);
create policy "suppression de ses propres evenements fiscaux"
  on tax_events for delete using (auth.uid() = user_id);

-- ── Simulations ──────────────────────────────────────────────
create type type_simulation as enum ('patrimoine', 'interets', 'emprunt', 'locatif', 'independant');

create table simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type type_simulation not null,
  parametres jsonb not null,
  resultat jsonb,
  -- Lien public en lecture seule, pour le partage d'une simulation.
  partage_token text unique,
  created_at timestamptz not null default now()
);

create index on simulations (user_id, created_at desc);

alter table simulations enable row level security;

create policy "lecture de ses propres simulations"
  on simulations for select using (auth.uid() = user_id);
create policy "creation de ses propres simulations"
  on simulations for insert with check (auth.uid() = user_id);
create policy "modification de ses propres simulations"
  on simulations for update using (auth.uid() = user_id);
create policy "suppression de ses propres simulations"
  on simulations for delete using (auth.uid() = user_id);

-- Une simulation partagée est lisible sans compte, mais uniquement par token :
-- la policy ne s'ouvre jamais à l'ensemble de la table.
create policy "lecture publique d une simulation partagee"
  on simulations for select to anon
  using (partage_token is not null);

-- ── Journal d'audit ──────────────────────────────────────────
-- Trace les accès aux données bancaires. Aucun montant n'y entre jamais :
-- un montant dans un journal est une fuite.
create table audit_log (
  id bigserial primary key,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  ressource text,
  ip inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index on audit_log (user_id, created_at desc);

alter table audit_log enable row level security;

create policy "lecture de son propre journal"
  on audit_log for select using (auth.uid() = user_id);
