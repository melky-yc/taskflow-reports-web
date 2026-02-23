import type { MotivoStatusOption } from "@/app/tickets/constants";

export type TicketStatus =
  | "ABERTO"
  | "EM_ANDAMENTO"
  | "AGUARDANDO"
  | "RESOLVIDO"
  | "CANCELADO"
  | "SEM_ITENS";

export function computeTicketStatus(statuses: MotivoStatusOption[]): TicketStatus {
  if (!statuses || statuses.length === 0) {
    return "ABERTO";
  }
  const set = new Set(statuses);
  if (statuses.every((s) => s === "RESOLVIDO" || s === "CANCELADO")) {
    return "RESOLVIDO";
  }
  if (set.has("EM_ANDAMENTO")) return "EM_ANDAMENTO";
  if (set.has("ABERTO")) return "ABERTO";
  if (set.has("AGUARDANDO")) return "AGUARDANDO";
  return "ABERTO";
}

