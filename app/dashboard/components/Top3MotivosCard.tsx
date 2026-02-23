"use client";

import { BarChart3 } from "lucide-react";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle } from "@/app/ui";
import type { Bucket } from "@/app/dashboard/types";
import { formatNumber } from "@/app/dashboard/helpers";

export type Top3MotivosCardProps = {
    items: Bucket[];
};

export function Top3MotivosCard({ items }: Top3MotivosCardProps) {
    if (items.length === 0) return null;

    const maxCount = items[0].count || 1;

    return (
        <AppCard>
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Top 3 Motivos</AppCardTitle>
                <BarChart3 className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className="space-y-3 sm:space-y-4">
                {items.map((item, idx) => (
                    <div key={item.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                            <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--color-text)]">
                                <span className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[10px] sm:text-xs font-bold text-[var(--color-primary)]">
                                    {idx + 1}
                                </span>
                                <span className="truncate">{item.label}</span>
                            </span>
                            <span className="shrink-0 text-[var(--color-muted)]">
                                {formatNumber(item.count)} · {(item.share * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-[var(--color-muted-soft)]">
                            <div
                                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                                style={{
                                    width: `${(item.count / maxCount) * 100}%`,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </AppCardBody>
        </AppCard>
    );
}
