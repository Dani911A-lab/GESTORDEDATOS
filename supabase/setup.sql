-- Base compartida sin inicio de sesión. Ejecuta todo en Supabase > SQL Editor.
create table if not exists public.app_shared_state (
  id text primary key,
  archivos_carga jsonb not null default '[]'::jsonb,
  directorio_registros jsonb not null default '{}'::jsonb,
  directorio_columnas jsonb not null default '{}'::jsonb,
  directorio_orden jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_shared_state_singleton check (id = 'principal')
);

alter table public.app_shared_state enable row level security;
revoke all on table public.app_shared_state from public;
grant select, insert, update on table public.app_shared_state to anon, authenticated;

drop policy if exists "Leer estado compartido" on public.app_shared_state;
create policy "Leer estado compartido" on public.app_shared_state
for select to anon, authenticated using (id = 'principal');

drop policy if exists "Crear estado compartido" on public.app_shared_state;
create policy "Crear estado compartido" on public.app_shared_state
for insert to anon, authenticated with check (id = 'principal');

drop policy if exists "Actualizar estado compartido" on public.app_shared_state;
create policy "Actualizar estado compartido" on public.app_shared_state
for update to anon, authenticated using (id = 'principal') with check (id = 'principal');
