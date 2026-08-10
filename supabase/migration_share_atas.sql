-- Garante que TODOS os usuários aprovados veem as mesmas atas.
-- Rode no SQL Editor do Supabase.

-- Políticas compartilhadas (admin e user approved)
drop policy if exists "atas_select_access" on public.atas;
drop policy if exists "atas_select_own" on public.atas;
drop policy if exists "atas_select_own_or_admin" on public.atas;

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

-- Atualização em tempo real entre aparelhos
do $$
begin
  alter publication supabase_realtime add table public.atas;
exception
  when duplicate_object then null;
end $$;

-- Diagnóstico (opcional): veja as políticas ativas
-- select policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public' and tablename = 'atas';
