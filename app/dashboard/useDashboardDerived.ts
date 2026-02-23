"use client";

import { useMemo } from "react";
import type {
    Bucket,
    DashboardMetrics,
    LinePoint,
    RecentMotivo,
    TotalsDataset,
    GrowthType,
} from "@/app/dashboard/types";
import { GROWTH_TONE_MAP, PERIOD_OPTIONS } from "@/app/dashboard/types";
import type { StatCardTone } from "@/app/ui/stat-card";

/* ────────────────────────────────────────────────────────────── */
/*  Return type                                                   */
/* ────────────────────────────────────────────────────────────── */

export type DashboardDerived = {
    currentTotals: TotalsDataset | undefined;
    selectedByUso: Bucket[] | undefined;
    selectedByUnidade: Bucket[] | undefined;
    selectedByMotivo: Bucket[] | undefined;
    selectedTopClientes: Bucket[] | undefined;
    concentration: number | undefined;
    summary: string[] | undefined;
    recentMotivos: RecentMotivo[];
    topMotivo: Bucket | null;
    top3Motivos: Bucket[];
    top3MaxCount: number;
    publicPct: number;
    internalPct: number;
    growthTone: StatCardTone;
    periodLabel: string;
    lineData: LinePoint[];
    internalHiddenCount: number;
};

/* ────────────────────────────────────────────────────────────── */
/*  Hook                                                          */
/* ────────────────────────────────────────────────────────────── */

export function useDashboardDerived(
    metrics: DashboardMetrics | null,
    period: number,
    includeInternal: boolean,
): DashboardDerived {
    const currentTotals = useMemo(
        () => (includeInternal ? metrics?.totals.all : metrics?.totals.public),
        [metrics, includeInternal],
    );

    const selectedByUso = useMemo(
        () => (includeInternal ? metrics?.byUso.all : metrics?.byUso.public),
        [metrics, includeInternal],
    );

    const selectedByUnidade = useMemo(
        () => (includeInternal ? metrics?.byUnidade.all : metrics?.byUnidade.public),
        [metrics, includeInternal],
    );

    const selectedByMotivo = useMemo(
        () => (includeInternal ? metrics?.byMotivo.all : metrics?.byMotivo.public),
        [metrics, includeInternal],
    );

    const selectedTopClientes = useMemo(
        () =>
            includeInternal
                ? metrics?.rankings.topClientes.all
                : metrics?.rankings.topClientes.public,
        [metrics, includeInternal],
    );

    const concentration = useMemo(
        () =>
            includeInternal
                ? metrics?.concentrationTop3.all
                : metrics?.concentrationTop3.public,
        [metrics, includeInternal],
    );

    const summary = useMemo(
        () =>
            includeInternal
                ? metrics?.executiveSummary.all
                : metrics?.executiveSummary.public,
        [metrics, includeInternal],
    );

    const recentMotivos = useMemo(
        () => metrics?.recent ?? [],
        [metrics],
    );

    const { topMotivo, top3Motivos, top3MaxCount } = useMemo(() => {
        const motivos = selectedByMotivo ?? [];
        const top = motivos[0] ?? null;
        const top3 = motivos.slice(0, 3);
        const maxCount = top3.length > 0 ? top3[0].count : 1;
        return { topMotivo: top, top3Motivos: top3, top3MaxCount: maxCount };
    }, [selectedByMotivo]);

    const { publicPct, internalPct } = useMemo(() => {
        if (!metrics) return { publicPct: 0, internalPct: 0 };
        const pPct =
            (metrics.totals.public.current / Math.max(metrics.totals.all.current, 1)) * 100;
        const iPct = Number.isFinite(pPct) ? 100 - pPct : 0;
        return { publicPct: pPct, internalPct: iPct };
    }, [metrics]);

    const growthTone = useMemo(() => {
        const gt: GrowthType = currentTotals?.growthType ?? "FLAT";
        return (GROWTH_TONE_MAP[gt] ?? "neutral") as StatCardTone;
    }, [currentTotals]);

    const periodLabel = useMemo(
        () => PERIOD_OPTIONS.find((p) => p.value === period)?.labelFull ?? "Últimos 30 dias",
        [period],
    );

    const lineData = useMemo((): LinePoint[] => {
        const ts = metrics?.timeseries.current ?? [];
        return ts.map((p) => ({
            date: p.date,
            atual: includeInternal ? p.all : p.public,
            anterior: includeInternal ? p.prevAll : p.prevPublic,
        }));
    }, [metrics, includeInternal]);

    const internalHiddenCount = metrics?.internalHiddenCount ?? 0;

    return {
        currentTotals,
        selectedByUso,
        selectedByUnidade,
        selectedByMotivo,
        selectedTopClientes,
        concentration,
        summary,
        recentMotivos,
        topMotivo,
        top3Motivos,
        top3MaxCount,
        publicPct,
        internalPct,
        growthTone,
        periodLabel,
        lineData,
        internalHiddenCount,
    };
}
