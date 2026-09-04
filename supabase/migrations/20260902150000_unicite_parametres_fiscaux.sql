-- ─────────────────────────────────────────────────────────────
-- Nestor — correction de l'unicité de tax_parameters
--
-- La contrainte `unique (cle, annee, region)` ne protégeait rien pour les
-- paramètres fédéraux : Postgres considère deux NULL comme distincts, donc
-- `on conflict` ne déclenchait jamais sur eux et chaque exécution du seed
-- réinsérait les 65 lignes fédérales.
--
-- Postgres 15 a introduit `nulls not distinct`, qui traite deux NULL comme
-- égaux. C'est exactement la sémantique voulue : « pas de paramètre fédéral en
-- double pour une même clé et une même année ».
-- ─────────────────────────────────────────────────────────────

-- ── Nettoyage des doublons déjà insérés ──────────────────────
-- On garde la ligne la plus récemment mise à jour : c'est celle qui porte les
-- dernières corrections apportées au catalogue.
delete from tax_parameters t
using tax_parameters garde
where t.cle = garde.cle
  and t.annee = garde.annee
  and t.region is not distinct from garde.region
  and (t.updated_at, t.id) < (garde.updated_at, garde.id);

-- ── Contrainte corrigée ──────────────────────────────────────
alter table tax_parameters
  drop constraint if exists tax_parameters_cle_annee_region_key;

alter table tax_parameters
  add constraint tax_parameters_cle_annee_region_key
  unique nulls not distinct (cle, annee, region);
