-- ═══════════════════════════════════════════════════════════
-- Reports v2 — RPC functions
-- Dataset: ticket_motivos (ocorrências) with joins
-- ═══════════════════════════════════════════════════════════

-- ── Indexes for report queries ────────────────────────────
create index if not exists idx_ticket_motivos_created_at
  on public.ticket_motivos (created_at);

create index if not exists idx_tickets_data_atendimento
  on public.tickets (data_atendimento);

create index if not exists idx_tickets_profissional_id
  on public.tickets (profissional_id);

-- ───────────────────────────────────────────────────────────
-- reports_dataset — paginated detail rows
-- ───────────────────────────────────────────────────────────
create or replace function public.reports_dataset(
  p_start_date  date,
  p_end_date    date,
  p_profissional_id uuid    default null,
  p_area_atuacao    text    default null,
  p_status          text    default null,
  p_motivo          text    default null,
  p_page            int     default 1,
  p_page_size       int     default 200
)
returns table (
  motivo_id          bigint,
  motivo_created_at  timestamptz,
  ticket_id          bigint,
  profissional_nome  text,
  unidade            text,
  motivo             text,
  motivo_outro_descricao text,
  prioridade         text,
  status             text,
  uso_plataforma     text,
  cliente_nome       text,
  cpf                text,
  cidade             text,
  estado_uf          text,
  area_atuacao       text,
  retroativo         boolean,
  multi_unidade      boolean,
  email_primario     text,
  data_atendimento   date,
  total_count        bigint
)
language sql
stable
security definer
as $$
  with filtered as (
    select
      tm.id                       as motivo_id,
      tm.created_at               as motivo_created_at,
      tm.ticket_id,
      t.profissional_nome,
      coalesce(tm.unidade, t.unidade) as unidade,
      tm.motivo,
      tm.motivo_outro_descricao,
      tm.prioridade,
      tm.status,
      coalesce(tm.uso_plataforma, t.uso_plataforma) as uso_plataforma,
      c.nome                      as cliente_nome,
      c.cpf,
      c.cidade,
      c.estado_uf,
      c.area_atuacao,
      t.retroativo,
      c.multi_unidade,
      t.data_atendimento,
      count(*) over()             as total_count
    from public.ticket_motivos tm
    join public.tickets          t on t.id = tm.ticket_id
    left join public.clients     c on c.id = tm.client_id
    where
      tm.created_at >= p_start_date::timestamptz
      and tm.created_at < (p_end_date + interval '1 day')::timestamptz
      and (p_profissional_id is null or t.profissional_id = p_profissional_id)
      and (p_area_atuacao    is null or c.area_atuacao     = p_area_atuacao)
      and (p_status          is null or tm.status          = p_status)
      and (p_motivo          is null or tm.motivo          = p_motivo)
    order by tm.created_at desc
    limit  p_page_size
    offset (p_page - 1) * p_page_size
  )
  select
    f.*,
    (
      select ce.email
      from public.client_emails ce
      join public.clients cl on cl.id = ce.client_id
      where cl.cpf = f.cpf
      order by ce.is_primary desc, ce.created_at asc
      limit 1
    ) as email_primario
  from filtered f;
$$;

-- ───────────────────────────────────────────────────────────
-- reports_summary — aggregated stats
-- ───────────────────────────────────────────────────────────
drop function if exists public.reports_summary(date, date, uuid, text, text, text);

create or replace function public.reports_summary(
  p_start_date      date,
  p_end_date        date,
  p_profissional_id uuid  default null,
  p_area_atuacao    text  default null,
  p_status          text  default null,
  p_motivo          text  default null
)
returns jsonb
language plpgsql
stable
security definer
as $$
declare
  v_result jsonb;
begin
  with base as (
    select
      tm.id,
      tm.ticket_id,
      tm.motivo,
      tm.prioridade,
      tm.status,
      coalesce(tm.uso_plataforma, t.uso_plataforma) as uso_plataforma,
      coalesce(tm.unidade, t.unidade) as unidade,
      t.profissional_nome,
      t.retroativo,
      c.area_atuacao
    from public.ticket_motivos tm
    join public.tickets        t on t.id = tm.ticket_id
    left join public.clients   c on c.id = tm.client_id
    where
      tm.created_at >= p_start_date::timestamptz
      and tm.created_at < (p_end_date + interval '1 day')::timestamptz
      and (p_profissional_id is null or t.profissional_id = p_profissional_id)
      and (p_area_atuacao    is null or c.area_atuacao     = p_area_atuacao)
      and (p_status          is null or tm.status          = p_status)
      and (p_motivo          is null or tm.motivo          = p_motivo)
  )
  select jsonb_build_object(
    'total_ocorrencias',     (select count(*) from base),
    'total_tickets_unicos',  (select count(distinct ticket_id) from base),
    'retroativos',           (select count(*) filter (where retroativo) from base),
    'top_motivos',           (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select motivo as label, count(*) as "count"
        from base group by motivo order by "count" desc limit 10
      ) r
    ),
    'top_unidades',          (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select coalesce(unidade, 'Sem unidade') as label, count(*) as "count"
        from base group by unidade order by "count" desc limit 10
      ) r
    ),
    'por_status',            (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select status as label, count(*) as "count"
        from base group by status order by "count" desc
      ) r
    ),
    'por_prioridade',        (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select prioridade as label, count(*) as "count"
        from base group by prioridade order by "count" desc
      ) r
    ),
    'por_uso_plataforma',    (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select coalesce(uso_plataforma, 'Não informado') as label, count(*) as "count"
        from base group by uso_plataforma order by "count" desc
      ) r
    ),
    'ranking_profissionais', (
      select coalesce(jsonb_agg(row_to_json(r)::jsonb), '[]'::jsonb)
      from (
        select profissional_nome as label, count(*) as "count"
        from base group by profissional_nome order by "count" desc limit 10
      ) r
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Force PostgREST to reload the schema cache
notify pgrst, 'reload schema';

