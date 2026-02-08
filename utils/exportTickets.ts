import * as XLSX from "xlsx";
import type { TicketClient } from "@/app/tickets/types";

export const EXPORT_HEADERS = [
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

export type ExportRow = string[];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateOnly(dateValue: string) {
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(`${dateValue}T00:00:00`)
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
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

export function mapToExportRow(ticket: TicketClient): ExportRow {
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
    ticket.client.uso_plataforma || "",
    ticket.client.unidade || "",
    formatDateBR(ticket.created_at),
  ];
}

function buildFilenameDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hour = pad(now.getHours());
  const minute = pad(now.getMinutes());
  return `${year}-${month}-${day}_${hour}-${minute}`;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildTicketsFilename(
  filters: { period: string; motivo: string },
  extension: "csv" | "xlsx"
) {
  const period = `period-${filters.period}`;
  const motivoValue =
    filters.motivo === "all" ? "todos" : slugify(filters.motivo);
  const motivo = `motivo-${motivoValue}`;
  return `tickets_${buildFilenameDate()}_${period}_${motivo}.${extension}`;
}

function escapeCsvValue(value: string) {
  const needsQuote = /[\";\n\r]/.test(value);
  const escaped = value.replace(/\"/g, "\"\"");
  return needsQuote ? `"${escaped}"` : escaped;
}

export function exportToCSV(rows: ExportRow[], filename: string) {
  const csvLines = [EXPORT_HEADERS, ...rows].map((row) =>
    row.map((cell) => escapeCsvValue(String(cell ?? ""))).join(";")
  );
  const csvContent = `\uFEFF${csvLines.join("\r\n")}`;
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToXLSX(rows: ExportRow[], filename: string) {
  const data = [EXPORT_HEADERS, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  const colWidths = EXPORT_HEADERS.map((_, colIndex) => {
    const maxLength = data.reduce((max, row) => {
      const cellValue = row[colIndex] ? String(row[colIndex]) : "";
      return Math.max(max, cellValue.length);
    }, 10);
    return { wch: Math.min(40, maxLength + 2) };
  });

  worksheet["!cols"] = colWidths;

  EXPORT_HEADERS.forEach((_, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index });
    const cell = worksheet[cellAddress];
    if (cell) {
      cell.s = { font: { bold: true } };
    }
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
  XLSX.writeFile(workbook, filename);
}
