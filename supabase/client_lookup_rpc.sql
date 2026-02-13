create or replace function public.find_client_by_cpf(cpf_param text)
returns table (
  id bigint,
  nome text,
  cidade text,
  estado_uf text,
  uso_plataforma text,
  area_atuacao text,
  unidade text,
  multi_unidade boolean
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.nome,
    c.cidade,
    c.estado_uf,
    c.uso_plataforma,
    c.area_atuacao,
    c.unidade,
    c.multi_unidade
  from clients c
  where c.cpf = regexp_replace(cpf_param, '\\D', '', 'g')
  limit 1;
$$;

revoke all on function public.find_client_by_cpf(text) from public;
grant execute on function public.find_client_by_cpf(text) to authenticated;
