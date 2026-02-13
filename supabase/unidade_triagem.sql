-- Migração incremental: mover unidade para tickets e habilitar cliente multi-unidade

begin;

-- 1) Nova coluna tickets.unidade
alter table tickets
add column if not exists unidade text;

-- 2) Backfill da unidade antiga do cliente
update tickets t
set unidade = c.unidade
from clients c
where t.client_id = c.id
  and t.unidade is null;

-- 3) Constraint para evitar string vazia (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'tickets_unidade_not_blank_chk'
  ) then
    alter table tickets
    add constraint tickets_unidade_not_blank_chk
    check (unidade is null or btrim(unidade) <> '');
  end if;
end;
$$;

-- 4) Índice para filtros/relatórios
create index if not exists idx_tickets_unidade on tickets(unidade);

-- 5) Flag para cliente hub (secretaria)
alter table clients
add column if not exists multi_unidade boolean not null default false;

commit;
