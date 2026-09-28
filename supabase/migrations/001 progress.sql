-- Progressi degli utenti: una riga per utente, con tutto UserProgress in jsonb.
-- Da eseguire una volta nel SQL Editor di Supabase (e da tenere nel repo in supabase/migrations/).

create table if not exists public.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  schema_version integer not null default 1,
  updated_at timestamptz not null default now(),
  -- Tetto di sicurezza: oggi i progressi pesano pochi kB
  constraint progress_data_size check (pg_column_size(data) < 500000)
);

alter table public.progress enable row level security;

-- Ognuno vede e scrive solo la propria riga (anche gli utenti anonimi, che hanno un id vero).
-- Niente policy di delete: la riga sparisce solo con l'account, grazie a "on delete cascade".
create policy "progress_select_own" on public.progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "progress_insert_own" on public.progress
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "progress_update_own" on public.progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.progress from anon;
grant select, insert, update on public.progress to authenticated;