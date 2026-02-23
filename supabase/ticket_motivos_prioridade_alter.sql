-- Adiciona prioridade por motivo e relaxa prioridade do ticket container

alter table public.tickets
  alter column prioridade drop not null;

alter table public.tickets
  drop constraint if exists tickets_prioridade_chk;

alter table public.tickets
  add constraint tickets_prioridade_chk check (
    prioridade is null or prioridade in ('Baixa', 'Media', 'Alta')
  );

alter table public.ticket_motivos
  add column if not exists prioridade text not null default 'Baixa';

alter table public.ticket_motivos
  drop constraint if exists ticket_motivos_prioridade_chk;

alter table public.ticket_motivos
  add constraint ticket_motivos_prioridade_chk check (
    prioridade in ('Baixa', 'Media', 'Alta')
  );

