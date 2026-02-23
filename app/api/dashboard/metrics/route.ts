import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireUser, unauthorizedResponse, AuthError } from "@/lib/auth";

export const revalidate = 60;

const TZ_OFFSET_MINUTES = 180; // America/Sao_Paulo (UTC-3)
const TECH_PATTERNS = [/legacy_import/i, /\(sem cliente\)/i];

function startOfDayBRT(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), TZ_OFFSET_MINUTES / 60));
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatPercentNumber(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function isInternal(clientName: string | null | undefined, unidade: string | null | undefined) {
  if (!clientName && !unidade) return true;
  const name = (clientName ?? "").trim();
  const uni = (unidade ?? "").trim();
  if (!name || TECH_PATTERNS.some((p) => p.test(name))) return true;
  if (uni === "LEGACY_IMPORT") return true;
  return false;
}

type Row = {
  id: number;
  created_at: string;
  unidade: string | null;
  uso_plataforma: string | null;
  prioridade?: string | null;
  motivo?: string | null;
  clients?: { nome?: string | null }[] | { nome?: string | null } | null;
};

export async function GET(request: Request) {
  try {
    await requireUser();
  } catch (err) {
    if (err instanceof AuthError) return unauthorizedResponse();
    throw err;
  }

  const { searchParams } = new URL(request.url);
  const period = Number(searchParams.get("period") ?? 30);
  const days = [7, 30, 90].includes(period) ? period : 30;

  const supabase = await createClient();

  // janelas sem overlap em BRT: [start, start+days) e [start-days, start)
  const todayUtc = new Date();
  const startCurrent = startOfDayBRT(todayUtc); // hoje 00:00 BRT
  const currentWindowStart = addDays(startCurrent, -(days - 1));
  const currentWindowEnd = addDays(startCurrent, 1); // amanhã 00:00 BRT
  const previousWindowStart = addDays(currentWindowStart, -days);

  const startIso = currentWindowStart.toISOString();
  const endIso = currentWindowEnd.toISOString();
  const prevStartIso = previousWindowStart.toISOString();

  const { data: currentRowsRaw, error: currentError } = await supabase
    .from("ticket_motivos")
    .select("id, created_at, unidade, uso_plataforma, prioridade, motivo, clients(nome)")
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(6000);

  if (currentError) {
    return NextResponse.json({ error: currentError.message }, { status: 500 });
  }

  const { data: prevRowsRaw } = await supabase
    .from("ticket_motivos")
    .select("id, created_at, unidade, uso_plataforma, clients(nome)")
    .gte("created_at", prevStartIso)
    .lt("created_at", startIso)
    .limit(6000);

  const currentRows = (currentRowsRaw as Row[] | null) ?? [];
  const prevRows = (prevRowsRaw as Row[] | null) ?? [];

  const totalAll = currentRows.length;
  const totalPrevAll = prevRows.length;
  const totalPublic = currentRows.filter((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : (row as any).clients;
    return !isInternal(client?.nome, row.unidade);
  }).length;
  const totalPrevPublic = prevRows.filter((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : (row as any).clients;
    return !isInternal(client?.nome, row.unidade);
  }).length;

  const makeTimeseries = (rows: Row[]) => {
    const mapAll = new Map<string, number>();
    const mapPublic = new Map<string, number>();
    const brtDateKey = (iso: string) => {
      const d = new Date(iso);
      const shifted = new Date(d.getTime() - TZ_OFFSET_MINUTES * 60000);
      return shifted.toISOString().slice(0, 10);
    };
    rows.forEach((row) => {
      const dateKey = brtDateKey(row.created_at);
      mapAll.set(dateKey, (mapAll.get(dateKey) ?? 0) + 1);
      const client = Array.isArray(row.clients) ? row.clients[0] : (row as any).clients;
      if (!isInternal(client?.nome, row.unidade)) {
        mapPublic.set(dateKey, (mapPublic.get(dateKey) ?? 0) + 1);
      }
    });
    const dates = Array.from(new Set([...mapAll.keys(), ...mapPublic.keys()])).sort((a, b) => a.localeCompare(b));
    return dates.map((date) => ({
      date,
      all: mapAll.get(date) ?? 0,
      public: mapPublic.get(date) ?? 0,
    }));
  };

  const timeseriesCurrent = makeTimeseries(currentRows);
  const timeseriesPrev = makeTimeseries(prevRows);

  const prevMap = new Map(timeseriesPrev.map((d) => [d.date, d]));
  const timeseries = timeseriesCurrent.map((d) => {
    const prev = prevMap.get(addDays(new Date(d.date), -days).toISOString().slice(0, 10)) || { all: 0, public: 0 };
    return {
      date: d.date,
      all: d.all,
      public: d.public,
      prevAll: prev.all ?? 0,
      prevPublic: prev.public ?? 0,
    };
  });

  const sumTimeseriesAll = timeseries.reduce((acc, item) => acc + item.all, 0);
  const sumTimeseriesPublic = timeseries.reduce((acc, item) => acc + item.public, 0);
  if (sumTimeseriesAll !== totalAll || sumTimeseriesPublic !== totalPublic) {
    console.warn("dashboard_metrics: soma_timeseries_diff", {
      totalAll,
      totalPublic,
      sumTimeseriesAll,
      sumTimeseriesPublic,
      bucket_count: timeseries.length,
    });
  }

  const buildBuckets = (rows: Row[], filterInternal: boolean) => {
    const byUso = new Map<string, number>();
    const byUnidade = new Map<string, number>();
    const byClient = new Map<string, number>();
    const byMotivo = new Map<string, number>();
    rows.forEach((row) => {
      const client = Array.isArray(row.clients) ? row.clients[0] : (row as any).clients;
      const isTech = isInternal(client?.nome, row.unidade);
      if (filterInternal && isTech) return;
      const uso = (row.uso_plataforma ?? "Não informado").trim() || "Não informado";
      byUso.set(uso, (byUso.get(uso) ?? 0) + 1);
      const uni = (row.unidade ?? "—").trim() || "—";
      byUnidade.set(uni, (byUnidade.get(uni) ?? 0) + 1);
      const clientName = client?.nome ?? "Sem cliente";
      byClient.set(clientName, (byClient.get(clientName) ?? 0) + 1);
      const motivo = (row.motivo ?? "Não informado").trim() || "Não informado";
      byMotivo.set(motivo, (byMotivo.get(motivo) ?? 0) + 1);
    });
    return { byUso, byUnidade, byClient, byMotivo };
  };

  const bucketsAll = buildBuckets(currentRows, false);
  const bucketsPublic = buildBuckets(currentRows, true);

  const prevBucketsAll = buildBuckets(prevRows, false);
  const prevBucketsPublic = buildBuckets(prevRows, true);

  const buildList = (
    map: Map<string, number>,
    total: number,
    prevMap?: Map<string, number>
  ) =>
    Array.from(map.entries())
      .map(([label, count]) => {
        const prev = prevMap ? prevMap.get(label) ?? 0 : 0;
        return {
          label,
          count,
          share: total ? count / total : 0,
          deltaPercent: formatPercentNumber(count, prev),
        };
      })
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const byUsoAll = buildList(bucketsAll.byUso, totalAll, prevBucketsAll.byUso);
  const byUsoPublic = buildList(bucketsPublic.byUso, totalPublic, prevBucketsPublic.byUso);

  const byUnidadeAll = buildList(bucketsAll.byUnidade, totalAll, prevBucketsAll.byUnidade);
  const byUnidadePublic = buildList(bucketsPublic.byUnidade, totalPublic, prevBucketsPublic.byUnidade);

  const topClientesAll = buildList(bucketsAll.byClient, totalAll, prevBucketsAll.byClient);
  const topClientesPublic = buildList(bucketsPublic.byClient, totalPublic, prevBucketsPublic.byClient);

  const byMotivoAll = buildList(bucketsAll.byMotivo, totalAll, prevBucketsAll.byMotivo);
  const byMotivoPublic = buildList(bucketsPublic.byMotivo, totalPublic, prevBucketsPublic.byMotivo);

  const concentrationTop3All =
    totalAll === 0 ? 0 : topClientesAll.slice(0, 3).reduce((acc, item) => acc + item.count, 0) / totalAll;
  const concentrationTop3Public =
    totalPublic === 0 ? 0 : topClientesPublic.slice(0, 3).reduce((acc, item) => acc + item.count, 0) / totalPublic;

  const growthAll = formatPercentNumber(totalAll, totalPrevAll);
  const growthTypeAll = totalPrevAll === 0 && totalAll > 0 ? "NEW" : growthAll > 0 ? "UP" : growthAll < 0 ? "DOWN" : "FLAT";
  const growthPublic = formatPercentNumber(totalPublic, totalPrevPublic);
  const growthTypePublic =
    totalPrevPublic === 0 && totalPublic > 0 ? "NEW" : growthPublic > 0 ? "UP" : growthPublic < 0 ? "DOWN" : "FLAT";

  const recent = currentRows.slice(0, 20).map((row) => {
    const client = Array.isArray(row.clients) ? row.clients[0] : (row as any).clients;
    const internal = isInternal(client?.nome, row.unidade);
    return {
      id: row.id,
      cliente: client?.nome ?? "Sem cliente",
      unidade: row.unidade ?? null,
      prioridade: row.prioridade ?? null,
      motivo: row.motivo ?? null,
      created_at: row.created_at,
      internal,
    };
  });

  const makeInsight = (usePublic: boolean) => {
    const total = usePublic ? totalPublic : totalAll;
    const top3 = usePublic ? concentrationTop3Public : concentrationTop3All;
    const topUso = (usePublic ? byUsoPublic : byUsoAll)[0];
    const grow = usePublic ? growthPublic : growthAll;
    const growType = usePublic ? growthTypePublic : growthTypeAll;
    const lines: string[] = [];
    const growText =
      growType === "NEW"
        ? `Volume novo no período (${days}d).`
        : `Volume ${grow >= 0 ? "cresceu" : "caiu"} ${Math.abs(grow).toFixed(1)}% nos últimos ${days} dias.`;
    lines.push(growText);
    lines.push(
      total === 0
        ? "Sem dados no período."
        : `Top 3 clientes concentram ${(top3 * 100).toFixed(1)}% da demanda.`
    );
    if (topUso) {
      lines.push(`Canal ${topUso.label} representa ${(topUso.share * 100).toFixed(1)}% dos registros.`);
    }
    return lines;
  };

  const filterTechnical = (list: typeof topClientesAll) =>
    list.filter(
      (item) =>
        !TECH_PATTERNS.some((p) => p.test(item.label)) &&
        item.label !== "Sem cliente" &&
        item.label !== "LEGACY_IMPORT"
    );

  const insightsAll = makeInsight(false);
  const insightsPublic = makeInsight(true);

  return NextResponse.json({
    totals: {
      all: { current: totalAll, previous: totalPrevAll, growthPercent: growthAll, growthType: growthTypeAll },
      public: { current: totalPublic, previous: totalPrevPublic, growthPercent: growthPublic, growthType: growthTypePublic },
    },
    timeseries: {
      current: timeseries,
      previous: timeseriesPrev,
    },
    byUso: { all: byUsoAll, public: byUsoPublic },
    byUnidade: { all: byUnidadeAll, public: byUnidadePublic },
    byMotivo: { all: byMotivoAll, public: byMotivoPublic },
    rankings: {
      topClientes: {
        all: topClientesAll,
        public: filterTechnical(topClientesPublic),
      },
      topUnidades: {
        all: byUnidadeAll,
        public: byUnidadePublic.filter((u) => u.label !== "LEGACY_IMPORT"),
      },
    },
    concentrationTop3: { all: concentrationTop3All, public: concentrationTop3Public },
    executiveSummary: { all: insightsAll.slice(0, 3), public: insightsPublic.slice(0, 3) },
    insights: { all: insightsAll, public: insightsPublic },
    recent,
    period: days,
    internalHiddenCount: totalAll - totalPublic,
  });
}
