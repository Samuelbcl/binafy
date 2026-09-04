-- ─────────────────────────────────────────────────────────────
-- Nestor — catégories système et comptes importés
--
-- Les catégories système portent `user_id = null` : elles sont partagées et
-- lisibles par tous, mais modifiables par personne. L'utilisateur crée les
-- siennes à côté s'il veut affiner.
--
-- La clé stable `cle` permet au code de désigner une catégorie sans dépendre
-- de son libellé, qui pourra être traduit en nl-BE sans rien casser.
-- ─────────────────────────────────────────────────────────────

alter table categories add column if not exists cle text;

-- Unicité sur les seules catégories système : un utilisateur peut nommer les
-- siennes comme il veut, y compris comme une catégorie système.
create unique index if not exists categories_cle_systeme_idx
  on categories (cle)
  where user_id is null;

insert into categories (user_id, cle, nom, type, couleur) values
  (null, 'salaire',             'Salaire',                  'revenu',         'var(--data-3)'),
  (null, 'revenus_independant', 'Revenus d''indépendant',   'revenu',         'var(--data-6)'),
  (null, 'allocations',         'Allocations',              'revenu',         'var(--data-2)'),
  (null, 'autres_revenus',      'Autres revenus',           'revenu',         'var(--data-8)'),

  (null, 'logement',            'Logement',                 'depense',        'var(--data-1)'),
  (null, 'energie',             'Énergie et eau',           'depense',        'var(--data-7)'),
  (null, 'courses',             'Courses',                  'depense',        'var(--data-2)'),
  (null, 'transport',           'Transport',                'depense',        'var(--data-3)'),
  (null, 'telecom',             'Télécoms et internet',     'depense',        'var(--data-4)'),
  (null, 'assurances',          'Assurances',               'depense',        'var(--data-5)'),
  (null, 'sante',               'Santé',                    'depense',        'var(--data-6)'),
  (null, 'restaurants',         'Restaurants et cafés',     'depense',        'var(--data-7)'),
  (null, 'loisirs',             'Loisirs et sorties',       'depense',        'var(--data-4)'),
  (null, 'abonnements',         'Abonnements',              'depense',        'var(--data-5)'),
  (null, 'shopping',            'Shopping',                 'depense',        'var(--data-8)'),
  (null, 'impots',              'Impôts et taxes',          'depense',        'var(--data-5)'),
  (null, 'frais_bancaires',     'Frais bancaires',          'depense',        'var(--data-8)'),
  (null, 'education',           'Éducation',                'depense',        'var(--data-2)'),
  (null, 'dons',                'Dons',                     'depense',        'var(--data-3)'),
  (null, 'autres_depenses',     'Autres dépenses',          'depense',        'var(--data-8)'),

  (null, 'investissement',      'Investissement',           'investissement', 'var(--data-1)'),
  (null, 'epargne_pension',     'Épargne-pension',          'investissement', 'var(--data-6)'),
  (null, 'credit',              'Remboursement de crédit',  'investissement', 'var(--data-7)'),

  (null, 'transfert',           'Transfert interne',        'transfert',      'var(--data-8)')
on conflict (cle) where user_id is null do update set
  nom = excluded.nom,
  type = excluded.type,
  couleur = excluded.couleur;

-- ── Comptes d'import ─────────────────────────────────────────
-- Une transaction importée appartient à un compte, et l'empreinte anti-doublon
-- est calculée par compte : la même opération sur deux comptes reste deux lignes.
alter table transactions add column if not exists empreinte text;

create unique index if not exists transactions_empreinte_idx
  on transactions (user_id, empreinte)
  where empreinte is not null;

-- Trace ce qui a été importé, pour pouvoir annuler un import complet.
create table if not exists imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  asset_id uuid references assets(id) on delete set null,
  nom_fichier text not null,
  source source_transaction not null default 'csv',
  lignes_importees int not null default 0,
  lignes_ignorees int not null default 0,
  lignes_rejetees int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists imports_user_idx on imports (user_id, created_at desc);

alter table imports enable row level security;

create policy "lecture de ses propres imports"
  on imports for select using (auth.uid() = user_id);
create policy "creation de ses propres imports"
  on imports for insert with check (auth.uid() = user_id);
create policy "suppression de ses propres imports"
  on imports for delete using (auth.uid() = user_id);

alter table transactions add column if not exists import_id uuid references imports(id) on delete set null;

create index if not exists transactions_import_idx on transactions (import_id);
