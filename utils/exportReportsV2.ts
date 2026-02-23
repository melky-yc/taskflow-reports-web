/**
 * Reports v2 — types and export utilities.
 *
 * Dataset is based on ticket_motivos (ocorrências) with joins.
 */
import { formatUnidade } from "@/utils/unidade";

/* ── Row type ──────────────────────────────────────────── */

export type ReportOcorrencia = {
    motivo_id: number;
    motivo_created_at: string;
    ticket_id: number;
    profissional_nome: string;
    unidade: string | null;
    motivo: string;
    motivo_outro_descricao: string | null;
    prioridade: string;
    status: string;
    uso_plataforma: string | null;
    cliente_nome: string | null;
    cpf: string | null;
    cidade: string | null;
    estado_uf: string | null;
    area_atuacao: string | null;
    retroativo: boolean;
    multi_unidade: boolean;
    email_primario: string | null;
    data_atendimento: string | null;
    total_count: number;
};

/* ── Summary type ──────────────────────────────────────── */

export type LabelCount = { label: string; count: number };

export type ReportSummaryV2 = {
    total_ocorrencias: number;
    total_tickets_unicos: number;
    retroativos: number;
    top_motivos: LabelCount[];
    top_unidades: LabelCount[];
    por_status: LabelCount[];
    por_prioridade: LabelCount[];
    por_uso_plataforma: LabelCount[];
    ranking_profissionais: LabelCount[];
    periodLabel: string;
    rangeLabel: string;
};

/* ── Backward compat re-exports ────────────────────────── */
/* keep old types available for anything that still imports them */

export type ReportTicket = {
    id: number;
    created_at: string;
    data_atendimento: string | null;
    motivo: string;
    prioridade: string;
    profissional_id: string;
    profissional_nome: string;
    retroativo: boolean;
    uso_plataforma: string | null;
    unidade: string | null;
    client: {
        nome: string;
        cpf: string;
        cidade: string;
        estado_uf: string;
        area_atuacao: string | null;
        uso_plataforma: string | null;
        unidade: string | null;
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

/* ── Column definitions ────────────────────────────────── */

export type ColumnDef = {
    key: string;
    label: string;
    defaultVisible: boolean;
};

export const REPORT_COLUMNS: ColumnDef[] = [
    { key: "motivo_created_at", label: "Data ocorrência", defaultVisible: true },
    { key: "ticket_id", label: "Ticket #", defaultVisible: true },
    { key: "profissional_nome", label: "Profissional", defaultVisible: true },
    { key: "unidade", label: "Unidade", defaultVisible: true },
    { key: "motivo", label: "Motivo", defaultVisible: true },
    { key: "prioridade", label: "Prioridade", defaultVisible: true },
    { key: "status", label: "Status", defaultVisible: true },
    { key: "uso_plataforma", label: "Uso plataforma", defaultVisible: false },
    { key: "cliente_nome", label: "Cliente", defaultVisible: true },
    { key: "cpf", label: "CPF", defaultVisible: true },
    { key: "cidade", label: "Cidade", defaultVisible: false },
    { key: "estado_uf", label: "UF", defaultVisible: false },
    { key: "area_atuacao", label: "Área atuação", defaultVisible: false },
    { key: "retroativo", label: "Retroativo", defaultVisible: false },
    { key: "multi_unidade", label: "Multi-unidade", defaultVisible: false },
    { key: "email_primario", label: "Email primário", defaultVisible: false },
    { key: "data_atendimento", label: "Data atendimento", defaultVisible: false },
];

export const COLUMN_STORAGE_KEY = "taskflow:report-columns";

/* ── Formatting ────────────────────────────────────────── */

function pad(v: number) {
    return String(v).padStart(2, "0");
}

function formatDateOnly(value: string) {
    const [y, m, d] = value.split("-").map(Number);
    if (!y || !m || !d) return "";
    return `${pad(d)}/${pad(m)}/${y}`;
}

function formatDateTime(value: string) {
    const date = new Date(value);
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDateBR(value?: string | null) {
    if (!value) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return formatDateOnly(value);
    return formatDateTime(value);
}

export function maskCpf(digits: string | null | undefined) {
    const d = digits ?? "";
    if (d.length !== 11) return d;
    return `${d.slice(0, 3)}.***.***-${d.slice(9, 11)}`;
}

/* ── Row → string[] mapper for CSV/XLSX ────────────────── */

export const V2_HEADERS = [
    "data_ocorrencia",
    "ticket_id",
    "profissional",
    "unidade",
    "motivo",
    "prioridade",
    "status",
    "uso_plataforma",
    "cliente",
    "cpf",
    "cidade",
    "uf",
    "area_atuacao",
    "retroativo",
    "multi_unidade",
    "email",
    "data_atendimento",
] as const;

export function mapOcorrenciaRow(r: ReportOcorrencia): string[] {
    return [
        formatDateBR(r.motivo_created_at),
        String(r.ticket_id),
        r.profissional_nome ?? "",
        formatUnidade(r.unidade),
        r.motivo ?? "",
        r.prioridade ?? "",
        r.status ?? "",
        r.uso_plataforma ?? "",
        r.cliente_nome ?? "",
        maskCpf(r.cpf),
        r.cidade ?? "",
        r.estado_uf ?? "",
        r.area_atuacao ?? "",
        r.retroativo ? "Sim" : "Não",
        r.multi_unidade ? "Sim" : "Não",
        r.email_primario ?? "",
        formatDateBR(r.data_atendimento),
    ];
}

/* ── Row → Record for cell rendering ──────────────────── */

export function ocorrenciaCellValue(r: ReportOcorrencia, key: string): string {
    switch (key) {
        case "motivo_created_at": return formatDateBR(r.motivo_created_at);
        case "ticket_id": return `#${r.ticket_id}`;
        case "profissional_nome": return r.profissional_nome ?? "";
        case "unidade": return formatUnidade(r.unidade);
        case "motivo": return r.motivo ?? "";
        case "prioridade": return r.prioridade ?? "";
        case "status": return r.status ?? "";
        case "uso_plataforma": return r.uso_plataforma ?? "";
        case "cliente_nome": return r.cliente_nome ?? "";
        case "cpf": return maskCpf(r.cpf);
        case "cidade": return r.cidade ?? "";
        case "estado_uf": return r.estado_uf ?? "";
        case "area_atuacao": return r.area_atuacao ?? "";
        case "retroativo": return r.retroativo ? "Sim" : "Não";
        case "multi_unidade": return r.multi_unidade ? "Sim" : "Não";
        case "email_primario": return r.email_primario ?? "";
        case "data_atendimento": return formatDateBR(r.data_atendimento);
        default: return "";
    }
}

/* ── CSV export ────────────────────────────────────────── */

function escapeCsv(value: string) {
    const needsQuote = /[";\\n\\r]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuote ? `"${escaped}"` : escaped;
}

export function exportReportCSVv2(
    rows: ReportOcorrencia[],
    summary: ReportSummaryV2,
    filename: string
) {
    const lines: string[][] = [];
    lines.push(["Relatório", "Ocorrências v2"]);
    lines.push(["Período", summary.periodLabel]);
    lines.push(["Intervalo", summary.rangeLabel]);
    lines.push(["Total de ocorrências", String(summary.total_ocorrencias)]);
    lines.push(["Tickets únicos", String(summary.total_tickets_unicos)]);
    lines.push(["Retroativos", String(summary.retroativos)]);
    lines.push([""]);
    lines.push([...V2_HEADERS]);
    rows.forEach((r) => lines.push(mapOcorrenciaRow(r)));

    const csv = lines.map((row) => row.map(escapeCsv).join(";")).join("\r\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ── XLSX export (lazy-loaded) ─────────────────────────── */

export async function exportReportXLSXv2(
    rows: ReportOcorrencia[],
    summary: ReportSummaryV2,
    filename: string
) {
    const XLSX = await import("xlsx");

    // ── Sheet 1: Resumo ──
    const resumeData: unknown[][] = [
        ["Relatório — Resumo"],
        ["Período", summary.periodLabel],
        ["Intervalo", summary.rangeLabel],
        ["Total ocorrências", summary.total_ocorrencias],
        ["Tickets únicos", summary.total_tickets_unicos],
        ["Retroativos", summary.retroativos],
        [],
        ["Distribuição por Status"],
        ["Status", "Qtde"],
        ...summary.por_status.map((s) => [s.label, s.count]),
        [],
        ["Distribuição por Prioridade"],
        ["Prioridade", "Qtde"],
        ...summary.por_prioridade.map((p) => [p.label, p.count]),
        [],
        ["Top 10 Motivos"],
        ["Motivo", "Qtde"],
        ...summary.top_motivos.map((m) => [m.label, m.count]),
        [],
        ["Top 10 Unidades"],
        ["Unidade", "Qtde"],
        ...summary.top_unidades.map((u) => [u.label, u.count]),
        [],
        ["Ranking Profissionais (top 10)"],
        ["Profissional", "Qtde"],
        ...summary.ranking_profissionais.map((p) => [p.label, p.count]),
        [],
        ["Uso Plataforma"],
        ["Plataforma", "Qtde"],
        ...summary.por_uso_plataforma.map((u) => [u.label, u.count]),
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(resumeData);

    // ── Sheet 2: Ocorrências ──
    const detailData: unknown[][] = [
        [...V2_HEADERS],
        ...rows.map(mapOcorrenciaRow),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(detailData);

    // column widths
    const colWidths = V2_HEADERS.map((_, i) => {
        const max = detailData.reduce((m, row) => {
            const v = row[i] ? String(row[i]) : "";
            return Math.max(m, v.length);
        }, 10);
        return { wch: Math.min(42, max + 2) };
    });
    ws2["!cols"] = colWidths;

    // freeze header row
    ws2["!freeze"] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, "Resumo");
    XLSX.utils.book_append_sheet(wb, ws2, "Ocorrências");
    XLSX.writeFile(wb, filename);
}


