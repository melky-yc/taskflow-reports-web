"use client";

import { Activity, BarChart3, Monitor, TrendingUp } from "lucide-react";
import { StatCard } from "@/app/ui";
import type { TotalsDataset, Bucket } from "@/app/dashboard/types";
import type { StatCardTone } from "@/app/ui/stat-card";
import { formatNumber, formatPercent } from "@/app/dashboard/helpers";

export type DashboardKpiRowProps = {
    currentTotals: TotalsDataset | undefined;
    topMotivo: Bucket | null;
    concentration: number | undefined;
    publicPct: number;
    internalPct: number;
    periodLabel: string;
    growthTone: StatCardTone;
};

export function DashboardKpiRow({
    currentTotals,
    topMotivo,
    concentration,
    publicPct,
    internalPct,
    periodLabel,
    growthTone,
}: DashboardKpiRowProps) {
    return (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 xl:grid-cols-4">
            <StatCard
                icon={<Activity className="h-5 w-5" />}
                title="Total de motivos"
                value={formatNumber(currentTotals?.current ?? 0)}
                description={periodLabel}
                meta={`${publicPct.toFixed(0)}% públicos · ${internalPct.toFixed(0)}% internos`}
            />
            <StatCard
                icon={<BarChart3 className="h-5 w-5" />}
                title="Crescimento"
                value={
                    currentTotals?.growthType === "NEW"
                        ? "Novo"
                        : formatPercent(currentTotals?.growthPercent ?? 0)
                }
                description={periodLabel}
                tone={growthTone}
            />
            <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                title="Motivo recorrente"
                value={topMotivo?.label ?? "—"}
                description={
                    topMotivo ? `${(topMotivo.share * 100).toFixed(1)}% do total` : "Sem dados"
                }
                meta={
                    topMotivo
                        ? `Δ ${Number.isFinite(topMotivo.deltaPercent) ? formatPercent(topMotivo.deltaPercent) : "—"} vs anterior`
                        : undefined
                }
            />
            <StatCard
                icon={<Monitor className="h-5 w-5" />}
                title="Concentração Top 3"
                value={formatPercent((concentration ?? 0) * 100)}
                description="Participação dos 3 principais clientes"
            />
        </div>
    );
}
