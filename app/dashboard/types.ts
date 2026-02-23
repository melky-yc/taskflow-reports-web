/* ────────────────────────────────────────────────────────────── */
/*  Dashboard domain types                                        */
/* ────────────────────────────────────────────────────────────── */

export type GrowthType = "NEW" | "UP" | "DOWN" | "FLAT";

export type TotalsDataset = {
    current: number;
    previous: number;
    growthPercent: number;
    growthType: GrowthType;
};

export type Bucket = {
    label: string;
    count: number;
    share: number;
    deltaPercent: number;
};

export type TimeseriesPoint = {
    date: string;
    all: number;
    public: number;
    prevAll: number;
    prevPublic: number;
};

export type RecentMotivo = {
    id: number;
    cliente: string;
    unidade: string | null;
    prioridade: string | null;
    motivo: string | null;
    created_at: string;
    internal?: boolean;
};

export type DashboardMetrics = {
    totals: { all: TotalsDataset; public: TotalsDataset };
    timeseries: { current: TimeseriesPoint[]; previous: TimeseriesPoint[] };
    byUso: { all: Bucket[]; public: Bucket[] };
    byUnidade: { all: Bucket[]; public: Bucket[] };
    byMotivo: { all: Bucket[]; public: Bucket[] };
    rankings: {
        topClientes: { all: Bucket[]; public: Bucket[] };
        topUnidades: { all: Bucket[]; public: Bucket[] };
    };
    concentrationTop3: { all: number; public: number };
    executiveSummary: { all: string[]; public: string[] };
    insights: { all: string[]; public: string[] };
    recent: RecentMotivo[];
    period: number;
    internalHiddenCount: number;
};

/** Flattened line-chart data point */
export type LinePoint = {
    date: string;
    atual: number;
    anterior: number;
};

/* ────────────────────────────────────────────────────────────── */
/*  Constants                                                     */
/* ────────────────────────────────────────────────────────────── */

export const PERIOD_OPTIONS = [
    { value: 7, label: "7 dias", labelFull: "Últimos 7 dias" },
    { value: 30, label: "30 dias", labelFull: "Últimos 30 dias" },
    { value: 90, label: "90 dias", labelFull: "Últimos 90 dias" },
] as const;

export const DONUT_COLORS = ["#2563eb", "#22c55e", "#f59e0b", "#94a3b8"];

export const GROWTH_TONE_MAP: Record<GrowthType | "FLAT", string> = {
    UP: "success",
    DOWN: "danger",
    NEW: "primary",
    FLAT: "neutral",
};
