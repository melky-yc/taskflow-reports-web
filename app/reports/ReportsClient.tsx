"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrioridadeLabel } from "@/app/tickets/constants";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import {
  AppAlert,
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppDivider,
  AppInput,
  AppSelect,
  AppSkeleton,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableColumn,
  AppTableHeader,
  AppTableRow,
  FormCard,
  PageHeader,
  Section,
  StatusBadge,
  type AppBadgeTone,
} from "@/app/ui";
import {
  exportReportCSV,
  formatDateBR,
  mapReportRow,
  type ReportSummary,
  type ReportTicket,
} from "@/utils/exportReports";
import { formatUnidade, normalizeUnidadeInput } from "@/utils/unidade";

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
    .replace(/[`\-?]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `relatorio_${stamp}_${slug}.csv`;
}

const PRIORITY_TONE_MAP: Record<string, AppBadgeTone> = {
  Baixa: "default",
  Media: "warning",
  Alta: "danger",
  Critica: "critical",
};

function priorityTone(label: string): AppBadgeTone {
  return PRIORITY_TONE_MAP[label] ?? "default";
}

type ReportState = {
  tickets: ReportTicket[];
  summary: ReportSummary;
  hasMore: boolean;
};

export default function ReportsClient() {
  const supabase = useMemo(() => createClient(), []);
  const { notify } = useAlerts();

  const today = useMemo(() => new Date(), []);
  const [period, setPeriod] = useState<Period>("daily");
  const [baseDate, setBaseDate] = useState(formatDateBrFromDate(today));
  const [monthValue, setMonthValue] = useState(formatMonthYear(today));
  const [yearValue, setYearValue] = useState(String(today.getFullYear()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setLoading(true);
    try {
      const range = getRange();
      if (!range) {
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
          "id, created_at, data_atendimento, motivo, prioridade, uso_plataforma, profissional_nome, retroativo, unidade, clients(nome, cpf, cidade, estado_uf, uso_plataforma, unidade)",
          { count: "exact" }
        )
        .or(
          `and(data_atendimento.gte.${startDateIso},data_atendimento.lte.${endDateIso}),and(data_atendimento.is.null,created_at.gte.${startTime.toISOString()},created_at.lte.${endTime.toISOString()})`
        )
        .order("created_at", { ascending: false })
        .range(0, LIMIT - 1);

      if (queryError) {
        setError("Não foi possível gerar o relatório. Tente novamente.");
        return;
      }

      const tickets: ReportTicket[] = (data ?? []).map((ticket) => {
        const clientData = Array.isArray(ticket.clients)
          ? ticket.clients[0]
          : ticket.clients;
        return {
          id: ticket.id,  
          created_at: ticket.created_at,
          data_atendimento: ticket.data_atendimento,
          motivo: ticket.motivo,
          prioridade: ticket.prioridade,
          profissional_nome: ticket.profissional_nome,
          retroativo: Boolean(ticket.retroativo),
          uso_plataforma: ticket.uso_plataforma ?? null,
          unidade: normalizeUnidadeInput(ticket.unidade ?? null),
          client: {
            nome: clientData?.nome ?? "",
            cpf: clientData?.cpf ?? "",
            cidade: clientData?.cidade ?? "",
            estado_uf: clientData?.estado_uf ?? "",
            uso_plataforma: clientData?.uso_plataforma ?? null,
            unidade: normalizeUnidadeInput(clientData?.unidade ?? null),
          },
        };
      });

      const summary = buildSummary(tickets, rangeLabel);

      setReport({
        tickets,
        summary,
        hasMore: (count ?? 0) > LIMIT,
      });
      notify({
        title: "Relatório gerado",
        description: `Período ${periodLabel} selecionado.`,
        tone: "success",
      });
    } catch {
      setError("Não foi possível gerar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    const rows = report.tickets.map(mapReportRow);
    exportReportCSV(rows, report.summary, buildFilename(periodLabel));
    notify({
      title: "Exportação concluída",
      description: "Arquivo CSV gerado.",
      tone: "success",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Gere relatórios por período e acompanhe as principais métricas."
      />

      <FormCard
        title="Gerador de relatórios"
        description="Selecione o período e filtre os dados antes de gerar."
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div className="flex flex-1 flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:gap-6">
            <div className="min-w-[200px] flex-1">
              <AppSelect
                label="Período"
                value={period}
                onValueChange={(value) => setPeriod(value as Period)}
                options={PERIOD_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
              />
            </div>

            {(period === "daily" || period === "weekly") && (
              <div className="min-w-[200px] flex-1">
                <AppInput
                  label="Data base"
                  value={baseDate}
                  onValueChange={(value) => setBaseDate(maskDateInput(value))}
                  placeholder="DD/MM/AAAA"
                  inputMode="numeric"
                />
              </div>
            )}

            {period === "monthly" && (
              <div className="min-w-[200px] flex-1">
                <AppInput
                  label="Mês/Ano"
                  value={monthValue}
                  onValueChange={(value) => setMonthValue(maskMonthInput(value))}
                  placeholder="MM/AAAA"
                  inputMode="numeric"
                />
              </div>
            )}

            {period === "yearly" && (
              <div className="min-w-[160px] flex-1">
                <AppInput
                  label="Ano"
                  value={yearValue}
                  onValueChange={(value) =>
                    setYearValue(value.replace(/\D/g, "").slice(0, 4))
                  }
                  placeholder="AAAA"
                  inputMode="numeric"
                />
              </div>
            )}
          </div>

          <div className="flex md:justify-end">
            <AppButton
              type="button"
              onPress={handleGenerate}
              isLoading={loading}
              isDisabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? "Gerando..." : "Gerar relatório"}
            </AppButton>
          </div>
        </div>
      </FormCard>

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
            ? `${report.summary.periodLabel} • ${report.summary.rangeLabel}`
            : "Selecione um período para gerar o relatório."
        }
        actions={
          <AppButton
            type="button"
            variant="ghost"
            size="sm"
            onPress={handleExport}
            isDisabled={!report || report.tickets.length === 0}
          >
            Exportar CSV
          </AppButton>
        }
      >
        {loading ? (
          <div className="space-y-4">
            <AppSkeleton className="h-24 w-full" />
            <AppSkeleton className="h-32 w-full" />
          </div>
        ) : report ? (
          report.tickets.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
              Nenhum chamado encontrado no período selecionado.
            </div>
          ) : (
            <>
              {report.hasMore ? (
                <AppAlert
                  tone="warning"
                  title="Limite de registros atingido"
                  description={`Limite de ${LIMIT} registros atingido. Refine o período para ver todos os chamados.`}
                />
              ) : null}

              <div className="grid gap-4 md:gap-6 md:grid-cols-3">
                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-xs font-medium text-[var(--color-muted)]">
                      Total de chamados
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                      {report.summary.total}
                    </div>
                  </AppCardBody>
                </AppCard>
                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-xs font-medium text-[var(--color-muted)]">
                      Retroativos
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-semibold text-[var(--color-text)]">
                        {report.summary.retroativoPercent}
                      </span>
                      <span className="text-sm text-[var(--color-muted)]">
                        ({report.summary.retroativos})
                      </span>
                    </div>
                  </AppCardBody>
                </AppCard>
                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-xs font-medium text-[var(--color-muted)]">
                      Período
                    </div>
                    <div className="mt-2 text-sm font-semibold text-[var(--color-text)]">
                      {report.summary.rangeLabel}
                    </div>
                  </AppCardBody>
                </AppCard>
              </div>

              <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      Distribuição por prioridade
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                      {Object.entries(report.summary.prioridades).map(
                        ([label, count]) => (
                          <div key={label} className="flex items-center justify-between">
                            <span>{formatPrioridadeLabel(label)}</span>
                            <AppBadge
                              tone={priorityTone(label)}
                              variant="soft"
                              size="sm"
                            >
                              {count}
                            </AppBadge>
                          </div>
                        )
                      )}
                    </div>
                  </AppCardBody>
                </AppCard>

                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      Top 5 motivos
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                      {report.summary.topMotivos.length === 0
                        ? "Sem dados"
                        : report.summary.topMotivos.map(([label, count]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <span>{label}</span>
                              <span className="font-medium text-[var(--color-text)]">
                                {count}
                              </span>
                            </div>
                          ))}
                    </div>
                  </AppCardBody>
                </AppCard>

                <AppCard>
                  <AppCardBody className="p-4 md:p-6">
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      Top 5 cidades
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                      {report.summary.topCidades.length === 0
                        ? "Sem dados"
                        : report.summary.topCidades.map(([label, count]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between"
                            >
                              <span>{label}</span>
                              <span className="font-medium text-[var(--color-text)]">
                                {count}
                              </span>
                            </div>
                          ))}
                    </div>
                  </AppCardBody>
                </AppCard>
              </div>

              <AppDivider />

              <Section
                title={`Listagem resumida (${report.tickets.length})`}
                showDivider={false}
              >
                <AppTable
                  aria-label="Listagem resumida"
                  stickyHeader
                  classNames={{ base: "overflow-x-auto", table: "min-w-[1080px]" }}
                >
                  <AppTableHeader>
                    <AppTableColumn>ID</AppTableColumn>
                    <AppTableColumn>Data atendimento</AppTableColumn>
                    <AppTableColumn>Profissional</AppTableColumn>
                    <AppTableColumn>Motivo</AppTableColumn>
                    <AppTableColumn>Prioridade</AppTableColumn>
                    <AppTableColumn>Cliente</AppTableColumn>
                    <AppTableColumn>Cidade</AppTableColumn>
                    <AppTableColumn>UF</AppTableColumn>
                    <AppTableColumn>Unidade afetada</AppTableColumn>
                    <AppTableColumn>Retroativo</AppTableColumn>
                    <AppTableColumn>Criado em</AppTableColumn>
                  </AppTableHeader>
                  <AppTableBody>
                    {report.tickets.map((ticket) => (
                      <AppTableRow key={ticket.id}>
                        <AppTableCell className="font-medium">#{ticket.id}</AppTableCell>
                        <AppTableCell>{formatDateBR(ticket.data_atendimento)}</AppTableCell>
                        <AppTableCell>{ticket.profissional_nome}</AppTableCell>
                        <AppTableCell>{ticket.motivo}</AppTableCell>
                        <AppTableCell>
                          <StatusBadge status={ticket.prioridade} size="sm" />
                        </AppTableCell>
                        <AppTableCell>{ticket.client.nome}</AppTableCell>
                        <AppTableCell>{ticket.client.cidade}</AppTableCell>
                        <AppTableCell>{ticket.client.estado_uf}</AppTableCell>
                        <AppTableCell>{formatUnidade(ticket.unidade)}</AppTableCell>
                        <AppTableCell>
                          {ticket.retroativo ? "Sim" : "Não"}
                        </AppTableCell>
                        <AppTableCell>{formatDateBR(ticket.created_at)}</AppTableCell>
                      </AppTableRow>
                    ))}
                  </AppTableBody>
                </AppTable>
              </Section>
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



