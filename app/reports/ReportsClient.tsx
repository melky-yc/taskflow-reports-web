"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import {
  parseBrDate,
  parseMonthYear,
  parseYear,
  toIsoDate,
  formatDateBrFromDate,
  buildFilename,
} from "@/app/reports/helpers";
import {
  ReportsFilterForm,
  PERIOD_OPTIONS,
  ALL_SEGMENT_OPTION,
  type Period,
} from "@/app/reports/components/ReportsFilterForm";
import { ReportsSummaryPanel } from "@/app/reports/components/ReportsSummaryPanel";
import { ReportsDataTable } from "@/app/reports/components/ReportsDataTable";
import {
  AppAlert,
  AppButton,
  AppDivider,
  AppSkeleton,
  FormCard,
} from "@/app/ui";
import type {
  ReportOcorrencia,
  ReportSummaryV2,
} from "@/utils/exportReportsV2";
import {
  exportReportCSVv2,
  exportReportXLSXv2,
} from "@/utils/exportReportsV2";

const PAGE_SIZE = 200;

type ReportQueryParams = {
  startDateIso: string;
  endDateIso: string;
  profissionalId: string;
  areaAtuacao: string;
};

type ProfessionalOption = {
  id: string;
  name: string;
};

type ReportState = {
  rows: ReportOcorrencia[];
  totalCount: number;
  summary: ReportSummaryV2;
  segmentLabel: string;
  queryParams: ReportQueryParams;
  page: number;
};

export default function ReportsClient() {
  const supabase = useMemo(() => createClient(), []);
  const { notify } = useAlerts();

  const [professionals, setProfessionals] = useState<ProfessionalOption[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<ReportState | null>(null);

  /* ── Load professionals ─────────────────────────────── */

  useEffect(() => {
    let mounted = true;
    const loadProfessionals = async () => {
      setIsLoadingProfessionals(true);
      const { data, error: professionalsError } = await supabase
        .from("tickets")
        .select("profissional_id, profissional_nome, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);

      if (!mounted) return;
      if (professionalsError) {
        setIsLoadingProfessionals(false);
        return;
      }

      const uniqueById = new Map<string, string>();
      (data ?? []).forEach((item) => {
        const id = String(item.profissional_id ?? "").trim();
        if (!id || uniqueById.has(id)) return;
        const name = String(item.profissional_nome ?? "").trim();
        uniqueById.set(id, name || "Sem nome");
      });

      const options = Array.from(uniqueById.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

      setProfessionals(options);
      setIsLoadingProfessionals(false);
    };
    void loadProfessionals();
    return () => { mounted = false; };
  }, [supabase]);

  /* ── Fetch page of data ─────────────────────────────── */

  const fetchPage = useCallback(
    async (params: ReportQueryParams, page: number) => {
      const rpcParams: Record<string, unknown> = {
        p_start_date: params.startDateIso,
        p_end_date: params.endDateIso,
        p_page: page,
        p_page_size: PAGE_SIZE,
      };
      if (params.profissionalId !== ALL_SEGMENT_OPTION) {
        rpcParams.p_profissional_id = params.profissionalId;
      }
      if (params.areaAtuacao !== ALL_SEGMENT_OPTION) {
        rpcParams.p_area_atuacao = params.areaAtuacao;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "reports_dataset",
        rpcParams
      );

      if (rpcError) throw rpcError;

      const rows = (data ?? []) as ReportOcorrencia[];
      const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0;
      return { rows, totalCount };
    },
    [supabase]
  );

  /* ── Fetch summary ──────────────────────────────────── */

  const fetchSummary = useCallback(
    async (params: ReportQueryParams): Promise<ReportSummaryV2> => {
      const rpcParams: Record<string, unknown> = {
        p_start_date: params.startDateIso,
        p_end_date: params.endDateIso,
      };
      if (params.profissionalId !== ALL_SEGMENT_OPTION) {
        rpcParams.p_profissional_id = params.profissionalId;
      }
      if (params.areaAtuacao !== ALL_SEGMENT_OPTION) {
        rpcParams.p_area_atuacao = params.areaAtuacao;
      }

      const { data, error: rpcError } = await supabase.rpc(
        "reports_summary",
        rpcParams
      );

      if (rpcError) throw rpcError;

      const d = data as Record<string, unknown>;

      // Safely map RPC array — accepts both {label, count} and {label, cnt}
      // Guarantees a number, never NaN
      type RawLC = Record<string, unknown>;
      const safeNum = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
      const mapLC = (arr: unknown): ReportSummaryV2["top_motivos"] =>
        ((arr ?? []) as RawLC[]).map((r) => ({
          label: String(r.label ?? ""),
          count: safeNum(r.count ?? r.cnt ?? 0),
        }));

      return {
        total_ocorrencias: safeNum(d.total_ocorrencias),
        total_tickets_unicos: safeNum(d.total_tickets_unicos),
        retroativos: safeNum(d.retroativos),
        top_motivos: mapLC(d.top_motivos),
        top_unidades: mapLC(d.top_unidades),
        por_status: mapLC(d.por_status),
        por_prioridade: mapLC(d.por_prioridade),
        por_uso_plataforma: mapLC(d.por_uso_plataforma),
        ranking_profissionais: mapLC(d.ranking_profissionais),
        periodLabel: "",
        rangeLabel: "",
      };
    },
    [supabase]
  );

  /* ── Generate handler ───────────────────────────────── */

  const handleGenerate = async (opts: {
    period: Period;
    baseDate: string;
    monthValue: string;
    yearValue: string;
    profissionalId: string;
    areaAtuacao: string;
  }) => {
    setError("");
    setLoading(true);
    try {
      const range = getRange(opts.period, opts.baseDate, opts.monthValue, opts.yearValue);
      if (!range) {
        setError("Informe um período válido para gerar o relatório.");
        return;
      }

      const startDateIso = toIsoDate(range.start);
      const endDateIso = toIsoDate(range.end);

      const periodLabel =
        PERIOD_OPTIONS.find((o) => o.value === opts.period)?.label ?? "Diário";

      const rangeLabel =
        opts.period === "daily"
          ? formatDateBrFromDate(range.start)
          : `${formatDateBrFromDate(range.start)} - ${formatDateBrFromDate(range.end)}`;

      const segmentParts: string[] = [];
      if (opts.profissionalId !== ALL_SEGMENT_OPTION) {
        const profName =
          professionals.find((p) => p.id === opts.profissionalId)?.name ??
          opts.profissionalId;
        segmentParts.push(`Profissional: ${profName}`);
      }
      if (opts.areaAtuacao !== ALL_SEGMENT_OPTION) {
        segmentParts.push(`Área: ${opts.areaAtuacao}`);
      }
      const segmentLabel =
        segmentParts.length > 0
          ? segmentParts.join(" • ")
          : "Todos os profissionais • Todas as áreas";

      const queryParams: ReportQueryParams = {
        startDateIso,
        endDateIso,
        profissionalId: opts.profissionalId,
        areaAtuacao: opts.areaAtuacao,
      };

      const [pageResult, summaryResult] = await Promise.all([
        fetchPage(queryParams, 1),
        fetchSummary(queryParams),
      ]);

      summaryResult.periodLabel = periodLabel;
      summaryResult.rangeLabel = rangeLabel;

      setReport({
        rows: pageResult.rows,
        totalCount: pageResult.totalCount,
        summary: summaryResult,
        segmentLabel,
        queryParams,
        page: 1,
      });

      notify({
        title: "Relatório gerado",
        description: `${periodLabel} • ${segmentLabel}`,
        tone: "success",
      });
    } catch {
      setError("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Page change ────────────────────────────────────── */

  const handlePageChange = async (newPage: number) => {
    if (!report) return;
    setLoading(true);
    try {
      const result = await fetchPage(report.queryParams, newPage);
      setReport((prev) =>
        prev ? { ...prev, rows: result.rows, totalCount: result.totalCount, page: newPage } : null
      );
    } catch {
      setError("Erro ao carregar página.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Export ──────────────────────────────────────────── */

  const handleExport = async (type: "csv" | "xlsx" | "pdf") => {
    if (!report) return;

    if (type === "pdf") {
      setExporting(true);
      try {
        const params = new URLSearchParams({
          start_date: report.queryParams.startDateIso,
          end_date: report.queryParams.endDateIso,
        });
        if (report.queryParams.profissionalId !== ALL_SEGMENT_OPTION) {
          params.set("profissional_id", report.queryParams.profissionalId);
        }
        if (report.queryParams.areaAtuacao !== ALL_SEGMENT_OPTION) {
          params.set("area_atuacao", report.queryParams.areaAtuacao);
        }
        const res = await fetch(`/api/reports/pdf?${params.toString()}`);
        if (!res.ok) throw new Error("PDF generation failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = buildFilename(report.summary.periodLabel, "pdf");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        notify({
          title: "Exportação concluída",
          description: "PDF corporativo gerado.",
          tone: "success",
        });
      } catch {
        notify({
          title: "Erro na exportação",
          description: "Não foi possível gerar o PDF.",
          tone: "danger",
        });
      } finally {
        setExporting(false);
      }
      return;
    }

    // For CSV/XLSX: fetch ALL data (not just current page)
    setExporting(true);
    try {
      let allRows: ReportOcorrencia[] = [];
      let currentPage = 1;
      const fetchSize = 500;
      let hasMore = true;

      while (hasMore) {
        const rpcParams: Record<string, unknown> = {
          p_start_date: report.queryParams.startDateIso,
          p_end_date: report.queryParams.endDateIso,
          p_page: currentPage,
          p_page_size: fetchSize,
        };
        if (report.queryParams.profissionalId !== ALL_SEGMENT_OPTION) {
          rpcParams.p_profissional_id = report.queryParams.profissionalId;
        }
        if (report.queryParams.areaAtuacao !== ALL_SEGMENT_OPTION) {
          rpcParams.p_area_atuacao = report.queryParams.areaAtuacao;
        }

        const { data } = await supabase.rpc("reports_dataset", rpcParams);
        const batch = (data ?? []) as ReportOcorrencia[];
        allRows = allRows.concat(batch);
        hasMore = batch.length === fetchSize;
        currentPage++;
      }

      const filename = buildFilename(report.summary.periodLabel, type);

      if (type === "csv") {
        exportReportCSVv2(allRows, report.summary, filename);
      } else {
        await exportReportXLSXv2(allRows, report.summary, filename);
      }

      notify({
        title: "Exportação concluída",
        description: `${type.toUpperCase()} gerado com ${allRows.length} linhas.`,
        tone: "success",
      });
    } catch {
      notify({
        title: "Erro na exportação",
        description: `Não foi possível gerar o ${type.toUpperCase()}.`,
        tone: "danger",
      });
    } finally {
      setExporting(false);
    }
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      <ReportsFilterForm
        professionals={professionals}
        isLoadingProfessionals={isLoadingProfessionals}
        loading={loading}
        onGenerate={handleGenerate}
      />

      {error ? (
        <AppAlert
          tone="danger"
          title="Não foi possível gerar"
          description={error}
        />
      ) : null}

      <FormCard
        title="Resultados"
        description={
          report
            ? `${report.summary.periodLabel} • ${report.summary.rangeLabel} • ${report.segmentLabel}`
            : "Selecione um período e segmentação para gerar o relatório."
        }
        actions={
          <div className="flex items-center gap-2">
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => handleExport("csv")}
              isDisabled={!report || report.totalCount === 0 || exporting}
              isLoading={exporting}
            >
              Exportar CSV
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => handleExport("xlsx")}
              isDisabled={!report || report.totalCount === 0 || exporting}
              isLoading={exporting}
            >
              Exportar XLSX
            </AppButton>
            <AppButton
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => handleExport("pdf")}
              isDisabled={!report || report.totalCount === 0 || exporting}
              isLoading={exporting}
            >
              Baixar PDF
            </AppButton>
          </div>
        }
      >
        {loading ? (
          <div className="space-y-4">
            <AppSkeleton className="h-24 w-full" />
            <AppSkeleton className="h-32 w-full" />
          </div>
        ) : report ? (
          report.totalCount === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
              Nenhuma ocorrência encontrada no período e segmentação selecionados.
            </div>
          ) : (
            <>
              <ReportsSummaryPanel
                summary={report.summary}
                segmentLabel={report.segmentLabel}
              />

              <AppDivider />

              <ReportsDataTable
                rows={report.rows}
                totalCount={report.totalCount}
                page={report.page}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
              />
            </>
          )
        ) : (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
            Selecione um período e clique em &quot;Gerar relatório&quot;.
          </div>
        )}
      </FormCard>
    </div>
  );
}

/* ── Pure helper ──────────────────────────────────────── */

function getRange(
  period: Period,
  baseDate: string,
  monthValue: string,
  yearValue: string,
) {
  if (period === "daily" || period === "weekly") {
    const date = parseBrDate(baseDate);
    if (!date) return null;
    const end = new Date(date);
    const start = new Date(date);
    if (period === "weekly") start.setDate(start.getDate() - 6);
    return { start, end };
  }
  if (period === "monthly") {
    const parsed = parseMonthYear(monthValue);
    if (!parsed) return null;
    const start = new Date(parsed.year, parsed.month - 1, 1);
    const end = new Date(parsed.year, parsed.month, 0);
    return { start, end };
  }
  const year = parseYear(yearValue);
  if (!year) return null;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  return { start, end };
}
