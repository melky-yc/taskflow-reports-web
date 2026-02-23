import { notFound, redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import TicketDetailClient from "@/app/tickets/TicketDetailClient";
import type { MotivoStatusOption, MotivoOption, PrioridadeOption, UsoPlataformaOption } from "@/app/tickets/constants";

export type TicketMotivoItem = {
  id: number;
  ticket_id: number;
  client_id: number | null;
  cliente_nome: string;
  cliente_cpf: string;
  cliente_cidade: string;
  cliente_estado: string;
  prioridade: PrioridadeOption;
  unidade: string | null;
  uso_plataforma: UsoPlataformaOption | null;
  motivo: MotivoOption;
  motivo_outro_descricao: string | null;
  status: MotivoStatusOption;
  updated_at: string | null;
};

type TicketMotivoRow = {
  id: number;
  ticket_id: number;
  client_id: number | null;
  unidade: string | null;
  uso_plataforma: string | null;
  prioridade: PrioridadeOption | null;
  motivo: MotivoOption;
  motivo_outro_descricao: string | null;
  status: MotivoStatusOption;
  updated_at: string | null;
  clients?:
    | { id: number; nome: string | null; cpf: string | null; cidade: string | null; estado_uf: string | null }[]
    | { id: number; nome: string | null; cpf: string | null; cidade: string | null; estado_uf: string | null }
    | null;
};

export type TicketDetail = {
  id: number;
  data_atendimento: string | null;
  retroativo: boolean;
  retroativo_motivo: string | null;
  profissional_nome: string;
  created_at: string;
  updated_at: string | null;
};

type Params = Promise<{ id: string }>;

export default async function TicketDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!ticketId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: ticket } = await supabase
    .from("tickets")
    .select(
      "id, created_at, updated_at, prioridade, data_atendimento, retroativo, retroativo_motivo, profissional_nome"
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (!ticket) {
    notFound();
  }

  const { data: motivosData } = await supabase
    .from("ticket_motivos")
    .select(
      "id, ticket_id, client_id, unidade, uso_plataforma, prioridade, motivo, motivo_outro_descricao, status, updated_at, clients(id, nome, cpf, cidade, estado_uf)"
    )
    .eq("ticket_id", ticketId)
    .order("updated_at", { ascending: false });

  const motivos: TicketMotivoItem[] = ((motivosData as TicketMotivoRow[] | null) ?? []).map((m) => {
    const client = Array.isArray(m.clients) ? m.clients[0] : m.clients;
    return {
      id: m.id as number,
      ticket_id: m.ticket_id as number,
      client_id: (m.client_id as number | null) ?? null,
      cliente_nome: client?.nome ?? "",
      cliente_cpf: client?.cpf ?? "",
      cliente_cidade: client?.cidade ?? "",
      cliente_estado: client?.estado_uf ?? "",
      prioridade: (m.prioridade as PrioridadeOption | null) ?? "Baixa",
      unidade: (m.unidade as string | null) ?? null,
      uso_plataforma: (m.uso_plataforma as UsoPlataformaOption | null) ?? null,
      motivo: m.motivo as MotivoOption,
      motivo_outro_descricao: (m.motivo_outro_descricao as string | null) ?? null,
      status: m.status as MotivoStatusOption,
      updated_at: (m.updated_at as string | null) ?? null,
    };
  });

  const detail: TicketDetail = {
    id: ticket.id as number,
    data_atendimento: (ticket.data_atendimento as string | null) ?? null,
    retroativo: Boolean(ticket.retroativo),
    retroativo_motivo: (ticket.retroativo_motivo as string | null) ?? null,
    profissional_nome: (ticket.profissional_nome as string) ?? "",
    created_at: ticket.created_at as string,
    updated_at: (ticket.updated_at as string | null) ?? null,
  };

  const isLegacy = motivos.length === 0;

  return (
    <AppShell active="tickets" breadcrumb={`Ticket #${ticketId}`}>
      <TicketDetailClient ticket={detail} motivos={motivos} isLegacy={isLegacy} />
    </AppShell>
  );
}
