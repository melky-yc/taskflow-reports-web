import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import TicketsListClient from "@/app/tickets/TicketsListClient";

export type TicketListItem = {
  id: number;
  created_at: string;
  updated_at: string | null;
  motivos_count: number;
  ultimo_motivo: string | null;
  cliente_nome: string | null;
  cliente_inconsistente: boolean;
};

type TicketRow = {
  id: number;
  client_id: number | null;
  created_at: string;
  updated_at: string | null;
  profissional_nome: string | null;
  clients?: { nome?: string | null }[] | { nome?: string | null } | null;
};

type MotivoRow = {
  ticket_id: number;
  motivo: string | null;
  updated_at: string | null;
  created_at: string;
  clients?: { nome?: string | null }[] | { nome?: string | null } | null;
};

type SearchParams = Promise<{
  error?: string;
  cliente?: string;
  unidade?: string;
  uso?: string;
  period?: string;
}>;

export default async function TicketsPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ?? "";
  const filterCliente = params?.cliente?.trim();
  const filterUnidade = params?.unidade?.trim();
  const filterUso = params?.uso?.trim();
  const periodDays = params?.period ? Number(params.period) : null;
  const days = periodDays && [7, 30, 90].includes(periodDays) ? periodDays : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: ticketsData } = await supabase
    .from("tickets")
    .select("id, client_id, created_at, updated_at, profissional_nome, clients(nome)")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  const ticketIds = (ticketsData ?? []).map((t) => t.id as number);
  let motivosMap: Record<
    number,
    { count: number; ultimo_motivo: string | null; ultima_atualizacao: string | null }
  > = {};

  if (ticketIds.length > 0) {
    let motivosQuery = supabase
      .from("ticket_motivos")
      .select("ticket_id, motivo, created_at, updated_at, clients(nome)")
      .in("ticket_id", ticketIds);

    if (days !== null) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      motivosQuery = motivosQuery.gte("created_at", startDate.toISOString());
    }

    motivosQuery = motivosQuery.order("created_at", { ascending: false });

    const { data: motivosData } = await motivosQuery;

    let filtered = ((motivosData as MotivoRow[] | null) ?? []).filter((m) =>
      ticketIds.includes(m.ticket_id as number)
    );

    if (filterCliente) {
      filtered = filtered.filter((m) => {
        const client = Array.isArray(m.clients) ? m.clients[0] : (m as any).clients;
        return client?.nome?.toLowerCase().includes(filterCliente.toLowerCase());
      });
    }
    if (filterUnidade) {
      filtered = filtered.filter((m) => (m as any).unidade?.toLowerCase().includes(filterUnidade.toLowerCase()));
    }
    if (filterUso) {
      filtered = filtered.filter(
        (m) => (m as any).uso_plataforma?.toLowerCase() === filterUso.toLowerCase()
      );
    }
    motivosMap = filtered.reduce((acc, item) => {
      const key = item.ticket_id as number;
      if (!acc[key]) acc[key] = { count: 0, ultimo_motivo: null, ultima_atualizacao: null };
      acc[key].count += 1;
      if (!acc[key].ultimo_motivo) {
        acc[key].ultimo_motivo = item.motivo ?? null;
      }
      acc[key].ultima_atualizacao = (item.updated_at as string | null) ?? acc[key].ultima_atualizacao;
      return acc;
    }, {} as Record<number, { count: number; ultimo_motivo: string | null; ultima_atualizacao: string | null }>);
  }

  const tickets: TicketListItem[] = ((ticketsData as TicketRow[] | null) ?? []).map((t) => {
    const clientEmbedded = Array.isArray(t.clients) ? t.clients[0] : t.clients;
    const info = motivosMap[t.id] ?? { count: 0, ultimo_motivo: null, ultima_atualizacao: null };

    const updated =
      (t.updated_at as string | null) ??
      info.ultima_atualizacao ??
      (t.created_at as string | null) ??
      null;

    return {
      id: t.id as number,
      created_at: t.created_at as string,
      updated_at: updated,
      motivos_count: info.count,
      ultimo_motivo: info.ultimo_motivo ?? null,
      cliente_nome: clientEmbedded?.nome ?? null,
      cliente_inconsistente: !t.client_id,
    };
  });

  return (
    <AppShell active="tickets" breadcrumb="Tickets">
      <TicketsListClient
        tickets={tickets}
        currentUserName={user.email ?? "Usuário"}
        error={error}
      />
    </AppShell>
  );
}
