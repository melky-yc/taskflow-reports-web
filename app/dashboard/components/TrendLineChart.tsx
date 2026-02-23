"use client";

import { LineChart as LineIcon } from "lucide-react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    LineChart,
    Line,
} from "recharts";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle } from "@/app/ui";
import type { LinePoint } from "@/app/dashboard/types";
import { formatNumber, formatPercent } from "@/app/dashboard/helpers";

export type TrendLineChartProps = {
    data: LinePoint[];
    height?: string;
};

const tooltipStyle = {
    background: "var(--color-surface)",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    fontSize: 13,
};

export function TrendLineChart({
    data,
    height = "h-56 sm:h-72 lg:h-80",
}: TrendLineChartProps) {
    return (
        <AppCard className="lg:col-span-2">
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Evolução de motivos</AppCardTitle>
                <LineIcon className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className={`${height} min-h-0 min-w-0`}>
                {data.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                        Sem dados no período.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={data}
                            margin={{ left: -8, right: 4, top: 4, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-track)" />
                            <XAxis
                                dataKey="date"
                                stroke="var(--color-muted)"
                                tick={{ fontSize: 10 }}
                                tickMargin={6}
                                interval="preserveStartEnd"
                            />
                            <YAxis
                                stroke="var(--color-muted)"
                                tick={{ fontSize: 10 }}
                                allowDecimals={false}
                                width={32}
                            />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <Tooltip
                                contentStyle={tooltipStyle}
                                formatter={((
                                    _value: number | undefined,
                                    name: string | undefined,
                                    ctx: { payload?: LinePoint },
                                ) => {
                                    const current = ctx?.payload?.atual ?? 0;
                                    const prev = ctx?.payload?.anterior ?? 0;
                                    const delta =
                                        prev === 0
                                            ? current > 0
                                                ? "Novo"
                                                : "—"
                                            : `${formatPercent(((current - prev) / prev) * 100)}`;
                                    if (name === "anterior")
                                        return [formatNumber(prev), "Período anterior"];
                                    return [
                                        `${formatNumber(current)} (Δ ${delta})`,
                                        "Período atual",
                                    ];
                                }) as never}
                            />
                            <Line
                                type="monotone"
                                dataKey="anterior"
                                stroke="var(--color-muted)"
                                strokeDasharray="5 5"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="atual"
                                stroke="var(--color-primary)"
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 5, strokeWidth: 0, fill: "var(--color-primary)" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </AppCardBody>
        </AppCard>
    );
}
