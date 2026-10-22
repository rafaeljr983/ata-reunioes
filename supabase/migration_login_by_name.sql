-- Login por nome: busca o e-mail interno a partir do nome do perfil.
-- Rode no SQL Editor do Supabase.

create or replace function public.login_email_for_name(p_name text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email
  from public.profiles
  where lower(trim(name)) = lower(trim(p_name))
    and coalesce(trim(name), '') <> ''
  order by created_at asc
  limit 1;
$$;

revoke all on function public.login_email_for_name(text) from public;
grant execute on function public.login_email_for_name(text) to anon, authenticated;
