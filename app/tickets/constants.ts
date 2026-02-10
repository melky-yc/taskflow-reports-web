export const MOTIVOS_OPTIONS = [
  "Problema de cadastro",
  "Problema de acesso",
  "Recuperação de senha",
  "Cadastro não localizado",
  "Dados divergentes",
  "Atualização de dados cadastrais",
  "Alteração de Perfil",
  "Erro no sistema",
  "Funcionalidade indisponível",
  "Sistema lento ou instável",
  "Erro ao salvar informações",
  "Dúvida sobre uso do sistema",
  "Solicitação de informação",
  "Outro",
] as const;

export const PRIORIDADES_OPTIONS = ["Baixa", "Media", "Alta"] as const;

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
