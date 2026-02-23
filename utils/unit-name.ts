import { GARBAGE_NAMES, type NameStatus } from "@/app/units/constants";

function normalizeGarbageToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

const GARBAGE_SET = new Set<string>(
  GARBAGE_NAMES.map((token) => normalizeGarbageToken(token))
);

export function sanitizeUnitName(value?: string | null) {
  const sanitized = (value ?? "").trim().replace(/\s+/g, " ");
  return sanitized;
}

export function isGarbageUnitName(value?: string | null) {
  const normalized = normalizeGarbageToken(value ?? "");
  if (!normalized) return true;
  return GARBAGE_SET.has(normalized);
}

export function formatUnitDisplay(unitName?: string | null, nameStatus?: NameStatus | null) {
  const sanitized = sanitizeUnitName(unitName);
  if (sanitized) {
    return sanitized;
  }

  if (!nameStatus) {
    return "—";
  }

  switch (nameStatus) {
    case "NAO_INFORMADO":
      return "— (Não informado)";
    case "NAO_ENCONTRADO":
      return "— (Não encontrado)";
    case "SEM_NOME":
      return "— (Sem nome)";
    default:
      return "—";
  }
}

