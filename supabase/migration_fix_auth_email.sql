-- Corrige e-mail sintético do Auth (domínio antigo sem DNS era rejeitado no cadastro).
-- Formato novo: cpf{11 dígitos}@gmail.com
--
-- 1) Desative Confirm email: Authentication → Providers → Email
-- 2) Publique o app com o novo formato
-- 3) Rode este SQL no Editor do Supabase

update auth.users
set
  email = replace(email, '@atareunioes.com', '@gmail.com'),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where email like '%@atareunioes.com';

update auth.identities
set
  identity_data = jsonb_set(
    identity_data,
    '{email}',
    to_jsonb(replace(coalesce(identity_data ->> 'email', ''), '@atareunioes.com', '@gmail.com'))
  ),
  updated_at = now()
where provider = 'email'
  and coalesce(identity_data ->> 'email', '') like '%@atareunioes.com';

update auth.identities
set
  provider_id = replace(provider_id, '@atareunioes.com', '@gmail.com'),
  updated_at = now()
where provider = 'email'
  and provider_id like '%@atareunioes.com';

update public.profiles
set email = replace(email, '@atareunioes.com', '@gmail.com')
where email like '%@atareunioes.com';
