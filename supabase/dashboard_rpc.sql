create or replace function public.dashboard_metrics(filters jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_period text := coalesce(filters->>'period', '7');
  v_days int := 7;
  v_start date;
  v_end date;
  v_motivo text := nullif(filters->>'motivo', '');
  v_prioridade text := nullif(filters->>'prioridade', '');
  v_uso text := nullif(filters->>'uso_plataforma', '');
  v_uf text := nullif(filters->>'uf', '');
  v_cidade text := nullif(filters->>'cidade', '');
  v_total int := 0;
  v_retro int := 0;
  v_today int := 0;
  v_top_motivo text := '';
begin
  if v_motivo = 'all' then
    v_motivo := null;
  end if;
  if v_prioridade = 'all' then
    v_prioridade := null;
  end if;
  if v_uso = 'all' then
    v_uso := null;
  end if;

  if v_period = 'custom' then
    v_start := nullif(filters->>'start_date', '')::date;
    v_end := nullif(filters->>'end_date', '')::date;
  else
    if v_period ~ '^\d+$' then
      v_days := v_period::int;
    end if;
    v_end := current_date;
    v_start := current_date - (v_days - 1);
  end if;

  if v_start is null or v_end is null then
    v_end := current_date;
    v_start := current_date - 6;
  end if;

  if v_start > v_end then
    v_start := v_end;
  end if;

  with base as (
    select
      t.id,
      t.created_at,
      t.data_atendimento,
      t.motivo,
      t.prioridade,
      t.retroativo,
      c.cidade,
      c.estado_uf,
      c.uso_plataforma,
      c.unidade,
      coalesce(t.data_atendimento, t.created_at::date) as base_date
    from tickets t
    join clients c on c.id = t.client_id
    where coalesce(t.data_atendimento, t.created_at::date) between v_start and v_end
      and (v_motivo is null or t.motivo = v_motivo)
      and (v_prioridade is null or t.prioridade = v_prioridade)
      and (v_uso is null or c.uso_plataforma = v_uso)
      and (v_uf is null or c.estado_uf = v_uf)
      and (v_cidade is null or c.cidade = v_cidade)
  )
  select
    count(*),
    count(*) filter (where retroativo),
    count(*) filter (where base_date = current_date),
    (select motivo from base group by motivo order by count(*) desc, motivo asc limit 1)
  into v_total, v_retro, v_today, v_top_motivo
  from base;

  return jsonb_build_object(
    'totals', jsonb_build_object(
      'total_count', coalesce(v_total, 0),
      'retro_percent', case when coalesce(v_total, 0) = 0
        then 0
        else round((v_retro::numeric / v_total) * 100, 1)
      end,
      'today_count', coalesce(v_today, 0),
      'top_motivo', coalesce(v_top_motivo, '')
    ),
    'timeseries', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('date', base_date, 'count', count(*)) as item
          from base
          group by base_date
          order by base_date
        ) s
      ),
      '[]'::jsonb
    ),
    'by_priority', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('prioridade', prioridade, 'count', count(*)) as item
          from base
          group by prioridade
          order by count(*) desc, prioridade asc
        ) s
      ),
      '[]'::jsonb
    ),
    'by_motivo', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('motivo', motivo, 'count', count(*)) as item
          from base
          group by motivo
          order by count(*) desc, motivo asc
        ) s
      ),
      '[]'::jsonb
    ),
    'by_uso_plataforma', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('uso_plataforma', uso_plataforma, 'count', count(*)) as item
          from base
          group by uso_plataforma
          order by count(*) desc, uso_plataforma asc
        ) s
      ),
      '[]'::jsonb
    ),
    'top_unidades', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('unidade', unidade, 'count', count(*)) as item
          from base
          group by unidade
          order by count(*) desc, unidade asc
          limit 5
        ) s
      ),
      '[]'::jsonb
    ),
    'top_cidades', coalesce(
      (
        select jsonb_agg(item) from (
          select jsonb_build_object('cidade', cidade, 'count', count(*)) as item
          from base
          group by cidade
          order by count(*) desc, cidade asc
          limit 5
        ) s
      ),
      '[]'::jsonb
    )
  );
end;
$$;

revoke all on function public.dashboard_metrics(jsonb) from public;
grant execute on function public.dashboard_metrics(jsonb) to authenticated;
