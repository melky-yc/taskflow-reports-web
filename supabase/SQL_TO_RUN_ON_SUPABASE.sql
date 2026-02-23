-- SQL_TO_RUN_ON_SUPABASE.sql
-- Objetivo: suportar 1 ticket ativo por cliente, manter ticket como container,
-- usar ticket_motivos como fato, e corrigir dados legados.

begin;

-- 1) Garantir colunas em tickets (idempotente)
alter table public.tickets
  add column if not exists status text default 'ABERTO',
  add column if not exists updated_at timestamptz;

-- 2) Constraint de status (idempotente)
alter table public.tickets
  drop constraint if exists tickets_status_chk;
alter table public.tickets
  add constraint tickets_status_chk check (
    status in ('ABERTO','EM_ANDAMENTO','AGUARDANDO','RESOLVIDO','CANCELADO')
  );

-- 3) Backfill status / updated_at
update public.tickets
set status = coalesce(status, 'ABERTO'),
    updated_at = coalesce(updated_at, created_at)
where status is null or updated_at is null;

-- 4) Consistência ticket_motivos.client_id (opcional, mas recomendada)
update public.ticket_motivos tm
set client_id = t.client_id
from public.tickets t
where tm.ticket_id = t.id
  and (tm.client_id is distinct from t.client_id);

-- 5) Auditoria de duplicados ativos (somente SELECT)
-- Rode para checar antes do merge:
-- select client_id, count(*) as ativos
-- from public.tickets
-- where status in ('ABERTO','EM_ANDAMENTO')
-- group by client_id
-- having count(*) > 1
-- order by ativos desc, client_id;

-- 6) Merge de tickets ativos duplicados (mantém o mais antigo)
with ranked as (
  select id as ticket_id,
         client_id,
         created_at,
         row_number() over (partition by client_id order by created_at asc) as rn
  from public.tickets
  where status in ('ABERTO','EM_ANDAMENTO')
),
winners as (
  select client_id, ticket_id as winner_ticket_id
  from ranked
  where rn = 1
),
losers as (
  select r.client_id, r.ticket_id as loser_ticket_id, w.winner_ticket_id
  from ranked r
  join winners w using (client_id)
  where r.rn > 1
)
update public.ticket_motivos tm
set ticket_id = l.winner_ticket_id
from losers l
where tm.ticket_id = l.loser_ticket_id;

-- Fecha tickets perdedores
with ranked as (
  select id as ticket_id,
         client_id,
         created_at,
         row_number() over (partition by client_id order by created_at asc) as rn
  from public.tickets
  where status in ('ABERTO','EM_ANDAMENTO')
),
loser_ids as (
  select ticket_id from ranked where rn > 1
)
update public.tickets t
set status = 'CANCELADO',
    updated_at = now()
where t.id in (select ticket_id from loser_ids);

-- 7) Índice único parcial: 1 ticket ativo por cliente (somente client_id não nulo)
create unique index if not exists tickets_client_active_uidx
  on public.tickets (client_id)
  where status = 'ABERTO' and client_id is not null;

commit;

-- Auditorias pós-merge:
-- a) Duplicados ativos devem ser zero
-- select client_id, count(*) as ativos
-- from public.tickets
-- where status = 'ABERTO'
-- group by client_id
-- having count(*) > 1;
--
-- b) Motivos órfãos
-- select count(*) as motivos_orfaos
-- from public.ticket_motivos tm
-- left join public.tickets t on t.id = tm.ticket_id
-- where t.id is null;
--
-- c) Tickets sem client_id
-- select count(*) from public.tickets where client_id is null;


-- Function: add_motivo_for_client (transactional add)
create or replace function public.add_motivo_for_client(
  p_ticket_id bigint default null,
  p_client_id bigint,
  p_unidade text default null,
  p_uso_plataforma text default null,
  p_motivo text,
  p_motivo_outro text default null,
  p_prioridade text default 'Baixa',
  p_profissional_id uuid,
  p_profissional_nome text
)
returns table(ticket_id bigint, motivo_id bigint) language plpgsql as 
declare
  v_ticket_id bigint;
begin
  if p_client_id is null then
    raise exception 'CLIENT_REQUIRED';
  end if;

  -- reutiliza ticket informado se ainda estiver ativo do mesmo cliente
  if p_ticket_id is not null then
    select id
      into v_ticket_id
      from public.tickets
     where id = p_ticket_id
       and client_id = p_client_id
       and status = 'ABERTO'
     limit 1;
  end if;

  if v_ticket_id is null then
    select id
      into v_ticket_id
      from public.tickets
     where client_id = p_client_id
       and status = 'ABERTO'
     order by created_at desc
     limit 1;
  end if;

  if v_ticket_id is null then
    begin
      insert into public.tickets (client_id, status, profissional_id, profissional_nome, created_at, updated_at)
      values (p_client_id, 'ABERTO', p_profissional_id, p_profissional_nome, now(), now())
      returning id into v_ticket_id;
    exception when unique_violation then
      select id
        into v_ticket_id
        from public.tickets
       where client_id = p_client_id
         and status = 'ABERTO'
       order by created_at desc
       limit 1;
    end;
  end if;

  insert into public.ticket_motivos (
    ticket_id,
    client_id,
    unidade,
    uso_plataforma,
    motivo,
    motivo_outro_descricao,
    prioridade,
    status
  )
  values (
    v_ticket_id,
    p_client_id,
    nullif(btrim(coalesce(p_unidade, '')), ''),
    nullif(btrim(coalesce(p_uso_plataforma, '')), ''),
    p_motivo,
    case when p_motivo = 'Outro' then nullif(btrim(coalesce(p_motivo_outro, '')), '') else null end,
    p_prioridade,
    'ABERTO'
  )
  returning id into motivo_id;

  update public.tickets
     set updated_at = now(), status = 'ABERTO'
   where id = v_ticket_id;

  ticket_id := v_ticket_id;
  return next;
end;
;

