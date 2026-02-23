"use client";

import { Clock3 } from "lucide-react";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle } from "@/app/ui";

export type ExecutiveSummaryCardProps = {
    summary: string[];
};

export function ExecutiveSummaryCard({ summary }: ExecutiveSummaryCardProps) {
    const items = summary.length > 0 ? summary.slice(0, 3) : ["Sem dados no período."];

    return (
        <AppCard>
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Resumo executivo</AppCardTitle>
                <Clock3 className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className="flex flex-col gap-2">
                {items.map((text) => (
                    <div
                        key={text}
                        className="rounded-lg bg-[var(--color-muted-soft)] px-3 py-2 text-xs sm:text-sm text-[var(--color-text)] leading-relaxed"
                    >
                        {text}
                    </div>
                ))}
            </AppCardBody>
        </AppCard>
    );
}
