-- Permitir novo motivo
alter table public.tickets
  drop constraint if exists tickets_motivo_chk;

alter table public.tickets
  add constraint tickets_motivo_chk check (
    motivo in (
      'Problema de cadastro',
      'Problema de acesso',
      'Recuperação de senha',
      'Cadastro não localizado',
      'Dados divergentes',
      'Atualização de dados cadastrais',
      'Erro no sistema',
      'Funcionalidade indisponível',
      'Sistema lento ou instável',
      'Erro ao salvar informações',
      'Dúvida sobre uso do sistema',
      'Solicitação de informação',
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
