-- Migração: login por CPF + 1º usuário vira admin automaticamente
-- Rode no SQL Editor do Supabase (depois do schema.sql).

alter table public.profiles
  add column if not exists cpf text;

update public.profiles
set cpf = split_part(email, '@', 1)
where (cpf is null or cpf = '')
  and (
    email like 'cpf%@atareunioes.com'
    or email like 'cpf%@gmail.com'
  );

create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and cpf <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_exists boolean;
  user_cpf text;
  user_name text;
begin
  user_cpf := coalesce(nullif(trim(new.raw_user_meta_data ->> 'cpf'), ''), '');
  user_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(user_cpf, ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  select exists (
    select 1 from public.profiles where role = 'admin'
  ) into admin_exists;

  insert into public.profiles (id, email, cpf, name, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    user_cpf,
    user_name,
    case when not admin_exists then 'admin' else 'user' end,
    case when not admin_exists then 'approved' else 'pending' end
  );

  return new;
end;
$$;
