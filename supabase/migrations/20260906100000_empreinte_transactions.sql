-- ─────────────────────────────────────────────────────────────
-- Nestor — index d'unicité utilisable par ON CONFLICT
--
-- L'index créé précédemment était partiel (`where empreinte is not null`).
-- Postgres refuse d'utiliser un index partiel dans une clause `on conflict`
-- sans que celle-ci répète exactement le même prédicat — ce que le client
-- Supabase ne permet pas d'exprimer. Résultat : tout upsert d'import échouait
-- avec « no unique or exclusion constraint matching the ON CONFLICT
-- specification », et aucune transaction n'entrait en base.
--
-- Un index complet règle le problème sans rien perdre : `empreinte` reste
-- nullable, et Postgres considère deux NULL comme distincts, donc les saisies
-- manuelles — qui n'ont pas d'empreinte — ne se gênent pas entre elles.
-- ─────────────────────────────────────────────────────────────

drop index if exists transactions_empreinte_idx;

create unique index transactions_empreinte_idx
  on transactions (user_id, empreinte);
