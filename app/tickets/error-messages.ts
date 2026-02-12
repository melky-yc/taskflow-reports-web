export const TICKET_ERROR_MESSAGES = {
  campos: "Preencha todos os campos obrigatorios.",
  cpf: "CPF deve conter 11 digitos.",
  estado: "UF deve conter 2 letras.",
  motivo: "Descreva o motivo quando selecionar Outro.",
  retroativo: "Informe o motivo do retroativo.",
  cliente: "Nao foi possivel salvar o cliente.",
  ticket: "Nao foi possivel salvar o chamado.",
  editar: "Nao foi possivel editar o chamado.",
} as const;

export type TicketErrorCode = keyof typeof TICKET_ERROR_MESSAGES;

export function getTicketErrorMessage(code?: string) {
  if (!code) {
    return "";
  }
  return TICKET_ERROR_MESSAGES[code as TicketErrorCode] ?? "";
}
