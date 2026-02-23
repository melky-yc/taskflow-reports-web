-- FIX: Recriar function add_motivo_for_client com:
--   1. Delimitadores $$ corretos
--   2. SECURITY DEFINER (para funcionar com RLS)
--   3. Parâmetros obrigatórios antes de opcionais
--
-- Execute este script no SQL Editor do Supabase.

create or replace function public.add_motivo_for_client(
  p_client_id bigint,
  p_motivo text,
  p_profissional_id uuid,
  p_profissional_nome text,
  p_ticket_id bigint default null,
  p_unidade text default null,
  p_uso_plataforma text default null,
  p_motivo_outro text default null,
  p_prioridade text default 'Baixa'
)
returns table(ticket_id bigint, motivo_id bigint)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

-- Garantir permissões
revoke all on function public.add_motivo_for_client(bigint, text, uuid, text, bigint, text, text, text, text) from public;
grant execute on function public.add_motivo_for_client(bigint, text, uuid, text, bigint, text, text, text, text) to authenticated;
