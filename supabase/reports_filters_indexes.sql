-- Índices para filtros de relatórios (profissional e área de atuação)
-- Script idempotente para ambientes já existentes.

begin;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tickets'
      and indexdef ilike '%(profissional_id)%'
  ) then
    create index idx_tickets_profissional_id on public.tickets (profissional_id);
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'tickets'
      and indexdef ilike '%(client_id)%'
  ) then
    create index idx_tickets_client_id on public.tickets (client_id);
  end if;

  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'clients'
      and indexdef ilike '%(area_atuacao)%'
  ) then
    create index idx_clients_area_atuacao on public.clients (area_atuacao);
  end if;
end;
$$;

commit;
