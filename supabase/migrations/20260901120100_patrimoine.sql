-- ─────────────────────────────────────────────────────────────
-- Nestor — patrimoine : actifs, passifs, transactions titres, historique
-- Réf. docs/04-modele-de-donnees.md
--
-- Trois écarts assumés par rapport à la doc 04, signalés en revue :
--   1. `assets.valeur_reference_2025_cents` : la doc 06 impose de stocker la
--      valeur au 31/12/2025 pour la taxe sur les plus-values, mais le schéma
--      l'oubliait. Sans elle, l'impôt latent est massivement surestimé.
--   2. `asset_transactions` : la doc n'avait que `transactions` (cash/budget).
--      Les plus-values réalisées et la TOB ont besoin des mouvements titres,
--      avec quantité et prix unitaire. C'est une table à part entière.
--   3. `net_worth_snapshots` distingue la valeur ménage et la quote-part
--      personnelle : les deux vues du produit ont chacune besoin de la sienne.
-- ─────────────────────────────────────────────────────────────

create type classe_actif as enum (
  'compte_courant', 'compte_epargne', 'compte_titres', 'etf', 'action', 'obligation',
  'fonds', 'crypto', 'immobilier', 'assurance_groupe', 'epargne_pension', 'branche21',
  'branche23', 'parts_societe', 'creance', 'metaux', 'autre'
);

create type type_passif as enum (
  'credit_hypothecaire', 'pret_temperament', 'pret_prive', 'leasing', 'autre'
);

create type usage_bien as enum ('propre', 'locatif_prive', 'locatif_pro');

-- ── Actifs ───────────────────────────────────────────────────
create table assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  connection_id uuid references bank_connections(id) on delete set null,
  institution_id uuid references institutions(id),
  nom text not null,
  classe classe_actif not null,
  isin text,
  ticker text,
  quantite numeric(24, 8),
  valeur_unitaire_cents bigint,
  solde_cents bigint,
  devise char(3) not null default 'EUR',

  -- Attributs fiscaux belges
  capitalisant boolean,
  -- L'inscription en Belgique se lit sur la liste FSMA, pas sur l'ISIN :
  -- un ISIN luxembourgeois peut être inscrit à la distribution en Belgique.
  inscrit_en_belgique boolean,
  part_obligataire numeric(5, 2) check (
    part_obligataire is null or (part_obligataire >= 0 and part_obligataire <= 100)
  ),
  compte_epargne_reglemente boolean,
  taux_base numeric(6, 4),
  prime_fidelite numeric(6, 4),

  -- Base de référence pour la taxe sur les plus-values (docs/06 § 1)
  prix_acquisition_cents bigint,
  date_acquisition date,
  -- Point de départ du régime de 2026 : la plus-value antérieure y échappe.
  valeur_reference_2025_cents bigint,

  -- Immobilier
  revenu_cadastral_cents bigint,
  usage_bien usage_bien,
  precompte_immobilier_annuel_cents bigint,

  est_manuel boolean not null default true,
  archive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Un compte porte un solde, une position porte quantité et valeur unitaire.
  constraint assets_valorisation_coherente check (
    solde_cents is not null
    or (quantite is not null and valeur_unitaire_cents is not null)
    or est_manuel
  )
);

create trigger assets_updated_at
  before update on assets
  for each row execute function set_updated_at();

create index on assets (user_id) where archive = false;
create index on assets (user_id, classe) where archive = false;
create index on assets (connection_id) where connection_id is not null;

alter table assets enable row level security;

create policy "lecture de ses propres actifs"
  on assets for select using (auth.uid() = user_id);
create policy "creation de ses propres actifs"
  on assets for insert with check (auth.uid() = user_id);
create policy "modification de ses propres actifs"
  on assets for update using (auth.uid() = user_id);
create policy "suppression de ses propres actifs"
  on assets for delete using (auth.uid() = user_id);

-- ── Quotes-parts de détention ────────────────────────────────
create table asset_holders (
  asset_id uuid not null references assets(id) on delete cascade,
  holder_id uuid not null references holders(id) on delete cascade,
  quote_part numeric(5, 2) not null check (quote_part > 0 and quote_part <= 100),
  primary key (asset_id, holder_id)
);

alter table asset_holders enable row level security;

-- La propriété se lit à travers l'actif : une seule source de vérité.
create policy "lecture de ses propres quotes-parts"
  on asset_holders for select using (
    exists (select 1 from assets a where a.id = asset_id and a.user_id = auth.uid())
  );
create policy "creation de ses propres quotes-parts"
  on asset_holders for insert with check (
    exists (select 1 from assets a where a.id = asset_id and a.user_id = auth.uid())
  );
create policy "modification de ses propres quotes-parts"
  on asset_holders for update using (
    exists (select 1 from assets a where a.id = asset_id and a.user_id = auth.uid())
  );
create policy "suppression de ses propres quotes-parts"
  on asset_holders for delete using (
    exists (select 1 from assets a where a.id = asset_id and a.user_id = auth.uid())
  );

-- ── Mouvements titres ────────────────────────────────────────
-- Absent de la doc 04, indispensable au calcul des plus-values réalisées
-- et de la TOB : ce sont des données de portefeuille, pas de budget.
create type sens_transaction_titre as enum (
  'achat', 'vente', 'dividende', 'coupon', 'split', 'frais'
);

create table asset_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid not null references assets(id) on delete cascade,
  date date not null,
  sens sens_transaction_titre not null,
  quantite numeric(24, 8),
  prix_unitaire_cents bigint,
  montant_brut_cents bigint not null,
  frais_courtage_cents bigint not null default 0,
  -- TOB retenue par le courtier, ou calculée puis à déclarer soi-même.
  tob_cents bigint not null default 0,
  tob_retenue_a_la_source boolean not null default true,
  precompte_cents bigint not null default 0,
  precompte_retenu_a_la_source boolean not null default true,
  devise char(3) not null default 'EUR',
  reference_externe text,
  created_at timestamptz not null default now(),

  unique (user_id, reference_externe)
);

create index on asset_transactions (user_id, date desc);
create index on asset_transactions (asset_id, date desc);

alter table asset_transactions enable row level security;

create policy "lecture de ses propres mouvements titres"
  on asset_transactions for select using (auth.uid() = user_id);
create policy "creation de ses propres mouvements titres"
  on asset_transactions for insert with check (auth.uid() = user_id);
create policy "modification de ses propres mouvements titres"
  on asset_transactions for update using (auth.uid() = user_id);
create policy "suppression de ses propres mouvements titres"
  on asset_transactions for delete using (auth.uid() = user_id);

-- ── Passifs ──────────────────────────────────────────────────
create table liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  nom text not null,
  type type_passif not null,
  capital_initial_cents bigint not null check (capital_initial_cents >= 0),
  capital_restant_cents bigint not null check (capital_restant_cents >= 0),
  taux_annuel numeric(6, 4) not null,
  taux_fixe boolean not null default true,
  duree_mois int not null check (duree_mois > 0),
  date_debut date not null,
  mensualite_cents bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger liabilities_updated_at
  before update on liabilities
  for each row execute function set_updated_at();

create index on liabilities (user_id);

alter table liabilities enable row level security;

create policy "lecture de ses propres passifs"
  on liabilities for select using (auth.uid() = user_id);
create policy "creation de ses propres passifs"
  on liabilities for insert with check (auth.uid() = user_id);
create policy "modification de ses propres passifs"
  on liabilities for update using (auth.uid() = user_id);
create policy "suppression de ses propres passifs"
  on liabilities for delete using (auth.uid() = user_id);

-- ── Historique ───────────────────────────────────────────────
-- Source unique de vérité de la courbe de patrimoine : elle se reconstruit
-- depuis ces snapshots, elle n'est jamais recalculée à la volée.
create table asset_snapshots (
  id bigserial primary key,
  asset_id uuid not null references assets(id) on delete cascade,
  date date not null,
  valeur_cents bigint not null,
  unique (asset_id, date)
);

create index on asset_snapshots (asset_id, date desc);

alter table asset_snapshots enable row level security;

create policy "lecture de ses propres snapshots"
  on asset_snapshots for select using (
    exists (select 1 from assets a where a.id = asset_id and a.user_id = auth.uid())
  );

create table net_worth_snapshots (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  date date not null,
  -- Vue ménage : la valeur intégrale des biens détenus.
  actifs_cents bigint not null,
  passifs_cents bigint not null,
  net_cents bigint not null,
  -- Vue personnelle : la quote-part de l'utilisateur. Le dashboard affiche
  -- celle-ci par défaut, avec un basculement vers la vue ménage.
  actifs_quote_part_cents bigint,
  passifs_quote_part_cents bigint,
  net_quote_part_cents bigint,
  -- Le différenciateur Nestor.
  impot_latent_cents bigint,
  unique (user_id, date)
);

create index on net_worth_snapshots (user_id, date desc);

alter table net_worth_snapshots enable row level security;

create policy "lecture de son propre historique"
  on net_worth_snapshots for select using (auth.uid() = user_id);
