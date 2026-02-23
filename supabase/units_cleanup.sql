-- Normalização de valores de unidade sem nome ou lixo

with normalized as (
  select
    id,
    regexp_replace(
      translate(upper(btrim(unit_name)), 'ÁÂÃÀÄÉÊÈËÍÌÎÏÓÔÕÒÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC'),
      '[^A-Z0-9]+',
      ' ',
      'g'
    ) as normalized_value,
    btrim(unit_name) as trimmed_value
  from public.units
)
update public.units u
set
  unit_name = null,
  name_status = 'NAO_INFORMADO'
from normalized n
where u.id = n.id
  and (
    n.trimmed_value is null
    or n.trimmed_value = ''
    or n.trimmed_value = '-'
    or n.normalized_value in ('S N', 'SN', 'NA', 'N A', 'N A O INFORMADO', 'NAO INFORMADO', 'NAO INFORMADA')
  );

update public.units
set name_status = 'INFORMADO'
where name_status is null
  and unit_name is not null;
