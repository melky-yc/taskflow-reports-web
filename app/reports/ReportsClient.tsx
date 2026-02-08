"use client";

import { useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  exportReportCSV,
  formatDateBR,
  mapReportRow,
  type ReportSummary,
  type ReportTicket,
} from "@/utils/exportReports";

const LIMIT = 2000;

type Period = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal (últimos 7 dias)" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateBrFromDate(date: Date) {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatMonthYear(date: Date) {
  return `${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
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

function maskMonthInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 6);
  const month = digits.slice(0, 2);
  const year = digits.slice(2, 6);
  let result = month;
  if (digits.length > 2) {
    result += `/${year}`;
  }
  return result;
}

function parseBrDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function parseMonthYear(value: string) {
  const match = value.match(/^(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const month = Number(match[1]);
  const year = Number(match[2]);
  if (month < 1 || month > 12 || year < 1900) {
    return null;
  }
  return { month, year };
}

function parseYear(value: string) {
  const year = Number(value);
  if (!year || value.length !== 4) {
    return null;
  }
  return year;
}

function buildFilename(periodLabel: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
  const slug = periodLabel
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `relatorio_${stamp}_${slug}.csv`;
}

function prioridadeBadge(prioridade: string) {
  if (prioridade === "Alta") return "danger";
  if (prioridade === "Media") return "warning";
  return "muted";
}

type ReportState = {
  tickets: ReportTicket[];
  summary: ReportSummary;
  hasMore: boolean;
};

export default function ReportsClient() {
  const supabase = useMemo(() => createClient(), []);

  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>("daily");
  const [baseDate, setBaseDate] = useState(formatDateBrFromDate(today));
  const [monthValue, setMonthValue] = useState(formatMonthYear(today));
  const [yearValue, setYearValue] = useState(String(today.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState<ReportState | null>(null);

  const periodLabel = useMemo(() => {
    return PERIOD_OPTIONS.find((item) => item.value === period)?.label ?? "Diário";
  }, [period]);

  const getRange = () => {
    if (period === "daily" || period === "weekly") {
      const date = parseBrDate(baseDate);
      if (!date) return null;
      const end = new Date(date);
      const start = new Date(date);
      if (period === "weekly") {
        start.setDate(start.getDate() - 6);
      }
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
  };

  const buildSummary = (
    tickets: ReportTicket[],
    rangeLabel: string
  ): ReportSummary => {
    const total = tickets.length;
    const retroativos = tickets.filter((ticket) => ticket.retroativo).length;
    const retroativoPercent = total
      ? `${((retroativos / total) * 100).toFixed(1)}%`
      : "0%";
    const prioridades = tickets.reduce(
      (acc, ticket) => {
        const key = ticket.prioridade || "Sem prioridade";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      { Baixa: 0, Media: 0, Alta: 0 } as Record<string, number>
    );

    const motivosMap = new Map<string, number>();
    const cidadesMap = new Map<string, number>();

    tickets.forEach((ticket) => {
      motivosMap.set(ticket.motivo, (motivosMap.get(ticket.motivo) ?? 0) + 1);
      cidadesMap.set(
        ticket.client.cidade || "Sem cidade",
        (cidadesMap.get(ticket.client.cidade || "Sem cidade") ?? 0) + 1
      );
    });

    const topMotivos = Array.from(motivosMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCidades = Array.from(cidadesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      total,
      retroativos,
      retroativoPercent,
      prioridades,
      topMotivos,
      topCidades,
      periodLabel,
      rangeLabel,
    };
  };

  const handleGenerate = async () => {
    setError("");
    setNotice("");
    setLoading(true);
    const range = getRange();
    if (!range) {
      setLoading(false);
      setError("Informe um período válido para gerar o relatório.");
      return;
    }

    const startDateIso = toIsoDate(range.start);
    const endDateIso = toIsoDate(range.end);

    const startTime = new Date(range.start);
    startTime.setHours(0, 0, 0, 0);
    const endTime = new Date(range.end);
    endTime.setHours(23, 59, 59, 999);

    const rangeLabel =
      period === "daily"
        ? formatDateBrFromDate(range.start)
        : `${formatDateBrFromDate(range.start)} - ${formatDateBrFromDate(
            range.end
          )}`;

    const { data, error: queryError, count } = await supabase
      .from("tickets")
      .select(
        "id, created_at, data_atendimento, motivo, prioridade, profissional_nome, retroativo, clients(nome, cpf, cidade, estado_uf, uso_plataforma, unidade)",
        { count: "exact" }
      )
      .or(
        `and(data_atendimento.gte.${startDateIso},data_atendimento.lte.${endDateIso}),and(data_atendimento.is.null,created_at.gte.${startTime.toISOString()},created_at.lte.${endTime.toISOString()})`
      )
      .order("created_at", { ascending: false })
      .range(0, LIMIT - 1);

    if (queryError) {
      setLoading(false);
      setError("Não foi possível gerar o relatório. Tente novamente.");
      return;
    }

    const tickets: ReportTicket[] = (data ?? []).map((ticket) => ({
      id: ticket.id,
      created_at: ticket.created_at,
      data_atendimento: ticket.data_atendimento,
      motivo: ticket.motivo,
      prioridade: ticket.prioridade,
      profissional_nome: ticket.profissional_nome,
      retroativo: Boolean(ticket.retroativo),
      client: {
        nome: ticket.clients?.nome ?? "",
        cpf: ticket.clients?.cpf ?? "",
        cidade: ticket.clients?.cidade ?? "",
        estado_uf: ticket.clients?.estado_uf ?? "",
        uso_plataforma: ticket.clients?.uso_plataforma ?? null,
        unidade: ticket.clients?.unidade ?? "",
      },
    }));

    const summary = buildSummary(tickets, rangeLabel);

    setReport({
      tickets,
      summary,
      hasMore: (count ?? 0) > LIMIT,
    });
    setLoading(false);
  };

  const handleExport = () => {
    if (!report) return;
    const rows = report.tickets.map(mapReportRow);
    exportReportCSV(rows, report.summary, buildFilename(periodLabel));
    setNotice("Exportação gerada.");
    window.setTimeout(() => setNotice(""), 3000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
          <CardDescription>
            Gere relatórios por período e acompanhe as principais métricas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Período
              </label>
              <Select
                value={period}
                onChange={(event) => setPeriod(event.target.value as Period)}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            {(period === "daily" || period === "weekly") && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Data base
                </label>
                <Input
                  value={baseDate}
                  onChange={(event) => setBaseDate(maskDateInput(event.target.value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </div>
            )}

            {period === "monthly" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">
                  Mês/Ano
                </label>
                <Input
                  value={monthValue}
                  onChange={(event) =>
                    setMonthValue(maskMonthInput(event.target.value))
                  }
                  placeholder="MM/AAAA"
                  inputMode="numeric"
                />
              </div>
            )}

            {period === "yearly" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">Ano</label>
                <Input
                  value={yearValue}
                  onChange={(event) =>
                    setYearValue(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="AAAA"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Gerando..." : "Gerar relatório"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>
              {report
                ? `${report.summary.periodLabel} • ${report.summary.rangeLabel}`
                : "Selecione um período para gerar o relatório."}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={handleExport}
            disabled={!report || report.tickets.length === 0}
          >
            Exportar CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {notice ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              {notice}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : report ? (
            report.tickets.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Nenhum chamado encontrado no período selecionado.
              </div>
            ) : (
              <>
                {report.hasMore ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                    Limite de {LIMIT} registros atingido. Refine o período para
                    ver todos os chamados.
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium text-slate-500">
                      Total de chamados
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                      {report.summary.total}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium text-slate-500">
                      Retroativos
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-slate-900">
                        {report.summary.retroativoPercent}
                      </span>
                      <span className="text-sm text-slate-500">
                        ({report.summary.retroativos})
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-xs font-medium text-slate-500">
                      Período
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {report.summary.rangeLabel}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">
                      Distribuição por prioridade
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {Object.entries(report.summary.prioridades).map(
                        ([label, count]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span>{label}</span>
                            <Badge variant={prioridadeBadge(label)}>
                              {count}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">
                      Top 5 motivos
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {report.summary.topMotivos.length === 0
                        ? "Sem dados"
                        : report.summary.topMotivos.map(([label, count]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <span>{label}</span>
                              <span className="font-medium text-slate-700">
                                {count}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-700">
                      Top 5 cidades
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {report.summary.topCidades.length === 0
                        ? "Sem dados"
                        : report.summary.topCidades.map(([label, count]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <span>{label}</span>
                              <span className="font-medium text-slate-700">
                                {count}
                              </span>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Listagem resumida ({report.tickets.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="sticky top-0 bg-white">
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                          <th className="px-3 py-2">ID</th>
                          <th className="px-3 py-2">Data atendimento</th>
                          <th className="px-3 py-2">Profissional</th>
                          <th className="px-3 py-2">Motivo</th>
                          <th className="px-3 py-2">Prioridade</th>
                          <th className="px-3 py-2">Cliente</th>
                          <th className="px-3 py-2">Cidade</th>
                          <th className="px-3 py-2">UF</th>
                          <th className="px-3 py-2">Unidade</th>
                          <th className="px-3 py-2">Retroativo</th>
                          <th className="px-3 py-2">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.tickets.map((ticket) => (
                          <tr
                            key={ticket.id}
                            className="border-b border-slate-100 text-slate-700 hover:bg-slate-50"
                          >
                            <td className="px-3 py-3 font-medium">
                              #{ticket.id}
                            </td>
                            <td className="px-3 py-3">
                              {formatDateBR(ticket.data_atendimento)}
                            </td>
                            <td className="px-3 py-3">
                              {ticket.profissional_nome}
                            </td>
                            <td className="px-3 py-3">{ticket.motivo}</td>
                            <td className="px-3 py-3">
                              <Badge variant={prioridadeBadge(ticket.prioridade)}>
                                {ticket.prioridade}
                              </Badge>
                            </td>
                            <td className="px-3 py-3">{ticket.client.nome}</td>
                            <td className="px-3 py-3">{ticket.client.cidade}</td>
                            <td className="px-3 py-3">{ticket.client.estado_uf}</td>
                            <td className="px-3 py-3">{ticket.client.unidade}</td>
                            <td className="px-3 py-3">
                              {ticket.retroativo ? "Sim" : "Não"}
                            </td>
                            <td className="px-3 py-3">
                              {formatDateBR(ticket.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              Selecione um período e clique em “Gerar relatório”.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
