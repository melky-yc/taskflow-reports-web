"use server";

import { createClient } from "@/lib/supabase/server";
import { type Result, success, failure, fromZodError } from "@/lib/validation/result";
import { lookupClientSchema, upsertClientSchema } from "@/lib/validation/schemas";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LookupStatus =
  | "FOUND_COMPLETE"
  | "FOUND_MISSING_EMAIL"
  | "NOT_FOUND"
  | "AMBIGUOUS_NAME";

export type LookupResult = {
  status: LookupStatus;
  client: Record<string, unknown> | null;
  primary_email: string | null;
  suggestions?: Array<{
    id: number;
    nome: string;
    cpf: string;
  }>;
};

export type UpsertResult = {
  client_id: number;
  createdClient: boolean;
  createdEmail: boolean;
  updatedClient: boolean;
};

/* ── Internal helpers ──────────────────────────────────── */

function normalizeCpf(value?: string | null) {
  return (value ?? "").replace(/\D/g, "").slice(0, 11);
}

function normalizeEmail(value?: string | null) {
  const email = (value ?? "").trim().toLowerCase();
  return email || null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function fetchPrimaryEmail(supabase: SupabaseServerClient, clientId: number) {
  const { data } = await supabase
    .from("client_emails")
    .select("email, is_primary")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1);
  const row = Array.isArray(data) ? data[0] : null;
  return row?.email ?? null;
}

/* ── lookupClientAction ────────────────────────────────── */

export async function lookupClientAction(params: {
  cpf?: string | null;
  email?: string | null;
  nome?: string | null;
}): Promise<Result<LookupResult>> {
  const parsed = lookupClientSchema.safeParse(params);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const supabase = await createClient();

  const cpf = normalizeCpf(parsed.data.cpf);
  const emailNorm = normalizeEmail(parsed.data.email);
  const nome = (parsed.data.nome ?? "").trim();

  // Priority 1: CPF
  if (cpf.length === 11) {
    const { data: clientData, error } = await supabase
      .from("clients")
      .select("*")
      .eq("cpf", cpf)
      .maybeSingle();

    if (error) return failure("DB_ERROR", error.message);

    const client = Array.isArray(clientData) ? clientData[0] : clientData;

    if (client?.id) {
      const primaryEmail = await fetchPrimaryEmail(supabase, client.id);
      return success<LookupResult>({
        status: primaryEmail ? "FOUND_COMPLETE" : "FOUND_MISSING_EMAIL",
        client,
        primary_email: primaryEmail,
      });
    }
  }

  // Priority 2: Email
  if (emailNorm) {
    const { data: emailRowData, error: emailError } = await supabase
      .from("client_emails")
      .select(
        "client_id, clients(id, nome, cpf, cidade, estado_uf, uso_plataforma, area_atuacao, unidade, multi_unidade)"
      )
      .eq("email_norm", emailNorm)
      .maybeSingle();

    if (emailError) return failure("DB_ERROR", emailError.message);

    const emailRow = Array.isArray(emailRowData) ? emailRowData[0] : emailRowData;
    const client = Array.isArray(emailRow?.clients) ? emailRow.clients[0] : emailRow?.clients;
    if (client?.id) {
      return success<LookupResult>({
        status: "FOUND_COMPLETE",
        client,
        primary_email: null,
      });
    }
  }

  return success<LookupResult>({ status: "NOT_FOUND", client: null, primary_email: null });
}

/* ── ensureEmailForClient ──────────────────────────────── */

async function ensureEmailForClient(
  supabase: SupabaseServerClient,
  clientId: number,
  emailInput?: string | null
): Promise<Result<{ createdEmail: boolean }>> {
  const email = normalizeEmail(emailInput);
  if (!email) return success({ createdEmail: false });
  if (!isValidEmail(email)) {
    return failure("EMAIL_INVALID", "E-mail inválido.");
  }

  const { data: existingEmail, error: existingError } = await supabase
    .from("client_emails")
    .select("client_id")
    .eq("email_norm", email)
    .maybeSingle();

  if (existingError) return failure("DB_ERROR", existingError.message);
  if (existingEmail?.client_id && existingEmail.client_id !== clientId) {
    return failure("EMAIL_CONFLICT", "Este e-mail já está vinculado a outro cliente.");
  }

  const { data: emailForClient } = await supabase
    .from("client_emails")
    .select("id")
    .eq("client_id", clientId)
    .eq("email_norm", email)
    .maybeSingle();

  if (emailForClient?.id) {
    return success({ createdEmail: false });
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

  if (insertError) return failure("DB_ERROR", insertError.message);

  return success({ createdEmail: true });
}

/* ── upsertClientAction ────────────────────────────────── */

export async function upsertClientAction(payload: {
  cpf: string;
  nome: string;
  cidade: string;
  estado_uf: string;
  uso_plataforma?: string | null;
  area_atuacao?: string | null;
  unidade?: string | null;
  email?: string | null;
}): Promise<Result<UpsertResult>> {
  const parsed = upsertClientSchema.safeParse(payload);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const supabase = await createClient();
  const { cpf, nome, cidade, estado_uf, uso_plataforma, area_atuacao, unidade, email } = parsed.data;

  const baseClient = {
    nome,
    cpf,
    cidade,
    estado_uf,
    uso_plataforma: uso_plataforma || null,
    area_atuacao: area_atuacao || null,
    unidade: unidade ?? "",
    email: normalizeEmail(email) || null,
  };

  const { data: existing, error: findError } = await supabase
    .from("clients")
    .select("id")
    .eq("cpf", cpf)
    .maybeSingle();

  if (findError) return failure("DB_ERROR", findError.message);

  let createdClient = false;
  let updatedClient = false;
  let clientId: number;

  if (existing?.id) {
    clientId = existing.id;
    const { error: updateError } = await supabase
      .from("clients")
      .update({
        nome: baseClient.nome,
        cidade: baseClient.cidade,
        estado_uf: baseClient.estado_uf,
        uso_plataforma: baseClient.uso_plataforma,
        area_atuacao: baseClient.area_atuacao,
        unidade: baseClient.unidade,
        email: baseClient.email,
      })
      .eq("id", clientId);

    if (updateError) return failure("DB_ERROR", updateError.message);
    updatedClient = true;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("clients")
      .insert(baseClient)
      .select("id")
      .maybeSingle();
    if (insertError) return failure("DB_ERROR", insertError.message);
    clientId = inserted?.id;
    createdClient = true;
  }

  const emailResult = await ensureEmailForClient(supabase, clientId, email);
  if (!emailResult.ok) return emailResult;

  return success<UpsertResult>({
    client_id: clientId,
    createdClient,
    updatedClient,
    createdEmail: emailResult.data.createdEmail,
  });
}
