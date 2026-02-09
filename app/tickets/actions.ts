"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const MOTIVOS = [
  "Problema de cadastro",
  "Informações incorretas na plataforma",
  "Dificuldade de utilizar a plataforma",
  "Alteração de Perfil",
  "Problema em área e atuação",
  "Outro",
];

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
    String(formData.get("cliente_uso_plataforma") || "")
  );
  const unidade = normalizeText(String(formData.get("cliente_unidade") || ""));

  if (!motivo || !MOTIVOS.includes(motivo) || !prioridade || !nome || !cpf || !cidade || !estadoUf || !unidade) {
    redirect("/tickets?error=campos");
  }

  if (cpf.length !== 11) {
    redirect("/tickets?error=cpf");
  }

  if (estadoUf.length !== 2) {
    redirect("/tickets?error=estado");
  }

  if (motivo === "Outro" && !motivoOutro) {
    redirect("/tickets?error=motivo");
  }

  const retroativo = isRetroativo(dataAtendimento || null);

  if (retroativo && !retroativoMotivo) {
    redirect("/tickets?error=retroativo");
  }

  const { data: existingClient, error: existingError } = await supabase
    .from("clients")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();

  if (existingError) {
    redirect("/tickets?error=cliente");
  }

  let clientId: number | null = null;

  if (existingClient?.id) {
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        nome,
        cidade,
        estado_uf: estadoUf,
        uso_plataforma: usoPlataforma || null,
        unidade,
      })
      .eq("id", existingClient.id);

    if (updateError) {
      redirect("/tickets?error=cliente");
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
        uso_plataforma: usoPlataforma || null,
        unidade,
      })
      .select("id")
      .single();

    if (insertError || !insertedClient) {
      redirect("/tickets?error=cliente");
    }

    clientId = insertedClient.id;
  }

  const { error: ticketError } = await supabase.from("tickets").insert({
    profissional_id: user.id,
    profissional_nome: getProfissionalNome(user),
    motivo,
    motivo_outro_descricao: motivo === "Outro" ? motivoOutro : null,
    prioridade,
    data_atendimento: dataAtendimento || null,
    retroativo,
    retroativo_motivo: retroativo ? retroativoMotivo : null,
    client_id: clientId,
  });

  if (ticketError) {
    console.error("ticket_insert_error", ticketError);
    redirect("/tickets?error=ticket");
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
    String(formData.get("cliente_uso_plataforma") || "")
  );
  const unidade = normalizeText(String(formData.get("cliente_unidade") || ""));

  if (!ticketId || !clientId) {
    redirect("/tickets?error=editar");
  }

  if (!motivo || !MOTIVOS.includes(motivo) || !prioridade || !nome || !cpf || !cidade || !estadoUf || !unidade) {
    redirect("/tickets?error=campos");
  }

  if (cpf.length !== 11) {
    redirect("/tickets?error=cpf");
  }

  if (estadoUf.length !== 2) {
    redirect("/tickets?error=estado");
  }

  if (motivo === "Outro" && !motivoOutro) {
    redirect("/tickets?error=motivo");
  }

  const retroativo = isRetroativo(dataAtendimento || null);

  if (retroativo && !retroativoMotivo) {
    redirect("/tickets?error=retroativo");
  }

  const { error: clientError } = await supabase
    .from("clients")
    .update({
      nome,
      cidade,
      estado_uf: estadoUf,
      uso_plataforma: usoPlataforma || null,
      unidade,
    })
    .eq("id", clientId);

  if (clientError) {
    redirect("/tickets?error=cliente");
  }

  const { error: ticketError } = await supabase
    .from("tickets")
    .update({
      motivo,
      motivo_outro_descricao: motivo === "Outro" ? motivoOutro : null,
      prioridade,
      data_atendimento: dataAtendimento || null,
      retroativo,
      retroativo_motivo: retroativo ? retroativoMotivo : null,
    })
    .eq("id", ticketId);

  if (ticketError) {
    console.error("ticket_update_error", ticketError);
    redirect("/tickets?error=ticket");
  }

  revalidatePath("/tickets");
  redirect("/tickets?status=updated");
}

