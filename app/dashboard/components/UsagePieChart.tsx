"use client";

import { Monitor } from "lucide-react";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from "recharts";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle } from "@/app/ui";
import type { Bucket } from "@/app/dashboard/types";
import { DONUT_COLORS } from "@/app/dashboard/types";
import { formatNumber } from "@/app/dashboard/helpers";

export type UsagePieChartProps = {
    data: Bucket[];
    height?: string;
};

const tooltipStyle = {
    background: "var(--color-surface)",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    fontSize: 13,
};

export function UsagePieChart({ data, height = "h-48 w-48 sm:h-52 sm:w-52" }: UsagePieChartProps) {
    return (
        <AppCard>
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Uso da plataforma</AppCardTitle>
                <Monitor className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className="flex flex-col gap-4">
                {data.length === 0 ? (
                    <div className="flex h-48 items-center justify-center text-sm text-[var(--color-muted)]">
                        Sem dados.
                    </div>
                ) : (
                    <>
                        <div className={`mx-auto ${height}`}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        dataKey="count"
                                        nameKey="label"
                                        innerRadius="55%"
                                        outerRadius="85%"
                                        paddingAngle={3}
                                    >
                                        {data.map((_, idx) => (
                                            <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number | undefined) => `${formatNumber(Number(value ?? 0))} motivos`}
                                        contentStyle={tooltipStyle}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-[var(--color-muted-strong)]">
                            {data.map((item, idx) => (
                                <span key={item.label} className="flex items-center gap-1.5">
                                    <span
                                        className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                                    />
                                    {item.label} ({(item.share * 100).toFixed(1)}%)
                                </span>
                            ))}
                        </div>
                    </>
                )}
            </AppCardBody>
        </AppCard>
    );
}
