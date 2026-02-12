-- Permitir novos motivos
alter table public.tickets
  drop constraint if exists tickets_motivo_chk;

alter table public.tickets
  add constraint tickets_motivo_chk check (
    motivo in (
      'Alteração de Perfil',
      'Apresentação',
      'Atualização de dados cadastrais',
      'Auxílio em capacitações',
      'Cadastro não localizado',
      'Criação de documentos',
      'Dados divergentes',
      'Dúvida sobre uso do sistema',
      'Erro ao salvar informações',
      'Erro no sistema',
      'Eventos (auxílio)',
      'Funcionalidade indisponível',
      'Kanban/Power BI',
      'Problema de acesso',
      'Problema de cadastro',
      'Problemas com conexões e impressoras',
      'Recuperação de senha',
      'Sistema lento ou instável',
      'Solicitação de Cadastro',
      'Solicitação de informação',
      'Suporte remoto',
      'Suporte técnico',
      'Treinamento',
      'Workshop',
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
