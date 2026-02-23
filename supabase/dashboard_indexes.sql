-- Índices recomendados para dashboard
create index if not exists idx_motivos_created_at on public.ticket_motivos (created_at);
create index if not exists idx_motivos_client on public.ticket_motivos (client_id);
create index if not exists idx_motivos_unidade on public.ticket_motivos (unidade);
create index if not exists idx_motivos_uso on public.ticket_motivos (uso_plataforma);