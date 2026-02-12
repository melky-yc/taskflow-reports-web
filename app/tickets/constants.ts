export const MOTIVOS_OPTIONS = [
  "Alteração de Perfil",
  "Apresentação",
  "Atualização de dados cadastrais",
  "Auxílio em capacitações",
  "Cadastro não localizado",
  "Criação de documentos",
  "Dados divergentes",
  "Dúvida sobre uso do sistema",
  "Erro ao salvar informações",
  "Erro no sistema",
  "Eventos (auxílio)",
  "Funcionalidade indisponível",
  "Kanban/Power BI",
  "Problema de acesso",
  "Problema de cadastro",
  "Problemas com conexões e impressoras",
  "Recuperação de senha",
  "Sistema lento ou instável",
  "Solicitação de Cadastro",
  "Solicitação de informação",
  "Suporte remoto",
  "Suporte técnico",
  "Treinamento",
  "Workshop",
  "Outro",
] as const;

export const PRIORIDADES_OPTIONS = ["Baixa", "Media", "Alta"] as const;

export const PRIORITY_BADGE_VARIANTS = {
  Baixa: "muted",
  Media: "warning",
  Alta: "danger",
  Critica: "critical",
} as const;

export const PRIORITY_COLOR_MAP = {
  Baixa: "var(--color-chart-low)",
  Media: "var(--color-chart-medium)",
  Alta: "var(--color-chart-high)",
  Critica: "var(--color-chart-high)",
} as const;

export const USO_PLATAFORMA_OPTIONS = [
  "Mobile",
  "Web",
  "Ambos",
  "Não informado",
] as const;

export const UF_PADRAO = "PI";

export const AREA_ATUACAO_OPTIONS = [
  "Saúde",
  "Educação",
  "Assistência Social",
  "Outro",
] as const;

export type MotivoOption = (typeof MOTIVOS_OPTIONS)[number];
export type PrioridadeOption = (typeof PRIORIDADES_OPTIONS)[number];
export type UsoPlataformaOption = (typeof USO_PLATAFORMA_OPTIONS)[number];
export type AreaAtuacaoOption = (typeof AREA_ATUACAO_OPTIONS)[number];

export function getPriorityBadgeVariant(prioridade: string) {
  return (
    PRIORITY_BADGE_VARIANTS[prioridade as PrioridadeOption] ?? "muted"
  );
}

export function isPrioridadeOption(value: string): value is PrioridadeOption {
  return PRIORIDADES_OPTIONS.includes(value as PrioridadeOption);
}

export function formatPrioridadeLabel(prioridade: string) {
  return prioridade === "Media" ? "Média" : prioridade;
}

