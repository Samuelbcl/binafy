-- ─────────────────────────────────────────────────────────────
-- Nestor — budget, catégorisation et objectifs
-- Réf. docs/04-modele-de-donnees.md, docs/02 §§ 3 et 5
-- ─────────────────────────────────────────────────────────────

create type type_categorie as enum ('revenu', 'depense', 'investissement', 'transfert');
create type source_transaction as enum ('psd2', 'coda', 'csv', 'manuel');

-- ── Catégories ───────────────────────────────────────────────
-- `user_id` nul = catégorie système, partagée et non modifiable.
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  nom text not null,
  parent_id uuid references categories(id) on delete set null,
  type type_categorie not null,
  couleur text,
  icone text,
  created_at timestamptz not null default now()
);

create index on categories (user_id);

alter table categories enable row level security;

create policy "lecture des categories systeme et des siennes"
  on categories for select to authenticated
  using (user_id is null or auth.uid() = user_id);
create policy "creation de ses propres categories"
  on categories for insert with check (auth.uid() = user_id);
create policy "modification de ses propres categories"
  on categories for update using (auth.uid() = user_id);
create policy "suppression de ses propres categories"
  on categories for delete using (auth.uid() = user_id);

-- ── Transactions ─────────────────────────────────────────────
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  category_id uuid references categories(id) on delete set null,
  date date not null,
  -- Négatif = sortie.
  montant_cents bigint not null,
  libelle text not null,
  contrepartie text,
  -- Identifiant fournisseur ou numéro d'extrait CODA : c'est la clé anti-doublon
  -- des imports. Plusieurs NULL sont autorisés par Postgres, donc les saisies
  -- manuelles ne se marchent pas dessus.
  reference_externe text,
  source source_transaction not null default 'manuel',
  recurrente boolean not null default false,
  -- Les virements entre ses propres comptes ne sont ni revenus ni dépenses.
  exclue_du_budget boolean not null default false,
  created_at timestamptz not null default now(),

  unique (user_id, reference_externe)
);

create index on transactions (user_id, date desc);
create index on transactions (user_id, category_id);
create index on transactions (user_id, date desc) where exclue_du_budget = false;

alter table transactions enable row level security;

create policy "lecture de ses propres transactions"
  on transactions for select using (auth.uid() = user_id);
create policy "creation de ses propres transactions"
  on transactions for insert with check (auth.uid() = user_id);
create policy "modification de ses propres transactions"
  on transactions for update using (auth.uid() = user_id);
create policy "suppression de ses propres transactions"
  on transactions for delete using (auth.uid() = user_id);

-- ── Règles de catégorisation ─────────────────────────────────
-- Les règles utilisateur passent avant les règles globales : priorité basse
-- d'abord. Une table d'environ 200 motifs belges courants couvre 80 % des cas,
-- ce qui suffit largement avant d'envisager un modèle.
create table categorisation_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  motif text not null,
  category_id uuid not null references categories(id) on delete cascade,
  priorite int not null default 100,
  created_at timestamptz not null default now()
);

create index on categorisation_rules (user_id, priorite);

alter table categorisation_rules enable row level security;

create policy "lecture des regles globales et des siennes"
  on categorisation_rules for select to authenticated
  using (user_id is null or auth.uid() = user_id);
create policy "creation de ses propres regles"
  on categorisation_rules for insert with check (auth.uid() = user_id);
create policy "modification de ses propres regles"
  on categorisation_rules for update using (auth.uid() = user_id);
create policy "suppression de ses propres regles"
  on categorisation_rules for delete using (auth.uid() = user_id);

-- ── Objectifs ────────────────────────────────────────────────
create type type_objectif as enum ('libre', 'precaution', 'apport_immo');

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  nom text not null,
  type type_objectif not null default 'libre',
  -- Nul quand la cible est calculée : épargne de précaution (charges fixes ×
  -- nombre de mois) et apport immobilier (moteur de frais d'acquisition).
  montant_cible_cents bigint,
  echeance date,
  parametres jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint goals_cible_ou_calculee check (
    montant_cible_cents is not null or type <> 'libre'
  )
);

create trigger goals_updated_at
  before update on goals
  for each row execute function set_updated_at();

create index on goals (user_id);

alter table goals enable row level security;

create policy "lecture de ses propres objectifs"
  on goals for select using (auth.uid() = user_id);
create policy "creation de ses propres objectifs"
  on goals for insert with check (auth.uid() = user_id);
create policy "modification de ses propres objectifs"
  on goals for update using (auth.uid() = user_id);
create policy "suppression de ses propres objectifs"
  on goals for delete using (auth.uid() = user_id);

create table goal_assets (
  goal_id uuid not null references goals(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  primary key (goal_id, asset_id)
);

alter table goal_assets enable row level security;

create policy "lecture de ses propres rattachements"
  on goal_assets for select using (
    exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid())
  );
create policy "creation de ses propres rattachements"
  on goal_assets for insert with check (
    exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid())
  );
create policy "suppression de ses propres rattachements"
  on goal_assets for delete using (
    exists (select 1 from goals g where g.id = goal_id and g.user_id = auth.uid())
  );
