"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  LineChart as LineChartIcon,
  Monitor,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import cidadesPi from "@/data/cidades_pi.json";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MOTIVOS_OPTIONS,
  PRIORIDADES_OPTIONS,
  PRIORITY_COLOR_MAP,
  USO_PLATAFORMA_OPTIONS,
  UF_PADRAO,
} from "@/app/tickets/constants";
import ActiveFiltersChips, {
  type ActiveFilterChip,
} from "@/components/dashboard/ActiveFiltersChips";
import EmptyState from "@/components/dashboard/EmptyState";
import FiltersToolbar from "@/components/dashboard/FiltersToolbar";
import KpiCard from "@/components/dashboard/KpiCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateBR } from "@/utils/exportReports";

type PeriodOption = "7" | "30" | "90" | "365" | "custom";

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Últimos 365 dias" },
  { value: "custom", label: "Personalizado" },
];

const PRIORIDADES_CHART = ["Baixa", "Media", "Alta", "Critica"];
const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-dashboard";

const MOTIVO_COLOR = "var(--color-primary)";
const CHART_GRID_COLOR = "var(--color-border)";
const CHART_AXIS_COLOR = "var(--color-muted)";
const CHART_TOOLTIP_STYLE = {
  backgroundColor: "var(--color-surface)",
  borderColor: "var(--color-border)",
  color: "var(--color-text)",
  borderRadius: 12,
  boxShadow: "var(--color-shadow)",
};

type DashboardMetrics = {
  totals: {
    total_count: number;
    retro_percent: number;
    today_count: number;
    top_motivo: string;
    top_area_atuacao: string;
  };
  timeseries: Array<{ date: string; count: number }>;
  by_priority: Array<{ prioridade: string; count: number }>;
  by_motivo: Array<{ motivo: string; count: number }>;
  by_uso_plataforma: Array<{ uso_plataforma: string | null; count: number }>;
  top_unidades: Array<{ unidade: string; count: number }>;
  top_cidades: Array<{ cidade: string; count: number }>;
};

type FiltersState = {
  period: PeriodOption;
  motivo: string;
  prioridade: string;
  uso: string;
  uf: string;
  cidade: string;
  startDate: string;
  endDate: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateBrFromDate(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function maskDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  let result = day;
  if (digits.length > 2) {
    result += `/${month}`;
  }
  if (digits.length > 4) {
    result += `/${year}`;
  }
  return result;
}

function brToIso(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return "";
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return "";
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatTime(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function truncateLabel(value: string, max = 24) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function renderMotivosTick(
  props: {
    x?: number | string;
    y?: number | string;
    payload?: { value?: string };
  } & Record<string, unknown>
) {
  const xValueRaw = typeof props.x === "number" ? props.x : Number(props.x);
  const yValueRaw = typeof props.y === "number" ? props.y : Number(props.y);
  const xValue = Number.isFinite(xValueRaw) ? xValueRaw : 0;
  const yValue = Number.isFinite(yValueRaw) ? yValueRaw : 0;
  const label = String(props.payload?.value ?? "");
  return (
    <g transform={`translate(${xValue},${yValue})`}>
      <title>{label}</title>
      <text
        x={-6}
        y={0}
        dy={4}
        textAnchor="end"
        fill={CHART_AXIS_COLOR}
        fontSize={12}
      >
        {truncateLabel(label)}
      </text>
    </g>
  );
}

export default function DashboardClient() {
  const supabase = useMemo(() => createClient(), []);
  const today = useMemo(() => new Date(), []);

  const defaultFilters = useMemo<FiltersState>(
    () => ({
      period: "7",
      motivo: "",
      prioridade: "",
      uso: "",
      uf: UF_PADRAO,
      cidade: "",
      startDate: formatDateBrFromDate(today),
      endDate: formatDateBrFromDate(today),
    }),
    [today]
  );

  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(defaultFilters);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const applyFilters = useCallback(async (currentFilters: FiltersState) => {
    setError("");
    setLoading(true);

    const payload = {
      period: currentFilters.period,
      motivo: currentFilters.motivo,
      prioridade: currentFilters.prioridade,
      uso_plataforma: currentFilters.uso,
      uf: currentFilters.uf,
      cidade: currentFilters.cidade,
      start_date: "",
      end_date: "",
    };

    if (currentFilters.period === "custom") {
      const startIso = brToIso(currentFilters.startDate);
      const endIso = brToIso(currentFilters.endDate);
      if (!startIso || !endIso) {
        setLoading(false);
        setError("Informe um intervalo válido no formato DD/MM/AAAA.");
        return;
      }
      payload.start_date = startIso;
      payload.end_date = endIso;
    }

    const { data, error: rpcError } = await supabase.rpc(
      "dashboard_metrics",
      {
        filters: payload,
      }
    );

    if (rpcError || !data) {
      setLoading(false);
      setError("Não foi possível carregar o dashboard. Tente novamente.");
      return;
    }

    setMetrics(data as DashboardMetrics);
    setAppliedFilters(currentFilters);
    setLastUpdated(new Date());
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      applyFilters(defaultFilters);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [applyFilters, defaultFilters]);

  const handleApply = () => {
    applyFilters(filters);
  };

  const handleClear = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setMetrics(null);
    setLastUpdated(null);
    setError("");
  };

  const handleFilterChange = (patch: Partial<FiltersState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const handleRemoveFilter = useCallback(
    (key: keyof FiltersState) => {
      const nextFilters = { ...appliedFilters };
      switch (key) {
        case "period":
          nextFilters.period = defaultFilters.period;
          nextFilters.startDate = defaultFilters.startDate;
          nextFilters.endDate = defaultFilters.endDate;
          break;
        case "motivo":
          nextFilters.motivo = "";
          break;
        case "prioridade":
          nextFilters.prioridade = "";
          break;
        case "uso":
          nextFilters.uso = "";
          break;
        case "uf":
          nextFilters.uf = "";
          nextFilters.cidade = "";
          break;
        case "cidade":
          nextFilters.cidade = "";
          break;
        default:
          break;
      }
      setFilters(nextFilters);
      applyFilters(nextFilters);
    },
    [appliedFilters, applyFilters, defaultFilters]
  );

  const priorityMap = useMemo(() => {
    const map: Record<string, number> = {
      Baixa: 0,
      Media: 0,
      Alta: 0,
      Critica: 0,
    };
    metrics?.by_priority?.forEach((item) => {
      map[item.prioridade] = item.count;
    });
    return map;
  }, [metrics]);

  const periodLabel =
    appliedFilters.period === "custom"
      ? "Período selecionado"
      : `Últimos ${appliedFilters.period} dias`;

  const totalCount = metrics?.totals.total_count ?? 0;
  const todayCount = metrics?.totals.today_count ?? 0;
  const hasData = totalCount > 0;
  const recordLabel = formatNumber(totalCount);
  const usoPlataforma = metrics?.by_uso_plataforma ?? [];
  const webCount =
    usoPlataforma.find((item) => item.uso_plataforma === "Web")?.count ?? 0;
  const mobileCount =
    usoPlataforma.find((item) => item.uso_plataforma === "Mobile")?.count ?? 0;
  const usageTotal = webCount + mobileCount;
  const usageLeader =
    usageTotal === 0
      ? "Sem dados"
      : webCount === mobileCount
      ? "Empate"
      : webCount > mobileCount
      ? "Web"
      : "Mobile";
  const topMotivo = metrics?.totals.top_motivo || "Sem dados";
  const topAreaAtuacaoRaw = metrics?.totals.top_area_atuacao?.trim() ?? "";
  const topAreaAtuacao =
    topAreaAtuacaoRaw || (totalCount > 0 ? "Não informado" : "Sem dados");

  const timeseriesData = (metrics?.timeseries ?? []).map((item) => ({
    date: formatDateBR(item.date),
    count: item.count,
  }));
  const hasTimeseriesData = totalCount > 0 && timeseriesData.length > 0;
  const hasTrendData = timeseriesData.length >= 3;

  const periodDays = useMemo(() => {
    if (appliedFilters.period === "custom") {
      const startIso = brToIso(appliedFilters.startDate);
      const endIso = brToIso(appliedFilters.endDate);
      if (!startIso || !endIso) {
        return 0;
      }
      const start = new Date(`${startIso}T00:00:00`);
      const end = new Date(`${endIso}T00:00:00`);
      const diff = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
      return diff > 0 ? diff : 0;
    }
    const value = Number(appliedFilters.period);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }, [appliedFilters]);

  const avgPerDayValue = periodDays > 0 ? totalCount / periodDays : 0;
  const avgPerDayLabel =
    totalCount > 0 && periodDays > 0
      ? formatNumber(Math.round(avgPerDayValue))
      : "—";
  const peakDayValue =
    timeseriesData.length > 0
      ? Math.max(...timeseriesData.map((item) => item.count))
      : 0;
  const peakDayLabel = totalCount > 0 ? formatNumber(peakDayValue) : "—";
  const kpiTotalMeta = `Média/dia: ${avgPerDayLabel} • Pico: ${peakDayLabel}`;
  const kpiUsageMeta =
    usageTotal === 0
      ? "—"
      : `Web: ${formatNumber(webCount)} · Mobile: ${formatNumber(mobileCount)}`;
  const kpiAreaMeta =
    totalCount > 0 ? `Baseado em ${recordLabel} chamados` : "—";
  const kpiTodayMeta = `Média/dia: ${avgPerDayLabel}`;

  const priorityData = PRIORIDADES_CHART.map((label) => ({
    name:
      label === "Media"
        ? "Média"
        : label === "Critica"
        ? "Crítica"
        : label,
    value: priorityMap[label] ?? 0,
    color:
      PRIORITY_COLOR_MAP[label as keyof typeof PRIORITY_COLOR_MAP] ??
      "#7c3aed",
  }));
  const priorityChartData = priorityData.filter((item) => item.value > 0);
  const hasPriorityChartData = priorityChartData.length > 0;
  const isSinglePriority = priorityChartData.length === 1;
  const priorityTotal = priorityChartData.reduce(
    (acc, item) => acc + item.value,
    0
  );
  const priorityTotalLabel = formatNumber(priorityTotal);

  const topMotivos = (metrics?.by_motivo ?? [])
    .slice()
    .sort(
      (a, b) => b.count - a.count || a.motivo.localeCompare(b.motivo)
    )
    .slice(0, 5)
    .map((item) => ({
      name: item.motivo,
      value: item.count,
    }));
  const motivosChartData = topMotivos.filter((item) => item.value > 0);
  const hasMotivosChartData = motivosChartData.length > 0;

  const topUnidades = metrics?.top_unidades ?? [];
  const topCidades = metrics?.top_cidades ?? [];
  const isUnidadesUniform =
    topUnidades.length > 1 &&
    topUnidades.every((item) => item.count === topUnidades[0].count);
  const isCidadesUniform =
    topCidades.length > 1 &&
    topCidades.every((item) => item.count === topCidades[0].count);
  const topUnidadesDisplay = topUnidades.slice(0, isUnidadesUniform ? 3 : 5);
  const topCidadesDisplay = topCidades.slice(0, isCidadesUniform ? 3 : 5);
  const maxUnidadeCount = Math.max(
    ...topUnidades.map((item) => item.count),
    0
  );
  const maxCidadeCount = Math.max(
    ...topCidades.map((item) => item.count),
    0
  );

  const activeFilterChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const periodChipLabel =
      appliedFilters.period === "custom"
        ? `De ${appliedFilters.startDate || "—"} a ${
            appliedFilters.endDate || "—"
          }`
        : PERIOD_OPTIONS.find((option) => option.value === appliedFilters.period)
            ?.label || periodLabel;

    chips.push({
      id: "period",
      label: periodChipLabel,
      onRemove: () => handleRemoveFilter("period"),
    });

    if (appliedFilters.motivo) {
      chips.push({
        id: "motivo",
        label: `Motivo: ${appliedFilters.motivo}`,
        onRemove: () => handleRemoveFilter("motivo"),
      });
    }
    if (appliedFilters.prioridade) {
      chips.push({
        id: "prioridade",
        label: `Prioridade: ${
          appliedFilters.prioridade === "Media"
            ? "Média"
            : appliedFilters.prioridade
        }`,
        onRemove: () => handleRemoveFilter("prioridade"),
      });
    }
    if (appliedFilters.uso) {
      chips.push({
        id: "uso",
        label: `Uso: ${appliedFilters.uso}`,
        onRemove: () => handleRemoveFilter("uso"),
      });
    }
    if (appliedFilters.uf) {
      chips.push({
        id: "uf",
        label: `UF: ${appliedFilters.uf}`,
        onRemove: () => handleRemoveFilter("uf"),
      });
    }
    if (appliedFilters.cidade) {
      chips.push({
        id: "cidade",
        label: `Cidade: ${appliedFilters.cidade}`,
        onRemove: () => handleRemoveFilter("cidade"),
      });
    }

    return chips;
  }, [appliedFilters, handleRemoveFilter, periodLabel]);

  const ticketsLink = useMemo(() => {
    const params = new URLSearchParams();
    const periodValue =
      appliedFilters.period === "custom" ? "7" : appliedFilters.period;
    params.set("period", periodValue);
    if (appliedFilters.motivo) {
      params.set("motivo", appliedFilters.motivo);
    }
    return `/tickets?${params.toString()}`;
  }, [appliedFilters]);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">
              Dashboard
            </h1>
            <p className="text-sm text-[var(--color-muted)]">
              Visão geral dos chamados de suporte de TI.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href="/tickets#novo-chamado">Criar ticket</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={ticketsLink}>Exportar (CSV/XLSX)</Link>
            </Button>
          </div>
        </div>
        <ActiveFiltersChips items={activeFilterChips} />
      </div>

      <FiltersToolbar
        filters={filters}
        periodOptions={PERIOD_OPTIONS}
        motivos={MOTIVOS_OPTIONS}
        prioridades={PRIORIDADES_OPTIONS}
        usoPlataforma={USO_PLATAFORMA_OPTIONS}
        ufOptions={[UF_PADRAO]}
        cidadesListId={CIDADES_LIST_ID}
        onFilterChange={handleFilterChange}
        onApply={handleApply}
        onClear={handleClear}
        loading={loading}
        lastUpdatedLabel={formatTime(lastUpdated)}
        recordLabel={recordLabel}
        maskDateInput={maskDateInput}
      />

      {error ? (
        <Alert className="border-[var(--color-danger)] bg-[var(--color-danger-soft)]">
          <AlertTitle>Não foi possível carregar</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" onClick={() => applyFilters(filters)}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={<Activity className="h-5 w-5" />}
              label="Total de chamados"
              value={formatNumber(totalCount)}
              description={periodLabel}
              meta={kpiTotalMeta}
              tone="primary"
            />
            <KpiCard
              icon={<Monitor className="h-5 w-5" />}
              label="Canal com mais chamados"
              value={usageLeader}
              description={periodLabel}
              meta={kpiUsageMeta}
              tone="warning"
            />
            <KpiCard
              icon={<BarChart3 className="h-5 w-5" />}
              label="Área mais recorrente"
              value={topAreaAtuacao}
              description={periodLabel}
              meta={kpiAreaMeta}
              tone="primary"
            />
            <KpiCard
              icon={<CalendarDays className="h-5 w-5" />}
              label="Chamados hoje"
              value={formatNumber(todayCount)}
              description={periodLabel}
              meta={kpiTodayMeta}
              tone="success"
            />
          </div>

          <Card className="mt-4">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  Motivo mais recorrente
                </div>
                <div className="text-lg font-semibold text-[var(--color-text)]">
                  {topMotivo || "Sem dados"}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {hasData ? "Baseado no período selecionado" : "Sem dados"}
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Série temporal</CardTitle>
              <CardDescription>{periodLabel}</CardDescription>
            </div>
            <LineChartIcon className="h-5 w-5 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            {!hasTimeseriesData ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : !hasTrendData ? (
              <EmptyState label="Sem dados suficientes para tendência (mín. 3 dias)." />
            ) : (
              <div className="h-72" role="img" aria-label="Série temporal de chamados">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeseriesData} margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                    <XAxis dataKey="date" stroke={CHART_AXIS_COLOR} />
                    <YAxis stroke={CHART_AXIS_COLOR} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-primary)"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "var(--color-primary)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Distribuição por prioridade</CardTitle>
              <CardDescription>Chamados no período</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-[var(--color-muted)]" />
          </CardHeader>
          <CardContent>
            {!hasPriorityChartData ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : isSinglePriority ? (
              <div className="rounded-lg border border-[var(--color-border)] p-4">
                <div className="text-sm text-[var(--color-muted)]">Prioridade dominante</div>
                <div className="mt-1 text-xl font-semibold text-[var(--color-text)]">
                  {priorityChartData[0].name}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="font-medium text-[var(--color-text)]">
                    {formatNumber(priorityChartData[0].value)}
                  </span>
                  <span className="text-[var(--color-muted)]">• 100%</span>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="h-72"
                  role="img"
                  aria-label="Gráfico de distribuição por prioridade"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={1}
                      >
                        {priorityChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                        <Label
                          position="center"
                          content={({ viewBox }) => {
                            if (!viewBox) {
                              return null;
                            }
                            const polarViewBox = viewBox as {
                              cx?: number;
                              cy?: number;
                            };
                            if (
                              typeof polarViewBox.cx !== "number" ||
                              typeof polarViewBox.cy !== "number"
                            ) {
                              return null;
                            }
                            const cx = polarViewBox.cx;
                            const cy = polarViewBox.cy;
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="central"
                              >
                                <tspan
                                  x={cx}
                                  dy="-0.2em"
                                  fontSize="18"
                                  fontWeight="600"
                                  fill="var(--color-text)"
                                >
                                  {priorityTotalLabel}
                                </tspan>
                                <tspan
                                  x={cx}
                                  dy="1.4em"
                                  fontSize="11"
                                  fill="var(--color-muted)"
                                >
                                  Total
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                      <Tooltip
                        contentStyle={CHART_TOOLTIP_STYLE}
                        formatter={(value, name) => {
                          const numericValue =
                            typeof value === "number" ? value : Number(value);
                          const percent =
                            priorityTotal > 0
                              ? Math.round((numericValue / priorityTotal) * 100)
                              : 0;
                          return [
                            `${formatNumber(numericValue)} • ${percent}%`,
                            name,
                          ];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--color-muted-strong)]">
                  {priorityChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                      <span className="font-medium text-[var(--color-text)]">
                        {formatNumber(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Top motivos</CardTitle>
            <CardDescription>Chamados mais recorrentes</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasMotivosChartData ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : (
              <div className="h-72" role="img" aria-label="Top motivos de chamados">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={motivosChartData}
                    layout="vertical"
                    margin={{ left: 48, right: 24, top: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} />
                    <XAxis
                      type="number"
                      stroke={CHART_AXIS_COLOR}
                      domain={[0, (dataMax: number) => dataMax + 1]}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke={CHART_AXIS_COLOR}
                      width={180}
                      tick={renderMotivosTick}
                    />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Bar
                      dataKey="value"
                      fill={MOTIVO_COLOR}
                      radius={[6, 6, 6, 6]}
                      barSize={24}
                    >
                      <LabelList dataKey="value" position="right" fill="var(--color-text)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Top unidades</CardTitle>
              <CardDescription>Volume por unidade</CardDescription>
            </div>
            {topUnidades.length >= 5 && !isUnidadesUniform ? (
              <Button asChild variant="ghost" className="h-7 px-2 text-xs">
                <Link href="/reports">Ver mais</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {topUnidades.length === 0 ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : (
              <div className="space-y-3 text-sm">
                {isUnidadesUniform ? (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-3 py-2 text-xs text-[var(--color-muted-strong)]">
                    Distribuição uniforme no período.
                  </div>
                ) : null}
                {topUnidadesDisplay.map((item) => {
                  const percent = maxUnidadeCount
                    ? Math.round((item.count / maxUnidadeCount) * 100)
                    : 0;
                  return (
                    <div
                      key={item.unidade}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[var(--color-muted-strong)]">
                          {item.unidade}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-muted)]">
                            {percent}%
                          </span>
                          <Badge variant="muted">{formatNumber(item.count)}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-muted-soft)]">
                        <div
                          className="h-2 rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>Top cidades</CardTitle>
              <CardDescription>Volume por cidade</CardDescription>
            </div>
            {topCidades.length >= 5 && !isCidadesUniform ? (
              <Button asChild variant="ghost" className="h-7 px-2 text-xs">
                <Link href="/reports">Ver mais</Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {topCidades.length === 0 ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : (
              <div className="space-y-3 text-sm">
                {isCidadesUniform ? (
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-3 py-2 text-xs text-[var(--color-muted-strong)]">
                    Distribuição uniforme no período.
                  </div>
                ) : null}
                {topCidadesDisplay.map((item) => {
                  const percent = maxCidadeCount
                    ? Math.round((item.count / maxCidadeCount) * 100)
                    : 0;
                  return (
                    <div
                      key={item.cidade}
                      className="rounded-lg border border-[var(--color-border)] px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[var(--color-muted-strong)]">
                          {item.cidade}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--color-muted)]">
                            {percent}%
                          </span>
                          <Badge variant="muted">{formatNumber(item.count)}</Badge>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-muted-soft)]">
                        <div
                          className="h-2 rounded-full bg-[var(--color-primary)]"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <datalist id={CIDADES_LIST_ID}>
        {CIDADES_PI.map((cidade) => (
          <option key={cidade} value={cidade} />
        ))}
      </datalist>
    </div>
  );
}

