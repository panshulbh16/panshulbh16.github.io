-- PSI Planning Grid: one private workspace (items, parameters, weekly and monthly plans) per signed-in user.
-- Run once in the Supabase SQL editor, or with `supabase db push`.

create table if not exists public.psi_workspaces (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint psi_workspaces_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint psi_workspaces_data_size check (octet_length(data::text) <= 1000000)
);

alter table public.psi_workspaces enable row level security;
alter table public.psi_workspaces force row level security;

revoke all on public.psi_workspaces from anon;
grant select, insert, update, delete on public.psi_workspaces to authenticated;

drop policy if exists "psi read own"   on public.psi_workspaces;
drop policy if exists "psi insert own" on public.psi_workspaces;
drop policy if exists "psi update own" on public.psi_workspaces;
drop policy if exists "psi delete own" on public.psi_workspaces;

create policy "psi read own"   on public.psi_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy "psi insert own" on public.psi_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "psi update own" on public.psi_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "psi delete own" on public.psi_workspaces for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.psi_touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists psi_workspaces_touch on public.psi_workspaces;
create trigger psi_workspaces_touch before insert or update on public.psi_workspaces
  for each row execute function public.psi_touch_updated_at();
