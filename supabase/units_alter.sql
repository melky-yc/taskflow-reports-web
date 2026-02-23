-- Ajustes na tabela units para suportar name_status e name_note

alter table public.units
  add column if not exists name_status text,
  add column if not exists name_note text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.units
  set name_status = 'INFORMADO'
  where name_status is null;

alter table public.units
  alter column name_status set default 'INFORMADO',
  alter column name_status set not null,
  alter column unit_name drop not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_name_status_valid'
  ) then
    alter table public.units
      add constraint check_name_status_valid check (
        name_status in ('INFORMADO', 'NAO_INFORMADO', 'NAO_ENCONTRADO', 'SEM_NOME')
      );
  end if;
end$$;

alter table public.units enable row level security;

drop policy if exists "units_select_auth" on public.units;
drop policy if exists "units_insert_auth" on public.units;
drop policy if exists "units_update_auth" on public.units;
drop policy if exists "units_delete_auth" on public.units;

create policy "units_select_auth" on public.units
  for select to authenticated
  using (true);

create policy "units_insert_auth" on public.units
  for insert to authenticated
  with check (true);

create policy "units_update_auth" on public.units
  for update to authenticated
  using (true)
  with check (true);

create policy "units_delete_auth" on public.units
  for delete to authenticated
  using (true);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'check_name_logic'
  ) then
    alter table public.units
      add constraint check_name_logic check (
        (name_status = 'INFORMADO' and unit_name is not null)
        or (name_status <> 'INFORMADO' and unit_name is null)
      );
  end if;
end$$;
