-- Ajuste para permitir client_id opcional em ticket_motivos

alter table public.ticket_motivos
  alter column client_id drop not null;

