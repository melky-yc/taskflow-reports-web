-- Backfill para status e updated_at em tickets legados

update public.tickets
set status = coalesce(status, 'ABERTO'),
    updated_at = coalesce(updated_at, created_at)
where status is null or updated_at is null;

