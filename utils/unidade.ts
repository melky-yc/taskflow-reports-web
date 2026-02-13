export const UNIDADE_SEM_CLASSIFICACAO_LABEL = "Sem classificação";

export function normalizeUnidadeInput(value?: string | null) {
  const normalized = (value ?? "").trim();
  return normalized ? normalized : null;
}

export function formatUnidade(value?: string | null) {
  return normalizeUnidadeInput(value) ?? UNIDADE_SEM_CLASSIFICACAO_LABEL;
}
