import type { AppBadgeTone } from "@/app/ui";

export type NameStatus = "INFORMADO" | "NAO_INFORMADO" | "NAO_ENCONTRADO" | "SEM_NOME";

export const NAME_STATUS_OPTIONS: Array<{ value: NameStatus; label: string }> = [
  { value: "NAO_INFORMADO", label: "Não informado" },
  { value: "NAO_ENCONTRADO", label: "Não encontrado" },
  { value: "SEM_NOME", label: "Sem nome" },
];

export const NAME_STATUS_BADGE_TONE: Record<NameStatus, AppBadgeTone> = {
  INFORMADO: "default",
  NAO_INFORMADO: "warning",
  NAO_ENCONTRADO: "danger",
  SEM_NOME: "success",
};

export const GARBAGE_NAMES = [
  "S/N",
  "SN",
  "S N",
  "NA",
  "N/A",
  "N A",
  "NAO INFORMADO",
  "NÃO INFORMADO",
  "NAO INFORMADA",
  "NÃO INFORMADA",
  "-",
  "",
] as const;

