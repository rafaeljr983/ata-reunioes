-- Ata — schema Supabase (Auth + profiles + atas + RLS)
-- Execute este arquivo no SQL Editor do projeto Supabase.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  cpf text,
  name text not null default '',
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);
create unique index if not exists profiles_cpf_unique
  on public.profiles (cpf)
  where cpf is not null and cpf <> '';

-- ---------------------------------------------------------------------------
-- Atas
-- ---------------------------------------------------------------------------

create table if not exists public.atas (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  date date not null,
  time text not null default '',
  location text not null default '',
  facilitator text not null default '',
  participants text[] not null default '{}',
  agenda text not null default '',
  discussions text not null default '',
  decisions text[] not null default '{}',
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'rascunho' check (status in ('rascunho', 'finalizada')),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists atas_date_idx on public.atas (date desc);

-- ---------------------------------------------------------------------------
-- Helpers (security definer — evita recursão de RLS)
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'approved'
  );
$$;

create or replace function public.has_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'approved'
      and role in ('admin', 'user')
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists atas_set_updated_at on public.atas;
create trigger atas_set_updated_at
  before update on public.atas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-criar perfil ao cadastrar (auth.users)
-- ---------------------------------------------------------------------------

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.atas enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "atas_select_access" on public.atas;
create policy "atas_select_access"
  on public.atas for select
  to authenticated
  using (public.has_access());

drop policy if exists "atas_insert_access" on public.atas;
create policy "atas_insert_access"
  on public.atas for insert
  to authenticated
  with check (public.has_access() and created_by = auth.uid());

drop policy if exists "atas_update_access" on public.atas;
create policy "atas_update_access"
  on public.atas for update
  to authenticated
  using (public.has_access())
  with check (public.has_access());

drop policy if exists "atas_delete_access" on public.atas;
create policy "atas_delete_access"
  on public.atas for delete
  to authenticated
  using (public.has_access());

-- ---------------------------------------------------------------------------
-- O primeiro cadastro vira admin automaticamente.
-- Se precisar promover depois por CPF:
-- ---------------------------------------------------------------------------
-- update public.profiles
-- set role = 'admin', status = 'approved'
-- where cpf = '00000000000';
