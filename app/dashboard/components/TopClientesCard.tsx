"use client";

import { Users } from "lucide-react";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle, AppBadge } from "@/app/ui";
import type { Bucket } from "@/app/dashboard/types";
import { formatNumber } from "@/app/dashboard/helpers";

export type TopClientesCardProps = {
    clients: Bucket[];
    maxItems?: number;
};

export function TopClientesCard({ clients, maxItems = 10 }: TopClientesCardProps) {
    const items = clients.slice(0, maxItems);

    return (
        <AppCard>
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Top clientes</AppCardTitle>
                <Users className="h-4 w-4 text-[var(--color-muted)]" />
            </AppCardHeader>
            <AppCardBody className="space-y-2 sm:space-y-3">
                {items.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[var(--color-muted)]">Sem dados.</div>
                ) : (
                    items.map((client, idx) => (
                        <div
                            key={client.label}
                            className="flex items-center justify-between gap-2 rounded-lg bg-[var(--color-muted-soft)] px-2.5 py-1.5 sm:px-3 sm:py-2"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-xs sm:text-sm font-semibold">
                                    #{idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-sm font-medium text-[var(--color-text)]">
                                        {client.label}
                                    </div>
                                    <div className="text-[10px] sm:text-xs text-[var(--color-muted)]">
                                        {(client.share * 100).toFixed(1)}% do total
                                    </div>
                                </div>
                            </div>
                            <AppBadge tone="primary" variant="soft">
                                {formatNumber(client.count)}
                            </AppBadge>
                        </div>
                    ))
                )}
            </AppCardBody>
        </AppCard>
    );
}
