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
import { normalizeUnidadeInput } from "@/utils/unidade";
import { createTicketSchema, updateTicketSchema, formDataToRecord } from "@/lib/validation/schemas";

type ClientTicketContext = {
  multiUnidade: boolean;
  clientDefaultUnidade: string | null;
};

type ResolvedUnidade = {
  ticketUnidade: string;
  clientDefaultUnidade: string | null;
};

async function ensureClientEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  clientId: number,
  rawEmail?: string | null
) {
  const email = normalizeEmail(rawEmail ?? "");
  if (!email) {
    return;
  }
  if (!isValidEmail(email)) {
    redirectWithTicketError("email");
  }

  const { data: existingEmail, error: existingError } = await supabase
    .from("client_emails")
    .select("client_id")
    .eq("email_norm", email)
    .maybeSingle();

  if (existingError) {
    redirectWithTicketError("email");
  }

  if (existingEmail?.client_id && existingEmail.client_id !== clientId) {
    redirectWithTicketError("email_conflict");
  }

  const { data: alreadyLinked } = await supabase
    .from("client_emails")
    .select("id")
    .eq("client_id", clientId)
    .eq("email_norm", email)
    .maybeSingle();

  if (alreadyLinked?.id) {
    return;
  }

  const { count } = await supabase
    .from("client_emails")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  const isPrimary = !count || count === 0;

  const { error: insertError } = await supabase.from("client_emails").insert({
    client_id: clientId,
    email,
    is_primary: isPrimary,
  });

  if (insertError) {
    redirectWithTicketError("email");
  }
}

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

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getProfissionalNome(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
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
    AREA_ATUACAO_OPTIONS.includes(
      input.areaAtuacao as (typeof AREA_ATUACAO_OPTIONS)[number]
    )
  );
}

function resolveTicketUnidade(
  ticketInputUnidade: string | null,
  context: ClientTicketContext
): ResolvedUnidade {
  if (context.multiUnidade) {
    if (!ticketInputUnidade) {
      redirectWithTicketError("unidade_multi");
    }
    return {
      ticketUnidade: ticketInputUnidade,
      clientDefaultUnidade: context.clientDefaultUnidade,
    };
  }

  if (ticketInputUnidade) {
    return {
      ticketUnidade: ticketInputUnidade,
      clientDefaultUnidade: ticketInputUnidade,
    };
  }

  if (context.clientDefaultUnidade) {
    return {
      ticketUnidade: context.clientDefaultUnidade,
      clientDefaultUnidade: context.clientDefaultUnidade,
    };
  }

  redirectWithTicketError("unidade_padrao");
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

  // ── Zod validation gate ──────────────────────────────
  const raw = formDataToRecord(formData);
  const zodResult = createTicketSchema.safeParse(raw);
  if (!zodResult.success) {
    const firstError = zodResult.error.issues[0];
    // Map Zod paths to existing error codes where possible
    const pathToCode: Record<string, TicketErrorCode> = {
      cliente_cpf: "cpf",
      cliente_estado: "estado",
      cliente_nome: "campos",
      motivo: "campos",
      prioridade: "campos",
      cliente_cidade: "campos",
      area_atuacao: "campos",
      motivo_outro_descricao: "motivo",
    };
    const code = pathToCode[firstError?.path?.[0] as string] ?? "campos";
    redirectWithTicketError(code);
  }

  const motivo = normalizeMotivo(String(formData.get("motivo") || ""));
  const motivoOutro = normalizeText(
    String(formData.get("motivo_outro_descricao") || "")
  );
  const prioridade = normalizePrioridade(
    String(formData.get("prioridade") || "")
  );
  const dataAtendimento = normalizeText(
    String(formData.get("data_atendimento") || "")
  );
  const retroativoMotivo = normalizeText(
    String(formData.get("retroativo_motivo") || "")
  );

  const nome = normalizeText(String(formData.get("cliente_nome") || ""));
  const cpf = onlyDigits(String(formData.get("cliente_cpf") || ""));
  const emailInput = normalizeEmail(String(formData.get("cliente_email") || ""));
  const cidade = normalizeText(String(formData.get("cliente_cidade") || ""));
  const estadoUf = normalizeText(
    String(formData.get("cliente_estado") || "")
  ).toUpperCase();
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
  const ticketUnidadeInput = normalizeUnidadeInput(
    String(
      formData.get("ticket_unidade") ||
      formData.get("cliente_unidade") ||
      ""
    )
  );
  const clientIdFromForm = Number(formData.get("client_id") || 0);

  if (
    !isRequiredTicketDataValid({
      motivo,
      prioridade,
      nome,
      cpf,
      cidade,
      estadoUf,
      areaAtuacao,
    })
  ) {
    redirectWithTicketError("campos");
  }

  if (cpf.length !== 11) {
    redirectWithTicketError("cpf");
  }

  if (emailInput && !isValidEmail(emailInput)) {
    redirectWithTicketError("email");
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
  let clientContext: ClientTicketContext = {
    multiUnidade: false,
    clientDefaultUnidade: null,
  };

  if (clientIdFromForm) {
    const { data: clientById, error: clientByIdError } = await supabase
      .from("clients")
      .select("id, cpf, unidade, multi_unidade")
      .eq("id", clientIdFromForm)
      .maybeSingle();

    if (!clientByIdError && clientById?.id && clientById.cpf === cpf) {
      clientId = clientById.id;
      clientContext = {
        multiUnidade: Boolean(clientById.multi_unidade),
        clientDefaultUnidade: normalizeUnidadeInput(clientById.unidade),
      };
    }
  }

  if (!clientId) {
    const { data: existingClient, error: existingError } = await supabase
      .from("clients")
      .select("id, unidade, multi_unidade")
      .eq("cpf", cpf)
      .maybeSingle();

    if (existingError) {
      redirectWithTicketError("cliente");
    }

    if (existingClient?.id) {
      clientId = existingClient.id;
      clientContext = {
        multiUnidade: Boolean(existingClient.multi_unidade),
        clientDefaultUnidade: normalizeUnidadeInput(existingClient.unidade),
      };
    }
  }

  const resolvedUnidade = resolveTicketUnidade(ticketUnidadeInput, clientContext);

  if (clientId) {
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        nome,
        cidade,
        estado_uf: estadoUf,
        uso_plataforma: usoPlataforma || null,
        area_atuacao: areaAtuacao,
        unidade: clientContext.multiUnidade
          ? clientContext.clientDefaultUnidade ?? resolvedUnidade.ticketUnidade
          : resolvedUnidade.clientDefaultUnidade,
      })
      .eq("id", clientId);

    if (updateError) {
      redirectWithTicketError("cliente");
    }

    await ensureClientEmail(supabase, clientId, emailInput);
  } else {
    const { data: insertedClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        cpf,
        nome,
        cidade,
        estado_uf: estadoUf,
        uso_plataforma: usoPlataforma || null,
        area_atuacao: areaAtuacao,
        multi_unidade: false,
        unidade: resolvedUnidade.clientDefaultUnidade,
      })
      .select("id")
      .single();

    if (insertError || !insertedClient) {
      redirectWithTicketError("cliente");
    }

    const newClientId = insertedClient.id as number;
    clientId = newClientId;
    await ensureClientEmail(supabase, newClientId, emailInput);
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
    unidade: resolvedUnidade.ticketUnidade,
  });

  if (ticketError) {
    logSupabaseError("ticket_insert_error", ticketError);
    redirectWithTicketError("ticket");
  }

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
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
  const prioridade = normalizePrioridade(
    String(formData.get("prioridade") || "")
  );
  const dataAtendimento = normalizeText(
    String(formData.get("data_atendimento") || "")
  );
  const retroativoMotivo = normalizeText(
    String(formData.get("retroativo_motivo") || "")
  );

  const nome = normalizeText(String(formData.get("cliente_nome") || ""));
  const cpf = onlyDigits(String(formData.get("cliente_cpf") || ""));
  const emailInput = normalizeEmail(String(formData.get("cliente_email") || ""));
  const cidade = normalizeText(String(formData.get("cliente_cidade") || ""));
  const estadoUf = normalizeText(
    String(formData.get("cliente_estado") || "")
  ).toUpperCase();
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
  const ticketUnidadeInput = normalizeUnidadeInput(
    String(
      formData.get("ticket_unidade") ||
      formData.get("cliente_unidade") ||
      ""
    )
  );

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
      areaAtuacao,
    })
  ) {
    redirectWithTicketError("campos");
  }

  if (cpf.length !== 11) {
    redirectWithTicketError("cpf");
  }

  if (emailInput && !isValidEmail(emailInput)) {
    redirectWithTicketError("email");
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

  const { data: currentClient, error: currentClientError } = await supabase
    .from("clients")
    .select("id, cpf, unidade, multi_unidade")
    .eq("id", clientId)
    .maybeSingle();

  if (currentClientError || !currentClient || currentClient.cpf !== cpf) {
    redirectWithTicketError("editar");
  }

  const resolvedUnidade = resolveTicketUnidade(ticketUnidadeInput, {
    multiUnidade: Boolean(currentClient.multi_unidade),
    clientDefaultUnidade: normalizeUnidadeInput(currentClient.unidade),
  });

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      nome,
      cidade,
      estado_uf: estadoUf,
      uso_plataforma: usoPlataforma || null,
      area_atuacao: areaAtuacao,
      unidade: currentClient.multi_unidade
        ? normalizeUnidadeInput(currentClient.unidade) ??
        resolvedUnidade.ticketUnidade
        : resolvedUnidade.clientDefaultUnidade,
    })
    .eq("id", clientId);

  if (clientError) {
    redirectWithTicketError("cliente");
  }

  await ensureClientEmail(supabase, clientId, emailInput);

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
      unidade: resolvedUnidade.ticketUnidade,
    })
    .eq("id", ticketId);

  if (ticketError) {
    logSupabaseError("ticket_update_error", ticketError);
    redirectWithTicketError("ticket");
  }

  revalidatePath("/tickets");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  redirect("/tickets?status=updated");
}
