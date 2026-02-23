-- =============================================================
-- Auto-update `updated_at` trigger
-- =============================================================
-- Attaches to: tickets, ticket_motivos
-- Any UPDATE will automatically set updated_at = now().
-- =============================================================

-- Create the trigger function (idempotent)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- Attach to tickets
drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
  before update on public.tickets
  for each row
  execute function public.set_updated_at();

-- Attach to ticket_motivos
drop trigger if exists trg_ticket_motivos_updated_at on public.ticket_motivos;
create trigger trg_ticket_motivos_updated_at
  before update on public.ticket_motivos
  for each row
  execute function public.set_updated_at();
