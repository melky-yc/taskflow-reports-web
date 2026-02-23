-- =============================================================
-- RLS Hardening: Team-Shared Reads / Owner-Only Writes
-- =============================================================
-- Model:
--   - All authenticated users can READ all data (team dashboard).
--   - Users can only INSERT/UPDATE/DELETE their own tickets.
--   - ticket_motivos restricted via ticket ownership join.
--   - clients, client_emails, units: shared resources (full auth access).
--   - profiles: own-row only for writes.
-- =============================================================

begin;

-- ─── tickets ────────────────────────────────────────────────

drop policy if exists "tickets_select_auth" on public.tickets;
drop policy if exists "tickets_insert_auth" on public.tickets;
drop policy if exists "tickets_update_auth" on public.tickets;
drop policy if exists "tickets_delete_auth" on public.tickets;

-- All authenticated users can read all tickets (team dashboard)
create policy "tickets_select_auth" on public.tickets
  for select to authenticated
  using (true);

-- Only the owner can insert (profissional_id must match auth.uid())
create policy "tickets_insert_auth" on public.tickets
  for insert to authenticated
  with check (profissional_id = auth.uid());

-- Only the owner can update
create policy "tickets_update_auth" on public.tickets
  for update to authenticated
  using (profissional_id = auth.uid())
  with check (profissional_id = auth.uid());

-- Only the owner can delete
create policy "tickets_delete_auth" on public.tickets
  for delete to authenticated
  using (profissional_id = auth.uid());

-- ─── ticket_motivos ─────────────────────────────────────────

drop policy if exists "ticket_motivos_select_auth" on public.ticket_motivos;
drop policy if exists "ticket_motivos_insert_auth" on public.ticket_motivos;
drop policy if exists "ticket_motivos_update_auth" on public.ticket_motivos;
drop policy if exists "ticket_motivos_delete_auth" on public.ticket_motivos;

-- All authenticated users can read all motivos (team dashboard)
create policy "ticket_motivos_select_auth" on public.ticket_motivos
  for select to authenticated
  using (true);

-- Insert only if the parent ticket belongs to the user
create policy "ticket_motivos_insert_auth" on public.ticket_motivos
  for insert to authenticated
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.profissional_id = auth.uid()
    )
  );

-- Update only if the parent ticket belongs to the user
create policy "ticket_motivos_update_auth" on public.ticket_motivos
  for update to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.profissional_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.profissional_id = auth.uid()
    )
  );

-- Delete only if the parent ticket belongs to the user
create policy "ticket_motivos_delete_auth" on public.ticket_motivos
  for delete to authenticated
  using (
    exists (
      select 1 from public.tickets t
      where t.id = ticket_id
        and t.profissional_id = auth.uid()
    )
  );

-- ─── clients ────────────────────────────────────────────────
-- Shared resource: all authenticated users have full access
-- (multiple professionals work with the same client)

drop policy if exists "clients_select_auth" on public.clients;
drop policy if exists "clients_insert_auth" on public.clients;
drop policy if exists "clients_update_auth" on public.clients;
drop policy if exists "clients_delete_auth" on public.clients;

create policy "clients_select_auth" on public.clients
  for select to authenticated using (true);

create policy "clients_insert_auth" on public.clients
  for insert to authenticated with check (true);

create policy "clients_update_auth" on public.clients
  for update to authenticated
  using (true) with check (true);

create policy "clients_delete_auth" on public.clients
  for delete to authenticated using (true);

-- ─── client_emails ──────────────────────────────────────────
-- Shared resource (tied to clients, not to a specific user)

drop policy if exists "client_emails_select_auth" on public.client_emails;
drop policy if exists "client_emails_insert_auth" on public.client_emails;
drop policy if exists "client_emails_update_auth" on public.client_emails;
drop policy if exists "client_emails_delete_auth" on public.client_emails;

create policy "client_emails_select_auth" on public.client_emails
  for select to authenticated using (true);

create policy "client_emails_insert_auth" on public.client_emails
  for insert to authenticated with check (true);

create policy "client_emails_update_auth" on public.client_emails
  for update to authenticated
  using (true) with check (true);

create policy "client_emails_delete_auth" on public.client_emails
  for delete to authenticated using (true);

-- ─── units ──────────────────────────────────────────────────
-- Reference data: full authenticated access

drop policy if exists "units_select_auth" on public.units;
drop policy if exists "units_insert_auth" on public.units;
drop policy if exists "units_update_auth" on public.units;
drop policy if exists "units_delete_auth" on public.units;

create policy "units_select_auth" on public.units
  for select to authenticated using (true);

create policy "units_insert_auth" on public.units
  for insert to authenticated with check (true);

create policy "units_update_auth" on public.units
  for update to authenticated
  using (true) with check (true);

create policy "units_delete_auth" on public.units
  for delete to authenticated using (true);

-- ─── profiles ───────────────────────────────────────────────
-- Own-row only for writes; all authenticated can read

drop policy if exists "profiles_select_auth" on public.profiles;
drop policy if exists "profiles_insert_auth" on public.profiles;
drop policy if exists "profiles_update_auth" on public.profiles;
drop policy if exists "profiles_delete_auth" on public.profiles;

create policy "profiles_select_auth" on public.profiles
  for select to authenticated using (true);

create policy "profiles_insert_auth" on public.profiles
  for insert to authenticated
  with check (auth_user_id = auth.uid());

create policy "profiles_update_auth" on public.profiles
  for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- No delete allowed for profiles
-- (omitting delete policy = denied by default under RLS)

commit;
