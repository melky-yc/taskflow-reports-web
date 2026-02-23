import { NextResponse } from "next/server";
import React from "react";
import { requireUser, AuthError, unauthorizedResponse } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import path from "path";
import fs from "fs";

/* ── Types ─────────────────────────────────────────────── */

type LabelCount = { label: string; count: number };

type SummaryData = {
    total_ocorrencias: number;
    total_tickets_unicos: number;
    retroativos: number;
    top_motivos: LabelCount[];
    top_unidades: LabelCount[];
    por_status: LabelCount[];
    por_prioridade: LabelCount[];
    ranking_profissionais: LabelCount[];
};

type OcorrenciaRow = {
    motivo_created_at: string;
    ticket_id: number;
    profissional_nome: string;
    unidade: string | null;
    motivo: string;
    prioridade: string;
    status: string;
    cliente_nome: string | null;
    cpf: string | null;
};

/* ── Status label map ──────────────────────────────────── */

const STATUS_LABEL: Record<string, string> = {
    ABERTO: "Aberto",
    EM_ANDAMENTO: "Em andamento",
    AGUARDANDO: "Aguardando",
    RESOLVIDO: "Resolvido",
    CANCELADO: "Cancelado",
};

/* ── PDF Styles ────────────────────────────────────────── */

const s = StyleSheet.create({
    page: {
        padding: 30,
        fontSize: 9,
        fontFamily: "Helvetica",
        color: "#1a1a1a",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        borderBottom: "2 solid #2563eb",
        paddingBottom: 10,
    },
    logo: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontFamily: "Helvetica-Bold",
        color: "#2563eb",
    },
    subtitle: {
        fontSize: 9,
        color: "#6b7280",
        marginTop: 2,
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: "Helvetica-Bold",
        color: "#1e293b",
        marginTop: 14,
        marginBottom: 6,
        borderBottom: "1 solid #e2e8f0",
        paddingBottom: 3,
    },
    kpiRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 10,
    },
    kpiBox: {
        flex: 1,
        padding: 8,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        border: "1 solid #e2e8f0",
    },
    kpiLabel: {
        fontSize: 7,
        color: "#6b7280",
        marginBottom: 2,
    },
    kpiValue: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: "#1e293b",
    },
    rankRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 2,
        paddingHorizontal: 4,
    },
    rankLabel: {
        fontSize: 8,
        color: "#374151",
    },
    rankCount: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#1e293b",
    },
    rankSection: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    rankCard: {
        flex: 1,
        padding: 6,
        backgroundColor: "#f8fafc",
        borderRadius: 4,
        border: "1 solid #e2e8f0",
    },
    rankCardTitle: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#1e293b",
        marginBottom: 4,
        borderBottom: "1 solid #e2e8f0",
        paddingBottom: 2,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1e293b",
        color: "#ffffff",
        paddingVertical: 4,
        paddingHorizontal: 2,
        borderRadius: 2,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 3,
        paddingHorizontal: 2,
        borderBottom: "0.5 solid #e5e7eb",
    },
    tableRowAlt: {
        flexDirection: "row",
        paddingVertical: 3,
        paddingHorizontal: 2,
        borderBottom: "0.5 solid #e5e7eb",
        backgroundColor: "#f9fafb",
    },
    col1: { width: "8%", fontSize: 7 },
    col2: { width: "7%", fontSize: 7 },
    col3: { width: "16%", fontSize: 7 },
    col4: { width: "14%", fontSize: 7 },
    col5: { width: "18%", fontSize: 7 },
    col6: { width: "7%", fontSize: 7 },
    col7: { width: "10%", fontSize: 7 },
    col8: { width: "14%", fontSize: 7 },
    col9: { width: "6%", fontSize: 7 },
    thText: {
        color: "#ffffff",
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: "row",
        justifyContent: "space-between",
        fontSize: 7,
        color: "#9ca3af",
        borderTop: "0.5 solid #e5e7eb",
        paddingTop: 6,
    },
});

/* ── PDF Document component ────────────────────────────── */

function ReportPDF({
    summary,
    rows,
    periodLabel,
    rangeLabel,
    filters,
    generatedAt,
    logoBase64,
}: {
    summary: SummaryData;
    rows: OcorrenciaRow[];
    periodLabel: string;
    rangeLabel: string;
    filters: string;
    generatedAt: string;
    logoBase64: string | null;
}) {
    const MAX_ROWS = 200;
    const displayRows = rows.slice(0, MAX_ROWS);
    const hasMore = rows.length > MAX_ROWS;

    function maskCpf(digits: string | null) {
        if (!digits || digits.length !== 11) return digits ?? "";
        return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
    }

    function fmtDate(val: string | null) {
        if (!val) return "";
        const d = new Date(val);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    }

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={s.page}>
                {/* Header */}
                <View style={s.header}>
                    {logoBase64 && <Image style={s.logo} src={logoBase64} />}
                    <View style={s.headerText}>
                        <Text style={s.title}>Taskflow Reports</Text>
                        <Text style={s.subtitle}>
                            {periodLabel} • {rangeLabel}{filters ? ` • ${filters}` : ""}
                        </Text>
                    </View>
                </View>

                {/* KPIs */}
                <View style={s.kpiRow}>
                    <View style={s.kpiBox}>
                        <Text style={s.kpiLabel}>Ocorrências</Text>
                        <Text style={s.kpiValue}>{summary.total_ocorrencias}</Text>
                    </View>
                    <View style={s.kpiBox}>
                        <Text style={s.kpiLabel}>Tickets únicos</Text>
                        <Text style={s.kpiValue}>{summary.total_tickets_unicos}</Text>
                    </View>
                    <View style={s.kpiBox}>
                        <Text style={s.kpiLabel}>Retroativos</Text>
                        <Text style={s.kpiValue}>{summary.retroativos}</Text>
                    </View>
                    <View style={s.kpiBox}>
                        <Text style={s.kpiLabel}>Taxa retroativo</Text>
                        <Text style={s.kpiValue}>
                            {summary.total_ocorrencias > 0
                                ? `${((summary.retroativos / summary.total_ocorrencias) * 100).toFixed(1)}%`
                                : "0%"}
                        </Text>
                    </View>
                </View>

                {/* Rankings */}
                <View style={s.rankSection}>
                    <View style={s.rankCard}>
                        <Text style={s.rankCardTitle}>Top 3 Motivos</Text>
                        {summary.top_motivos.slice(0, 3).map((m) => (
                            <View key={m.label} style={s.rankRow}>
                                <Text style={s.rankLabel}>{m.label}</Text>
                                <Text style={s.rankCount}>{m.count}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={s.rankCard}>
                        <Text style={s.rankCardTitle}>Top 3 Unidades</Text>
                        {summary.top_unidades.slice(0, 3).map((u) => (
                            <View key={u.label} style={s.rankRow}>
                                <Text style={s.rankLabel}>{u.label}</Text>
                                <Text style={s.rankCount}>{u.count}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={s.rankCard}>
                        <Text style={s.rankCardTitle}>Por Status</Text>
                        {summary.por_status.map((st) => (
                            <View key={st.label} style={s.rankRow}>
                                <Text style={s.rankLabel}>{STATUS_LABEL[st.label] ?? st.label}</Text>
                                <Text style={s.rankCount}>{st.count}</Text>
                            </View>
                        ))}
                    </View>
                    <View style={s.rankCard}>
                        <Text style={s.rankCardTitle}>Por Prioridade</Text>
                        {summary.por_prioridade.map((p) => (
                            <View key={p.label} style={s.rankRow}>
                                <Text style={s.rankLabel}>{p.label === "Media" ? "Média" : p.label}</Text>
                                <Text style={s.rankCount}>{p.count}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Ranking Profissionais */}
                <Text style={s.sectionTitle}>Ranking Profissionais (top 10)</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    {summary.ranking_profissionais.map((p, i) => (
                        <View key={p.label} style={s.rankRow}>
                            <Text style={s.rankLabel}>{i + 1}. {p.label}</Text>
                            <Text style={s.rankCount}> — {p.count}</Text>
                        </View>
                    ))}
                </View>

                {/* Detail table */}
                <Text style={s.sectionTitle}>
                    Ocorrências{hasMore ? ` (primeiras ${MAX_ROWS} de ${rows.length})` : ` (${displayRows.length})`}
                </Text>

                <View style={s.tableHeader}>
                    <Text style={{ ...s.thText, ...s.col1 }}>Data</Text>
                    <Text style={{ ...s.thText, ...s.col2 }}>Ticket</Text>
                    <Text style={{ ...s.thText, ...s.col3 }}>Profissional</Text>
                    <Text style={{ ...s.thText, ...s.col4 }}>Unidade</Text>
                    <Text style={{ ...s.thText, ...s.col5 }}>Motivo</Text>
                    <Text style={{ ...s.thText, ...s.col6 }}>Prior.</Text>
                    <Text style={{ ...s.thText, ...s.col7 }}>Status</Text>
                    <Text style={{ ...s.thText, ...s.col8 }}>Cliente</Text>
                    <Text style={{ ...s.thText, ...s.col9 }}>CPF</Text>
                </View>

                {displayRows.map((row, i) => (
                    <View key={`${row.ticket_id}-${i}`} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                        <Text style={s.col1}>{fmtDate(row.motivo_created_at)}</Text>
                        <Text style={s.col2}>#{row.ticket_id}</Text>
                        <Text style={s.col3}>{row.profissional_nome ?? ""}</Text>
                        <Text style={s.col4}>{row.unidade ?? ""}</Text>
                        <Text style={s.col5}>{row.motivo}</Text>
                        <Text style={s.col6}>{row.prioridade}</Text>
                        <Text style={s.col7}>{STATUS_LABEL[row.status] ?? row.status}</Text>
                        <Text style={s.col8}>{row.cliente_nome ?? ""}</Text>
                        <Text style={s.col9}>{maskCpf(row.cpf)}</Text>
                    </View>
                ))}

                {hasMore && (
                    <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 6 }}>
                        ⚠ Tabela limitada a {MAX_ROWS} linhas. Para o dataset completo, exporte em XLSX.
                    </Text>
                )}

                {/* Footer */}
                <View style={s.footer} fixed>
                    <Text>Gerado em: {generatedAt}</Text>
                    <Text>Confidencial — uso interno</Text>
                </View>
            </Page>
        </Document>
    );
}

/* ── GET handler ───────────────────────────────────────── */

export async function GET(request: Request) {
    try {
        await requireUser();
    } catch (err) {
        if (err instanceof AuthError) return unauthorizedResponse();
        throw err;
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
        return NextResponse.json(
            { error: "start_date and end_date are required" },
            { status: 400 }
        );
    }

    const supabase = await createClient();

    // Build RPC params
    const rpcFilters: Record<string, unknown> = {
        p_start_date: startDate,
        p_end_date: endDate,
        p_page: 1,
        p_page_size: 500,
    };
    const summaryFilters: Record<string, unknown> = {
        p_start_date: startDate,
        p_end_date: endDate,
    };

    const profissionalId = searchParams.get("profissional_id");
    const areaAtuacao = searchParams.get("area_atuacao");

    if (profissionalId) {
        rpcFilters.p_profissional_id = profissionalId;
        summaryFilters.p_profissional_id = profissionalId;
    }
    if (areaAtuacao) {
        rpcFilters.p_area_atuacao = areaAtuacao;
        summaryFilters.p_area_atuacao = areaAtuacao;
    }

    // Fetch data
    const [{ data: rowsData }, { data: summaryData }] = await Promise.all([
        supabase.rpc("reports_dataset", rpcFilters),
        supabase.rpc("reports_summary", summaryFilters),
    ]);

    const rows = (rowsData ?? []) as OcorrenciaRow[];

    // Safely map RPC array — accepts both {label, count} and {label, cnt}
    // Guarantees a number, never NaN
    type RawLC = Record<string, unknown>;
    const safeNum = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const mapLC = (arr: unknown): LabelCount[] =>
        ((arr ?? []) as RawLC[]).map((r) => ({
            label: String(r.label ?? ""),
            count: safeNum(r.count ?? r.cnt ?? 0),
        }));
    const rawSummary = (summaryData ?? {}) as Record<string, unknown>;
    const summary: SummaryData = {
        total_ocorrencias: safeNum(rawSummary.total_ocorrencias),
        total_tickets_unicos: safeNum(rawSummary.total_tickets_unicos),
        retroativos: safeNum(rawSummary.retroativos),
        top_motivos: mapLC(rawSummary.top_motivos),
        top_unidades: mapLC(rawSummary.top_unidades),
        por_status: mapLC(rawSummary.por_status),
        por_prioridade: mapLC(rawSummary.por_prioridade),
        ranking_profissionais: mapLC(rawSummary.ranking_profissionais),
    };

    // Format labels
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmtRange = (iso: string) => {
        const [y, m, d] = iso.split("-").map(Number);
        return `${pad(d!)}/${pad(m!)}/${y}`;
    };

    const rangeLabel = startDate === endDate
        ? fmtRange(startDate)
        : `${fmtRange(startDate)} - ${fmtRange(endDate)}`;

    const filterParts: string[] = [];
    if (profissionalId) filterParts.push(`Prof: ${profissionalId}`);
    if (areaAtuacao) filterParts.push(`Área: ${areaAtuacao}`);

    const now = new Date();
    const generatedAt = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    // Load logo
    let logoBase64: string | null = null;
    try {
        const logoPath = path.join(process.cwd(), "public", "brand", "taskflow-logo.png");
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch {
        // no logo — continue without it
    }

    // Render PDF
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfElement = React.createElement(ReportPDF, {
        summary,
        rows,
        periodLabel: "Relatório",
        rangeLabel,
        filters: filterParts.join(" • "),
        generatedAt,
        logoBase64,
    }) as any;
    const buffer = await renderToBuffer(pdfElement);

    return new NextResponse(new Uint8Array(buffer), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="relatorio_taskflow_${startDate}_${endDate}.pdf"`,
        },
    });
}
