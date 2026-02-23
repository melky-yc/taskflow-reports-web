"use client";

import { BarChart3 } from "lucide-react";
import {
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    BarChart,
    Bar,
    LabelList,
} from "recharts";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle } from "@/app/ui";
import type { Bucket } from "@/app/dashboard/types";
import { formatNumber } from "@/app/dashboard/helpers";

export type UnidadeBarChartProps = {
    data: Bucket[];
    maxItems?: number;
    height?: string;
};

const tooltipStyle = {
    background: "var(--color-surface)",
    borderRadius: 12,
    border: "1px solid var(--color-border)",
    fontSize: 13,
};

type LabelProps = {
    x?: string | number;
    y?: string | number;
    value?: number;
    payload?: Bucket;
};

export function UnidadeBarChart({
    data,
    maxItems = 6,
    height = "h-72 sm:h-80 lg:h-96",
}: UnidadeBarChartProps) {
    const sliced = data.slice(0, maxItems);

    return (
        <AppCard className="lg:col-span-2">
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Motivos por unidade</AppCardTitle>
                <BarChart3 className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className={`${height} min-h-0 min-w-0`}>
                {sliced.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--color-muted)]">
                        Sem dados.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={sliced}
                            layout="vertical"
                            margin={{ left: 4, right: 12, top: 4, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-track)" />
                            <XAxis
                                type="number"
                                stroke="var(--color-muted)"
                                allowDecimals={false}
                                tick={{ fontSize: 10 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="label"
                                width={120}
                                tick={{ fontSize: 11 }}
                                stroke="var(--color-muted)"
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => `${formatNumber(Number(value ?? 0))} motivos`}
                                contentStyle={tooltipStyle}
                            />
                            <Bar
                                dataKey="count"
                                fill="var(--color-primary)"
                                radius={[6, 6, 6, 6]}
                                barSize={16}
                            >
                                <LabelList
                                    dataKey="count"
                                    position="right"
                                    content={((props: LabelProps) => {
                                        if (!props || typeof props.value === "undefined") return null;
                                        const share = props?.payload?.share ?? 0;
                                        return (
                                            <text
                                                x={Number(props.x)}
                                                y={Number(props.y)}
                                                dy={4}
                                                fill="var(--color-text)"
                                                fontSize={11}
                                            >
                                                {`${props.value} (${(share * 100).toFixed(1)}%)`}
                                            </text>
                                        );
                                    }) as never}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </AppCardBody>
        </AppCard>
    );
}
