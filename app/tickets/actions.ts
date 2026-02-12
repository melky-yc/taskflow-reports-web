"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  AREA_ATUACAO_OPTIONS,
  MOTIVOS_OPTIONS,
  isPrioridadeOption,
  type MotivoOption,
} from "@/app/tickets/constants";
import type { TicketErrorCode } from "@/app/tickets/error-messages";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizePrioridade(value: string) {
  const trimmed = normalizeText(value);
  return trimmed === "Média" ? "Media" : trimmed;
}

function normalizeMotivo(value: string) {
  return normalizeText(value);
}

function getTodayIso() {
  return new Date().toISOString().slice(0, 10);
}

function isRetroativo(dataAtendimento?: string | null) {
  if (!dataAtendimento) {
    return false;
  }
  return dataAtendimento < getTodayIso();
}

function getProfissionalNome(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata ?? {};
  const nome =
    (metadata.name as string | undefined) ||
    (metadata.full_name as string | undefined) ||
    user.email ||
    "Usuario";
  return normalizeText(nome) || "Usuario";
}

type RequiredTicketData = {
  motivo: string;
  prioridade: string;
  nome: string;
  cpf: string;
  cidade: string;
  estadoUf: string;
  unidade: string;
  areaAtuacao: string;
};

function isRequiredTicketDataValid(input: RequiredTicketData) {
  return Boolean(
    input.motivo &&
    MOTIVOS_OPTIONS.includes(input.motivo as MotivoOption) &&
    input.prioridade &&
    isPrioridadeOption(input.prioridade) &&
    input.nome &&
    input.cpf &&
    input.cidade &&
    input.estadoUf &&
    input.unidade &&
    AREA_ATUACAO_OPTIONS.includes(
      input.areaAtuacao as (typeof AREA_ATUACAO_OPTIONS)[number]
    )
  );
}

function redirectWithTicketError(code: TicketErrorCode): never {
  redirect(`/tickets?error=${code}`);
}

function logSupabaseError(
  code: "ticket_insert_error" | "ticket_update_error",
  error: unknown
) {
  const parsed =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : {};
  console.error(code, {
    code: typeof parsed.code === "string" ? parsed.code : "unknown",
    message: typeof parsed.message === "string" ? parsed.message : "unknown",
  });
}

export async function createTicketAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const motivo = normalizeMotivo(String(formData.get("motivo") || ""));
  const motivoOutro = normalizeText(
    String(formData.get("motivo_outro_descricao") || "")
  );
  const prioridade = normalizePrioridade(String(formData.get("prioridade") || ""));
  const dataAtendimento = normalizeText(
    String(formData.get("data_atendimento") || "")
  );
  const retroativoMotivo = normalizeText(
    String(formData.get("retroativo_motivo") || "")
  );

  const nome = normalizeText(String(formData.get("cliente_nome") || ""));
  const cpf = onlyDigits(String(formData.get("cliente_cpf") || ""));
  const cidade = normalizeText(String(formData.get("cliente_cidade") || ""));
  const estadoUf = normalizeText(String(formData.get("cliente_estado") || "")).toUpperCase();
  const usoPlataforma = normalizeText(
    String(
      formData.get("uso_plataforma") ||
        formData.get("cliente_uso_plataforma") ||
        ""
    )
  );
  const areaAtuacao = normalizeText(
    String(formData.get("cliente_area_atuacao") || "")
  );
  const unidade = normalizeText(String(formData.get("cliente_unidade") || ""));
  const clientIdFromForm = Number(formData.get("client_id") || 0);

  if (
    !isRequiredTicketDataValid({
      motivo,
      prioridade,
      nome,
      cpf,
      cidade,
      estadoUf,
      unidade,
      areaAtuacao,
    })
  ) {
    redirectWithTicketError("campos");
  }

  if (cpf.length !== 11) {
    redirectWithTicketError("cpf");
  }

  if (estadoUf.length !== 2) {
    redirectWithTicketError("estado");
  }

  if (motivo === "Outro" && !motivoOutro) {
    redirectWithTicketError("motivo");
  }

  const retroativo = isRetroativo(dataAtendimento || null);

  if (retroativo && !retroativoMotivo) {
    redirectWithTicketError("retroativo");
  }

  let clientId: number | null = null;

  if (clientIdFromForm) {
    const { data: clientById, error: clientByIdError } = await supabase
      .from("clients")
      .select("id, cpf")
      .eq("id", clientIdFromForm)
      .maybeSingle();

    if (!clientByIdError && clientById?.id && clientById.cpf === cpf) {
      clientId = clientById.id;
    }
  }

  if (!clientId) {
    const { data: existingClient, error: existingError } = await supabase
      .from("clients")
      .select("id")
      .eq("cpf", cpf)
      .maybeSingle();

    if (existingError) {
      redirectWithTicketError("cliente");
    }

    if (existingClient?.id) {
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          nome,
          cidade,
          estado_uf: estadoUf,
          area_atuacao: areaAtuacao,
          unidade,
        })
        .eq("id", existingClient.id);

      if (updateError) {
        redirectWithTicketError("cliente");
      }

      clientId = existingClient.id;
    } else {
      const { data: insertedClient, error: insertError } = await supabase
        .from("clients")
        .insert({
          cpf,
          nome,
          cidade,
          estado_uf: estadoUf,
          area_atuacao: areaAtuacao,
          unidade,
        })
        .select("id")
        .single();

      if (insertError || !insertedClient) {
        redirectWithTicketError("cliente");
      }

      clientId = insertedClient.id;
    }
  }

  const { error: ticketError } = await supabase.from("tickets").insert({
    profissional_id: user.id,
    profissional_nome: getProfissionalNome(user),
    motivo,
    motivo_outro_descricao: motivo === "Outro" ? motivoOutro : null,
    prioridade,
    uso_plataforma: usoPlataforma || null,
    data_atendimento: dataAtendimento || null,
    retroativo,
    retroativo_motivo: retroativo ? retroativoMotivo : null,
    client_id: clientId,
  });

  if (ticketError) {
    logSupabaseError("ticket_insert_error", ticketError);
    redirectWithTicketError("ticket");
  }

  revalidatePath("/tickets");
  redirect("/tickets?status=created");
}

export async function updateTicketAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const ticketId = Number(formData.get("ticket_id"));
  const clientId = Number(formData.get("client_id"));

  const motivo = normalizeMotivo(String(formData.get("motivo") || ""));
  const motivoOutro = normalizeText(
    String(formData.get("motivo_outro_descricao") || "")
  );
  const prioridade = normalizePrioridade(String(formData.get("prioridade") || ""));
  const dataAtendimento = normalizeText(
    String(formData.get("data_atendimento") || "")
  );
  const retroativoMotivo = normalizeText(
    String(formData.get("retroativo_motivo") || "")
  );

  const nome = normalizeText(String(formData.get("cliente_nome") || ""));
  const cpf = onlyDigits(String(formData.get("cliente_cpf") || ""));
  const cidade = normalizeText(String(formData.get("cliente_cidade") || ""));
  const estadoUf = normalizeText(String(formData.get("cliente_estado") || "")).toUpperCase();
  const usoPlataforma = normalizeText(
    String(
      formData.get("uso_plataforma") ||
        formData.get("cliente_uso_plataforma") ||
        ""
    )
  );
  const areaAtuacao = normalizeText(
    String(formData.get("cliente_area_atuacao") || "")
  );
  const unidade = normalizeText(String(formData.get("cliente_unidade") || ""));

  if (!ticketId || !clientId) {
    redirectWithTicketError("editar");
  }

  if (
    !isRequiredTicketDataValid({
      motivo,
      prioridade,
      nome,
      cpf,
      cidade,
      estadoUf,
      unidade,
      areaAtuacao,
    })
  ) {
    redirectWithTicketError("campos");
  }

  if (cpf.length !== 11) {
    redirectWithTicketError("cpf");
  }

  if (estadoUf.length !== 2) {
    redirectWithTicketError("estado");
  }

  if (motivo === "Outro" && !motivoOutro) {
    redirectWithTicketError("motivo");
  }

  const retroativo = isRetroativo(dataAtendimento || null);

  if (retroativo && !retroativoMotivo) {
    redirectWithTicketError("retroativo");
  }

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      nome,
      cidade,
      estado_uf: estadoUf,
      area_atuacao: areaAtuacao,
      unidade,
    })
    .eq("id", clientId);

  if (clientError) {
    redirectWithTicketError("cliente");
  }

  const { error: ticketError } = await supabase
    .from("tickets")
    .update({
      motivo,
      motivo_outro_descricao: motivo === "Outro" ? motivoOutro : null,
      prioridade,
      uso_plataforma: usoPlataforma || null,
      data_atendimento: dataAtendimento || null,
      retroativo,
      retroativo_motivo: retroativo ? retroativoMotivo : null,
    })
    .eq("id", ticketId);

  if (ticketError) {
    logSupabaseError("ticket_update_error", ticketError);
    redirectWithTicketError("ticket");
  }

  revalidatePath("/tickets");
  redirect("/tickets?status=updated");
}

