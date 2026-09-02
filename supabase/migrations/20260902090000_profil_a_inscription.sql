-- ─────────────────────────────────────────────────────────────
-- Nestor — création automatique du profil à l'inscription
--
-- `profiles.id` référence `auth.users`, mais rien ne crée la ligne. Sans ce
-- trigger, un utilisateur qui vient de valider son lien magique arrive sur un
-- dashboard qui n'a pas de profil à lire — et toutes les policies RLS, qui
-- pointent vers `profiles`, échouent silencieusement.
--
-- Le détenteur « moi » est créé en même temps : la quote-part de détention
-- existe dès la V1 (docs/02 § module 2), elle a besoin d'un détenteur par défaut.
-- ─────────────────────────────────────────────────────────────

create or replace function creer_profil_a_inscription()
returns trigger
language plpgsql
security definer
-- `search_path` figé : une fonction `security definer` sans cela est une porte
-- d'entrée classique pour une élévation de privilèges.
set search_path = public
as $$
declare
  prenom_utilisateur text;
begin
  -- Le prénom peut venir des métadonnées d'inscription ; sinon on le laisse nul
  -- et l'utilisateur le renseignera dans ses paramètres.
  prenom_utilisateur := nullif(trim(new.raw_user_meta_data ->> 'prenom'), '');

  insert into public.profiles (id, prenom)
  values (new.id, prenom_utilisateur)
  on conflict (id) do nothing;

  insert into public.holders (user_id, nom, est_utilisateur)
  values (new.id, coalesce(prenom_utilisateur, 'Moi'), true);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function creer_profil_a_inscription();

-- ── Rattrapage ───────────────────────────────────────────────
-- Crée les profils manquants pour les comptes déjà existants, au cas où des
-- utilisateurs auraient été créés avant l'ajout du trigger.
insert into public.profiles (id)
select u.id
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.holders (user_id, nom, est_utilisateur)
select p.id, 'Moi', true
from public.profiles p
left join public.holders h on h.user_id = p.id and h.est_utilisateur
where h.id is null;
