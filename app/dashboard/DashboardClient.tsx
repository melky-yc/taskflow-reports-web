"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Clock,
  Layers,
  TrendingUp,
} from "lucide-react";
import cidadesPi from "@/data/cidades_pi.json";
import { createClient } from "@/lib/supabase/client";
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
  { value: "custom", label: "Customizado" },
];

const MOTIVOS = [
  "Problema de cadastro",
  "Informações incorretas na plataforma",
  "Dificuldade de utilizar a plataforma",
  "Problema em área e atuação",
  "Outro",
];

const PRIORIDADES = ["Baixa", "Media", "Alta"];
const USO_PLATAFORMA = ["Mobile", "Web"];
const UF_PADRAO = "PI";
const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-dashboard";

type DashboardMetrics = {
  totals: {
    total_count: number;
    retro_percent: number;
    today_count: number;
    top_motivo: string;
  };
  timeseries: Array<{ date: string; count: number }>;
  by_priority: Array<{ prioridade: string; count: number }>;
  by_motivo: Array<{ motivo: string; count: number }>;
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

function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function prioridadeBadge(prioridade: string) {
  if (prioridade === "Alta") return "danger";
  if (prioridade === "Media") return "warning";
  return "muted";
}

export default function DashboardClient() {
  const supabase = useMemo(() => createClient(), []);
  const today = useMemo(() => new Date(), []);
  const defaultFilters: FiltersState = {
    period: "7",
    motivo: "",
    prioridade: "",
    uso: "",
    uf: UF_PADRAO,
    cidade: "",
    startDate: formatDateBrFromDate(today),
    endDate: formatDateBrFromDate(today),
  };

  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersState>(defaultFilters);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const handleClear = () => {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setMetrics(null);
    setError("");
  };

  const applyFilters = async (currentFilters: FiltersState) => {
    setError("");
    setNotice("");
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
    setLoading(false);
  };

  const handleApply = () => {
    applyFilters(filters);
  };

  const priorityMap = useMemo(() => {
    const map: Record<string, number> = { Baixa: 0, Media: 0, Alta: 0 };
    metrics?.by_priority?.forEach((item) => {
      map[item.prioridade] = item.count;
    });
    return map;
  }, [metrics]);

  const appliedPeriodLabel =
    appliedFilters.period === "custom"
      ? "Período selecionado"
      : `Últimos ${appliedFilters.period} dias`;

  const totalCount = metrics?.totals.total_count ?? 0;
  const todayCount = metrics?.totals.today_count ?? 0;
  const retroPercent = metrics?.totals.retro_percent ?? 0;
  const topMotivo = metrics?.totals.top_motivo || "Sem dados";

  const timeseries = metrics?.timeseries ?? [];
  const timeseriesMax = Math.max(1, ...timeseries.map((item) => item.count));

  const priorityTotal = Object.values(priorityMap).reduce(
    (acc, value) => acc + value,
    0
  );
  const prioritySegments = [
    { label: "Alta", value: priorityMap.Alta, color: "#ef4444" },
    { label: "Média", value: priorityMap.Media, color: "#f59e0b" },
    { label: "Baixa", value: priorityMap.Baixa, color: "#3b82f6" },
  ];
  const donutStops = prioritySegments.reduce(
    (acc, item) => {
      const percentage = priorityTotal
        ? (item.value / priorityTotal) * 100
        : 0;
      const start = acc.offset;
      const end = acc.offset + percentage;
      acc.parts.push(`${item.color} ${start}% ${end}%`);
      acc.offset = end;
      return acc;
    },
    { offset: 0, parts: [] as string[] }
  );
  const donutStyle = {
    background:
      priorityTotal === 0
        ? "#e2e8f0"
        : `conic-gradient(${donutStops.parts.join(", ")})`,
  };

  const topMotivos = (metrics?.by_motivo ?? []).slice(0, 5);
  const maxMotivo = Math.max(1, ...topMotivos.map((item) => item.count));

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
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Visão geral dos chamados de suporte de TI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
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
                  <label className="text-xs font-medium text-slate-600">
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
              <label className="text-xs font-medium text-slate-600">Motivo</label>
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
              <label className="text-xs font-medium text-slate-600">
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
                    {item}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
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
              <label className="text-xs font-medium text-slate-600">UF</label>
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
              <label className="text-xs font-medium text-slate-600">
                Cidade
              </label>
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

          <div className="flex flex-wrap items-center justify-end gap-2">
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
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Total de chamados</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {formatNumber(totalCount)}
                </div>
                <div className="text-xs text-slate-500">{appliedPeriodLabel}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">% Retroativos</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {formatPercent(retroPercent)}%
                </div>
                <div className="text-xs text-slate-500">
                  {formatNumber(metrics?.totals.total_count ?? 0)} chamados
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                <Layers className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Prioridades</div>
                <div className="flex flex-wrap gap-2">
                  {PRIORIDADES.map((item) => (
                    <Badge key={item} variant={prioridadeBadge(item)}>
                      {item} {formatNumber(priorityMap[item] ?? 0)}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Tempo</div>
                <div className="text-2xl font-semibold text-slate-900">
                  {formatNumber(todayCount)}
                </div>
                <div className="text-xs text-slate-500">
                  Hoje • {formatNumber(totalCount)} {appliedPeriodLabel}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-start gap-3 p-4">
              <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Top motivo</div>
                <div className="text-lg font-semibold text-slate-900">
                  {topMotivo || "Sem dados"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Série temporal</CardTitle>
              <CardDescription>{appliedPeriodLabel}</CardDescription>
            </div>
            <CalendarDays className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            {timeseries.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex min-w-[600px] items-end gap-2">
                  {timeseries.map((item) => (
                    <div
                      key={item.date}
                      className="flex min-w-[28px] flex-1 flex-col items-center gap-2"
                    >
                      <div
                        className="w-full rounded-t-md bg-indigo-500/80"
                        style={{
                          height: `${(item.count / timeseriesMax) * 140}px`,
                        }}
                      />
                      <div className="text-[10px] text-slate-500">
                        {formatDateBR(item.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Prioridades</CardTitle>
              <CardDescription>Distribuição no período</CardDescription>
            </div>
            <BarChart3 className="h-5 w-5 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div
                className="relative h-28 w-28 rounded-full"
                style={donutStyle}
              >
                <div className="absolute inset-3 rounded-full bg-white" />
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                {prioritySegments.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.label}</span>
                    <span className="font-medium text-slate-700">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 5 motivos</CardTitle>
            <CardDescription>Chamados mais recorrentes</CardDescription>
          </CardHeader>
          <CardContent>
            {topMotivos.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <div className="space-y-3">
                {topMotivos.map((item) => (
                  <div key={item.motivo} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.motivo}</span>
                      <span className="font-medium text-slate-700">
                        {formatNumber(item.count)}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${(item.count / maxMotivo) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atalhos</CardTitle>
            <CardDescription>Ações rápidas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/tickets#novo-chamado">Criar ticket</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={ticketsLink}>Exportar dados</Link>
            </Button>
            <div className="text-xs text-slate-500">
              Exportação completa disponível em Tickets.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 unidades</CardTitle>
            <CardDescription>Volume por unidade</CardDescription>
          </CardHeader>
          <CardContent>
            {(metrics?.top_unidades ?? []).length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Unidade</th>
                    <th className="px-3 py-2">Chamados</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.top_unidades.map((item) => (
                    <tr key={item.unidade} className="border-b border-slate-100">
                      <td className="px-3 py-3">{item.unidade}</td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {formatNumber(item.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 cidades</CardTitle>
            <CardDescription>Volume por cidade</CardDescription>
          </CardHeader>
          <CardContent>
            {(metrics?.top_cidades ?? []).length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Sem dados para o período selecionado.
              </div>
            ) : (
              <table className="min-w-full border-collapse text-sm">
                <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Cidade</th>
                    <th className="px-3 py-2">Chamados</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics?.top_cidades.map((item) => (
                    <tr key={item.cidade} className="border-b border-slate-100">
                      <td className="px-3 py-3">{item.cidade}</td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {formatNumber(item.count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
