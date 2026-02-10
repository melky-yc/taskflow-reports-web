export type TicketClient = {
  id: number;
  created_at: string;
  data_atendimento: string | null;
  motivo: string;
  motivo_outro_descricao: string | null;
  prioridade: string;
  profissional_nome: string;
  retroativo_motivo: string | null;
  uso_plataforma: string | null;
  client_id: number;
  client: {
    id: number;
    nome: string;
    cpf: string;
    cidade: string;
    estado_uf: string;
    uso_plataforma: string | null;
    area_atuacao: string | null;
    unidade: string;
  };
};
