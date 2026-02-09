-- Permitir novo motivo
alter table public.tickets
  drop constraint if exists tickets_motivo_chk;

alter table public.tickets
  add constraint tickets_motivo_chk check (
    motivo in (
      'Problema de cadastro',
      'Informações incorretas na plataforma',
      'Dificuldade de utilizar a plataforma',
      'Alteração de Perfil',
      'Problema em área e atuação',
      'Outro'
    )
  );

-- Permitir novos valores de uso_plataforma
alter table public.clients
  drop constraint if exists clients_uso_plataforma_chk;

alter table public.clients
  add constraint clients_uso_plataforma_chk check (
    uso_plataforma is null or uso_plataforma in ('Mobile', 'Web', 'Ambos', 'Não informado')
  );
