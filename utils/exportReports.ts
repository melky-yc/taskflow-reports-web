export type ReportTicket = {
  id: number;
  created_at: string;
  data_atendimento: string | null;
  motivo: string;
  prioridade: string;
  profissional_nome: string;
  retroativo: boolean;
  uso_plataforma: string | null;
  client: {
    nome: string;
    cpf: string;
    cidade: string;
    estado_uf: string;
    uso_plataforma: string | null;
    unidade: string;
  };
};

export type ReportSummary = {
  total: number;
  retroativos: number;
  retroativoPercent: string;
  prioridades: Record<string, number>;
  topMotivos: Array<[string, number]>;
  topCidades: Array<[string, number]>;
  periodLabel: string;
  rangeLabel: string;
};

export const REPORT_HEADERS = [
  "id",
  "data_atendimento",
  "profissional",
  "motivo",
  "prioridade",
  "cliente_nome",
  "cliente_cpf",
  "cliente_cidade",
  "cliente_estado_uf",
  "cliente_uso_plataforma",
  "cliente_unidade",
  "created_at",
] as const;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return "";
  }
  return `${pad(day)}/${pad(month)}/${year}`;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDateBR(value?: string | null) {
  if (!value) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return formatDateOnly(value);
  }
  return formatDateTime(value);
}

function maskCpf(digits: string) {
  if (digits.length !== 11) {
    return digits;
  }
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function mapReportRow(ticket: ReportTicket): string[] {
  const usoPlataforma =
    ticket.uso_plataforma ?? ticket.client.uso_plataforma ?? "";
  return [
    String(ticket.id),
    formatDateBR(ticket.data_atendimento),
    ticket.profissional_nome || "",
    ticket.motivo || "",
    ticket.prioridade || "",
    ticket.client.nome || "",
    maskCpf(ticket.client.cpf || ""),
    ticket.client.cidade || "",
    ticket.client.estado_uf || "",
    usoPlataforma,
    ticket.client.unidade || "",
    formatDateBR(ticket.created_at),
  ];
}

function escapeCsvValue(value: string) {
  const needsQuote = /[\";\n\r]/.test(value);
  const escaped = value.replace(/\"/g, "\"\"");
  return needsQuote ? `"${escaped}"` : escaped;
}

export function exportReportCSV(
  rows: string[][],
  summary: ReportSummary,
  filename: string
) {
  const lines: string[][] = [];
  lines.push(["Relatório", "Tickets"]);
  lines.push(["Período", summary.periodLabel]);
  lines.push(["Intervalo", summary.rangeLabel]);
  lines.push(["Total de chamados", String(summary.total)]);
  lines.push(["Retroativos (qtde)", String(summary.retroativos)]);
  lines.push(["Retroativos (%)", summary.retroativoPercent]);
  lines.push([""]);
  lines.push(["Distribuição por prioridade"]);
  Object.entries(summary.prioridades).forEach(([label, count]) => {
    lines.push([label, String(count)]);
  });
  lines.push([""]);
  lines.push(["Top 5 motivos"]);
  summary.topMotivos.forEach(([label, count]) => {
    lines.push([label, String(count)]);
  });
  lines.push([""]);
  lines.push(["Top 5 cidades"]);
  summary.topCidades.forEach(([label, count]) => {
    lines.push([label, String(count)]);
  });
  lines.push([""]);
  lines.push([...REPORT_HEADERS]);
  rows.forEach((row) => lines.push(row));

  const csvLines = lines.map((row) =>
    row.map((cell) => escapeCsvValue(String(cell ?? ""))).join(";")
  );

  const csvContent = `\uFEFF${csvLines.join("\r\n")}`;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
