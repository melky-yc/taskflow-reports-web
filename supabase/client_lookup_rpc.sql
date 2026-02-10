create or replace function public.find_client_by_cpf(cpf_param text)
returns table (
  id bigint,
  nome text,
  cidade text,
  uso_plataforma text,
  area_atuacao text,
  unidade text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.nome,
    c.cidade,
    c.uso_plataforma,
    c.area_atuacao,
    c.unidade
  from clients c
  where c.cpf = regexp_replace(cpf_param, '\\D', '', 'g')
  limit 1;
$$;

revoke all on function public.find_client_by_cpf(text) from public;
grant execute on function public.find_client_by_cpf(text) to authenticated;
