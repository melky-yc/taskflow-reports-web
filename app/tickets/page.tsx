import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";
import TicketsClient from "@/app/tickets/TicketsClient";
import type { TicketClient } from "@/app/tickets/types";
import { MOTIVOS_OPTIONS, type MotivoOption } from "@/app/tickets/constants";
import { normalizeUnidadeInput } from "@/utils/unidade";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  period?: string;
  motivo?: string;
  page?: string;
  status?: string;
  error?: string;
}>;

function getProfissionalNome(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata ?? {};
  return (
    (metadata.name as string | undefined) ||
    (metadata.full_name as string | undefined) ||
    user.email ||
    "Usuario"
  );
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = searchParams ? await searchParams : undefined;
  const periodParam = params?.period ?? "7";
  const motivoParam = params?.motivo ?? "all";
  const pageParam = params?.page ?? "1";
  const status = params?.status ?? "";
  const error = params?.error ?? "";

  const period = ["7", "30", "90"].includes(periodParam) ? periodParam : "7";
  const motivo = MOTIVOS_OPTIONS.includes(motivoParam as MotivoOption)
    ? motivoParam
    : "all";
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - Number(period));

  let query = supabase
    .from("tickets")
    .select(
      "id, created_at, data_atendimento, motivo, motivo_outro_descricao, prioridade, uso_plataforma, profissional_nome, retroativo_motivo, client_id, unidade, clients(id, nome, cpf, cidade, estado_uf, uso_plataforma, area_atuacao, unidade, multi_unidade)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .gte("created_at", startDate.toISOString())
    .range(from, to);

  if (motivo !== "all") {
    query = query.eq("motivo", motivo);
  }

  const { data, count } = await query;

  const tickets: TicketClient[] = (data ?? []).map((ticket) => {
    const clientData = Array.isArray(ticket.clients)
      ? ticket.clients[0]
      : ticket.clients;
    return {
      id: ticket.id,
      created_at: ticket.created_at,
      data_atendimento: ticket.data_atendimento,
      motivo: ticket.motivo,
      motivo_outro_descricao: ticket.motivo_outro_descricao,
      prioridade: ticket.prioridade,
      profissional_nome: ticket.profissional_nome,
      retroativo_motivo: ticket.retroativo_motivo,
      uso_plataforma: ticket.uso_plataforma ?? null,
      client_id: ticket.client_id,
      unidade: normalizeUnidadeInput(ticket.unidade ?? null),
      client: {
        id: clientData?.id ?? ticket.client_id,
        nome: clientData?.nome ?? "",
        cpf: clientData?.cpf ?? "",
        cidade: clientData?.cidade ?? "",
        estado_uf: clientData?.estado_uf ?? "",
        uso_plataforma: clientData?.uso_plataforma ?? null,
        area_atuacao: clientData?.area_atuacao ?? null,
        unidade: normalizeUnidadeInput(clientData?.unidade ?? null),
        multi_unidade: Boolean(clientData?.multi_unidade),
      },
    };
  });

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const baseParams = new URLSearchParams();
  baseParams.set("period", period);
  if (motivo !== "all") {
    baseParams.set("motivo", motivo);
  }

  const prevParams = new URLSearchParams(baseParams);
  prevParams.set("page", String(Math.max(1, page - 1)));

  const nextParams = new URLSearchParams(baseParams);
  nextParams.set("page", String(Math.min(totalPages, page + 1)));

  return (
    <AppShell active="tickets" breadcrumb="Tickets">
      <TicketsClient
        currentUserId={user.id}
        currentUserName={getProfissionalNome(user)}
        tickets={tickets}
        filters={{ period, motivo }}
        pagination={{
          page,
          totalPages,
          prevHref: page > 1 ? `/tickets?${prevParams.toString()}` : undefined,
          nextHref:
            page < totalPages ? `/tickets?${nextParams.toString()}` : undefined,
        }}
        status={status}
        error={error}
      />
    </AppShell>
  );
}
