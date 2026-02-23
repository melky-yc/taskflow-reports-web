-- Garante no máximo 1 ticket ativo por cliente

create unique index if not exists tickets_client_active_uidx
  on public.tickets (client_id)
  where status = 'ABERTO' and client_id is not null;
