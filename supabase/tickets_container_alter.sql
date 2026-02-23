-- Ajuste para tickets como container (motivo/client_id opcionais)

alter table public.tickets
  alter column motivo drop not null,
  alter column client_id drop not null,
  alter column unidade drop not null,
  alter column uso_plataforma drop not null;

alter table public.tickets
  drop constraint if exists tickets_motivo_chk,
  drop constraint if exists tickets_motivo_outro_chk,
  drop constraint if exists tickets_unidade_not_blank_chk,
  drop constraint if exists tickets_unidade_not_blank_check;

alter table public.tickets
  add constraint tickets_motivo_chk check (
    motivo is null or motivo in (
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
  ),
  add constraint tickets_unidade_not_blank_chk check (unidade is null or btrim(unidade) <> '');

