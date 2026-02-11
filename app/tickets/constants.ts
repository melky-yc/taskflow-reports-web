export const MOTIVOS_OPTIONS = [
  "Alteração de Perfil",
  "Atualização de dados cadastrais",
  "Cadastro não localizado",
  "Dados divergentes",
  "Dúvida sobre uso do sistema",
  "Erro ao salvar informações",
  "Erro no sistema",
  "Funcionalidade indisponível",
  "Problema de acesso",
  "Problema de cadastro",
  "Recuperação de senha",
  "Sistema lento ou instável",
  "Solicitação de Cadastro",
  "Solicitação de informação",
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
  Baixa: "var(--color-muted-strong)",
  Media: "var(--color-warning)",
  Alta: "var(--color-danger)",
  Critica: "var(--color-critical)",
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


