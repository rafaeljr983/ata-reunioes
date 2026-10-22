-- Rastreio de edição e conclusão de ações
-- Rode no SQL Editor do Supabase.

alter table public.atas
  add column if not exists updated_by text;

alter table public.atas
  add column if not exists edit_history jsonb not null default '[]'::jsonb;
