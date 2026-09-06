-- ─────────────────────────────────────────────────────────────
-- Nestor — distinguer les règles légales des hypothèses
--
-- `verifie` répondait à « cette valeur est-elle confirmée à sa source ? ».
-- Mais une partie du catalogue ne relève d'aucune source officielle : le ratio
-- de charge d'un tiers, les quotités de financement, le taux de retrait de 4 %
-- sont des pratiques de marché ou des hypothèses de simulation. Les compter
-- comme « à vérifier » promettait une vérification qui n'aura jamais lieu.
--
-- Elles restent discutables — c'est une autre affaire, et l'interface doit le
-- dire autrement : « hypothèse retenue » plutôt que « à confirmer ».
-- ─────────────────────────────────────────────────────────────

alter table tax_parameters
  add column if not exists hypothese boolean not null default false;

comment on column tax_parameters.hypothese is
  'Valeur qui ne relève pas d''un texte légal : pratique de marché, tarif commercial ou hypothèse de simulation.';
