"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isGarbageUnitName, sanitizeUnitName } from "@/utils/unit-name";
import type { NameStatus } from "./constants";

function parseBoolean(value: FormDataEntryValue | null) {
  if (value === null) return false;
  const str = String(value).toLowerCase();
  return str === "true" || str === "on" || str === "1";
}

function parseNameStatus(value: FormDataEntryValue | null): NameStatus | null {
  const parsed = String(value ?? "").toUpperCase();
  if (
    parsed === "INFORMADO" ||
    parsed === "NAO_INFORMADO" ||
    parsed === "NAO_ENCONTRADO" ||
    parsed === "SEM_NOME"
  ) {
    return parsed as NameStatus;
  }
  return null;
}

function normalizeNote(value: FormDataEntryValue | null) {
  const note = String(value ?? "").trim();
  return note ? note : null;
}

function redirectWithError(code: string): never {
  redirect(`/units?error=${code}`);
}

export async function createUnitAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const semNome = parseBoolean(formData.get("sem_nome"));
  const rawName = formData.get("unit_name");
  const rawStatus = formData.get("name_status");
  const nameNote = normalizeNote(formData.get("name_note"));

  let unitName: string | null = null;
  let nameStatus: NameStatus = "INFORMADO";

  if (semNome) {
    const parsedStatus = parseNameStatus(rawStatus);
    if (!parsedStatus || parsedStatus === "INFORMADO") {
      redirectWithError("status");
    }
    nameStatus = parsedStatus;
  } else {
    const sanitizedName = sanitizeUnitName(String(rawName ?? ""));
    if (!sanitizedName || sanitizedName.length < 3) {
      redirectWithError("nome");
    }
    if (isGarbageUnitName(sanitizedName)) {
      redirectWithError("nome");
    }
    unitName = sanitizedName;
    nameStatus = "INFORMADO";
  }

  const { error } = await supabase.from("units").insert({
    unit_name: unitName,
    name_status: nameStatus,
    name_note: nameNote,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("unit_insert_error", {
      code: error.code,
      message: error.message,
    });
    redirectWithError("db");
  }

  revalidatePath("/units");
  redirect("/units?status=created");
}

export async function updateUnitAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const unitId = Number(formData.get("unit_id") || 0);
  if (!unitId) {
    redirectWithError("not_found");
  }

  const semNome = parseBoolean(formData.get("sem_nome"));
  const rawName = formData.get("unit_name");
  const rawStatus = formData.get("name_status");
  const nameNote = normalizeNote(formData.get("name_note"));

  let unitName: string | null = null;
  let nameStatus: NameStatus = "INFORMADO";

  if (semNome) {
    const parsedStatus = parseNameStatus(rawStatus);
    if (!parsedStatus || parsedStatus === "INFORMADO") {
      redirectWithError("status");
    }
    nameStatus = parsedStatus;
  } else {
    const sanitizedName = sanitizeUnitName(String(rawName ?? ""));
    if (!sanitizedName || sanitizedName.length < 3) {
      redirectWithError("nome");
    }
    if (isGarbageUnitName(sanitizedName)) {
      redirectWithError("nome");
    }
    unitName = sanitizedName;
    nameStatus = "INFORMADO";
  }

  const { error } = await supabase
    .from("units")
    .update({
      unit_name: unitName,
      name_status: nameStatus,
      name_note: nameNote,
      updated_at: new Date().toISOString(),
    })
    .eq("id", unitId);

  if (error) {
    console.error("unit_update_error", {
      code: error.code,
      message: error.message,
    });
    redirectWithError("db");
  }

  revalidatePath("/units");
  redirect("/units?status=updated");
}
