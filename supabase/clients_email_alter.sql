-- clients_email_alter.sql
-- Adds email column to clients and unique partial index (lowercase) when present.
alter table public.clients
  add column if not exists email text;

create unique index if not exists idx_clients_email_unique
  on public.clients (lower(email))
  where email is not null;
