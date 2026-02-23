"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  MOTIVOS_OPTIONS,
  MOTIVO_STATUS_OPTIONS,
  PRIORIDADES_OPTIONS,
  type MotivoOption,
  type MotivoStatusOption,
  type PrioridadeOption,
} from "@/app/tickets/constants";
import { addMotivoSchema, updateMotivoStatusSchema, formDataToRecord } from "@/lib/validation/schemas";

function normalizeText(value: string) {
  return value.trim();
}

function normalizeMotivo(value: string): MotivoOption | null {
  return MOTIVOS_OPTIONS.includes(value as MotivoOption) ? (value as MotivoOption) : null;
}

function normalizeStatus(value: string): MotivoStatusOption | null {
  return MOTIVO_STATUS_OPTIONS.includes(value as MotivoStatusOption)
    ? (value as MotivoStatusOption)
    : null;
}

export async function createTicketContainerAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dataAtendimento = normalizeText(String(formData.get("data_atendimento") || ""));
  const retroativo = String(formData.get("retroativo") || "") === "true";
  const retroativoMotivo = normalizeText(String(formData.get("retroativo_motivo") || ""));

  if (retroativo && !retroativoMotivo) {
    throw new Error("RETROATIVO_MOTIVO");
  }

  const profissionalNome =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Profissional";

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      profissional_id: user.id,
      profissional_nome: profissionalNome,
      prioridade: null,
      data_atendimento: dataAtendimento || null,
      retroativo,
      retroativo_motivo: retroativo ? retroativoMotivo : null,
      motivo: null,
      client_id: null,
      unidade: null,
      uso_plataforma: null,
      status: "ABERTO",
    })
    .select("id")
    .maybeSingle();

  if (error || !data?.id) {
    console.error("TICKET_CREATE_FAILED", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    redirect("/tickets?error=ticket_create_failed");
  }

  revalidatePath("/tickets");
  redirect(`/tickets/${data.id}`);
}

export async function addMotivoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Zod validation gate ──────────────────────────────
  const raw = formDataToRecord(formData);
  const zodResult = addMotivoSchema.safeParse(raw);
  if (!zodResult.success) {
    throw new Error(zodResult.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const ticketIdInput = Number(formData.get("ticket_id"));
  const clientId = Number(formData.get("client_id"));
  const unidade = normalizeText(String(formData.get("unidade") || ""));
  const usoPlataforma = normalizeText(String(formData.get("uso_plataforma") || ""));
  const motivo = normalizeMotivo(String(formData.get("motivo") || ""));
  const prioridadeRaw = String(formData.get("prioridade") || "Baixa");
  const prioridade = (prioridadeRaw === "Média" ? "Media" : prioridadeRaw) as PrioridadeOption;
  const motivoOutro = normalizeText(String(formData.get("motivo_outro_descricao") || ""));

  if (!motivo) throw new Error("MOTIVO_INVALIDO");
  if (!PRIORIDADES_OPTIONS.includes(prioridade)) throw new Error("PRIORIDADE_INVALIDA");
  if (motivo === "Outro" && !motivoOutro) throw new Error("MOTIVO_OUTRO_REQUIRED");
  if (!clientId) throw new Error("CLIENT_REQUIRED");
  if (unidade && !unidade.trim()) throw new Error("UNIDADE_INVALIDA");

  const profissionalNome =
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Profissional";

  const { data, error } = await supabase.rpc("add_motivo_for_client", {
    p_ticket_id: ticketIdInput || null,
    p_client_id: clientId,
    p_unidade: unidade || null,
    p_uso_plataforma: usoPlataforma || null,
    p_motivo: motivo,
    p_motivo_outro: motivo === "Outro" ? motivoOutro : null,
    p_prioridade: prioridade,
    p_profissional_id: user.id,
    p_profissional_nome: profissionalNome,
  });

  if (error || !data || !data[0]?.ticket_id) {
    console.error("MOTIVO_CREATE_FAILED", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error("MOTIVO_CREATE_FAILED");
  }

  const ticketId = Number(data[0]?.ticket_id);

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function updateMotivoStatusAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ── Zod validation gate ──────────────────────────────
  const raw = formDataToRecord(formData);
  const zodResult = updateMotivoStatusSchema.safeParse(raw);
  if (!zodResult.success) {
    throw new Error(zodResult.error.issues[0]?.message ?? "Dados inválidos.");
  }

  const motivoId = Number(formData.get("motivo_id"));
  const status = normalizeStatus(String(formData.get("status") || ""));
  const ticketId = Number(formData.get("ticket_id"));

  if (!motivoId || !status) throw new Error("STATUS_INVALIDO");

  // Note: updated_at is now handled by the DB trigger (set_updated_at)
  const { error } = await supabase
    .from("ticket_motivos")
    .update({ status })
    .eq("id", motivoId);

  if (error) throw new Error("STATUS_UPDATE_FAILED");

  revalidatePath(`/tickets/${ticketId || ""}`);
  revalidatePath("/tickets");
}

export async function migrateLegacyTicketToMotivoAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ticketId = Number(formData.get("ticket_id"));
  if (!ticketId) throw new Error("TICKET_REQUIRED");

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(
      "id, client_id, unidade, uso_plataforma, motivo, motivo_outro_descricao, data_atendimento, prioridade"
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  const status: MotivoStatusOption = ticket.data_atendimento ? "RESOLVIDO" : "ABERTO";

  const motivoValue = (ticket.motivo as string | null) ?? "Outro";
  const motivoOutroValue =
    motivoValue === "Outro"
      ? (ticket.motivo_outro_descricao as string | null) ?? "Migrado do ticket legado"
      : ticket.motivo_outro_descricao;

  const { error: insertError } = await supabase.from("ticket_motivos").insert({
    ticket_id: ticket.id,
    client_id: ticket.client_id ?? null,
    unidade: ticket.unidade ?? null,
    uso_plataforma: ticket.uso_plataforma ?? null,
    motivo: motivoValue,
    motivo_outro_descricao: motivoValue === "Outro" ? motivoOutroValue : null,
    prioridade: (ticket.prioridade as PrioridadeOption | null) ?? "Baixa",
    status,
  });

  if (insertError) {
    console.error("MIGRATION_FAILED", {
      code: insertError.code,
      message: insertError.message,
      details: insertError.details,
      hint: insertError.hint,
    });
    redirect(`/tickets/${ticketId}?error=migration_failed`);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

