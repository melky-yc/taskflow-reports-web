"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Filter,
  LineChart as LineChartIcon,
  Monitor,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

const MOTIVOS = [
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
];

const PRIORIDADES = ["Baixa", "Media", "Alta"];
const USO_PLATAFORMA = ["Mobile", "Web", "Ambos", "Não informado"];
const UF_PADRAO = "PI";
const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-dashboard";

const PRIORITY_COLORS = {
  Alta: "var(--color-danger)",
  Media: "var(--color-warning)",
  Baixa: "var(--color-success)",
};

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

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
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

  const priorityMap = useMemo(() => {
    const map: Record<string, number> = { Baixa: 0, Media: 0, Alta: 0 };
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
  const usageLeaderCount = Math.max(webCount, mobileCount);
  const topMotivo = metrics?.totals.top_motivo || "Sem dados";
  const topAreaAtuacao = metrics?.totals.top_area_atuacao || "Sem dados";

  const timeseriesData = (metrics?.timeseries ?? []).map((item) => ({
    date: formatDateBR(item.date),
    count: item.count,
  }));
  const hasTimeseriesData = timeseriesData.length > 0;

  const priorityData = PRIORIDADES.map((label) => ({
    name: label === "Media" ? "Média" : label,
    value: priorityMap[label] ?? 0,
    color: PRIORITY_COLORS[label as keyof typeof PRIORITY_COLORS],
  }));
  const priorityChartData = priorityData.filter((item) => item.value > 0);
  const hasPriorityChartData = priorityChartData.length > 0;
  const isSinglePriority = priorityChartData.length === 1;

  const topMotivos = (metrics?.by_motivo ?? []).slice(0, 5).map((item) => ({
    name: item.motivo,
    value: item.count,
  }));
  const motivosChartData = topMotivos.filter((item) => item.value > 0);
  const hasMotivosChartData = motivosChartData.length > 0;

  const hasData = totalCount > 0;
  const recordLabel = formatNumber(totalCount);

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">Dashboard</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Visão geral dos chamados de suporte de TI.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/tickets#novo-chamado">Criar ticket</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={ticketsLink}>Exportar dados</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <Filter className="h-4 w-4" />
            <span>Filtros globais</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--color-muted)]">
            <span>Última atualização: {formatTime(lastUpdated)}</span>
            <span>Registros encontrados: {recordLabel}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 xl:grid-cols-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                Período
              </label>
              <Select
                value={filters.period}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    period: event.target.value as PeriodOption,
                  }))
                }
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {filters.period === "custom" ? (
              <div className="grid gap-3 md:grid-cols-2 xl:col-span-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Data inicial
                  </label>
                  <Input
                    value={filters.startDate}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        startDate: maskDateInput(event.target.value),
                      }))
                    }
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Data final
                  </label>
                  <Input
                    value={filters.endDate}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        endDate: maskDateInput(event.target.value),
                      }))
                    }
                    placeholder="DD/MM/AAAA"
                    inputMode="numeric"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">Motivo</label>
              <Select
                value={filters.motivo}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    motivo: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {MOTIVOS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                Prioridade
              </label>
              <Select
                value={filters.prioridade}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    prioridade: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {PRIORIDADES.map((item) => (
                  <option key={item} value={item}>
                    {item === "Media" ? "Média" : item}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                Uso da plataforma
              </label>
              <Select
                value={filters.uso}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    uso: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {USO_PLATAFORMA.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">UF</label>
              <Select
                value={filters.uf}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    uf: event.target.value,
                    cidade: "",
                  }))
                }
              >
                <option value={UF_PADRAO}>{UF_PADRAO}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--color-muted-strong)]">Cidade</label>
              <Input
                value={filters.cidade}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, cidade: event.target.value }))
                }
                list={CIDADES_LIST_ID}
                placeholder="Todas"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={handleClear} disabled={loading}>
              Limpar
            </Button>
            <Button onClick={handleApply} disabled={loading}>
              {loading ? "Aplicando..." : "Aplicar"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">Total de chamados</div>
                <div className="text-2xl font-semibold text-[var(--color-text)]">
                  {formatNumber(totalCount)}
                </div>
                <div className="text-xs text-[var(--color-muted)]">{periodLabel}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-warning-soft)] p-2 text-[var(--color-warning)]">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  Canal com mais chamados
                </div>
                <div className="text-2xl font-semibold text-[var(--color-text)]">
                  {usageLeader}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {usageTotal === 0
                    ? "Sem registros no período"
                    : `${formatNumber(usageLeaderCount)} chamados • Web: ${formatNumber(
                        webCount
                      )} · Mobile: ${formatNumber(mobileCount)}`}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">
                  Área mais recorrente
                </div>
                <div className="text-2xl font-semibold text-[var(--color-text)]">
                  {topAreaAtuacao}
                </div>
                <div className="text-xs text-[var(--color-muted)]">{periodLabel}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-success-soft)] p-2 text-[var(--color-success)]">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">Chamados hoje</div>
                <div className="text-2xl font-semibold text-[var(--color-text)]">
                  {formatNumber(todayCount)}
                </div>
                <div className="text-xs text-[var(--color-muted)]">{periodLabel}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 xl:col-span-4">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-[var(--color-primary-soft)] p-2 text-[var(--color-primary)]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-[var(--color-muted)]">Motivo mais recorrente</div>
                <div className="text-lg font-semibold text-[var(--color-text)]">
                  {topMotivo || "Sem dados"}
                </div>
                <div className="text-xs text-[var(--color-muted)]">
                  {hasData ? "Baseado no período selecionado" : "Sem dados"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
            ) : (
              <div className="h-72">
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
                <div className="h-72">
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
                      </Pie>
                      <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
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
              <div className="h-72">
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
                      tickFormatter={(value) => truncateLabel(String(value))}
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
          <CardHeader>
            <CardTitle>Top unidades</CardTitle>
            <CardDescription>Volume por unidade</CardDescription>
          </CardHeader>
          <CardContent>
            {(metrics?.top_unidades ?? []).length === 0 ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : (
              <div className="space-y-2 text-sm">
                {metrics?.top_unidades.map((item) => (
                  <div
                    key={item.unidade}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
                  >
                    <span className="text-[var(--color-muted-strong)]">{item.unidade}</span>
                    <Badge variant="muted">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top cidades</CardTitle>
            <CardDescription>Volume por cidade</CardDescription>
          </CardHeader>
          <CardContent>
            {(metrics?.top_cidades ?? []).length === 0 ? (
              <EmptyState label="Sem dados para o período selecionado." />
            ) : (
              <div className="space-y-2 text-sm">
                {metrics?.top_cidades.map((item) => (
                  <div
                    key={item.cidade}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2"
                  >
                    <span className="text-[var(--color-muted-strong)]">{item.cidade}</span>
                    <Badge variant="muted">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
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

