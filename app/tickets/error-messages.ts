export const TICKET_ERROR_MESSAGES = {
  campos: "Preencha todos os campos obrigatórios.",
  cpf: "CPF deve conter 11 dígitos.",
  estado: "UF deve conter 2 letras.",
  motivo: "Descreva o motivo quando selecionar Outro.",
  retroativo: "Informe o motivo do retroativo.",
  cliente: "Não foi possível salvar o cliente.",
  ticket: "Não foi possível salvar o chamado.",
  editar: "Não foi possível editar o chamado.",
  unidade_multi:
    "Este cliente abre chamados para múltiplas unidades. Selecione a unidade afetada.",
  unidade_padrao:
    "Não foi possível determinar a unidade padrão deste cliente. Informe a unidade afetada.",
} as const;

export type TicketErrorCode = keyof typeof TICKET_ERROR_MESSAGES;

export function getTicketErrorMessage(code?: string) {
  if (!code) {
    return "";
  }
  return TICKET_ERROR_MESSAGES[code as TicketErrorCode] ?? "";
}
