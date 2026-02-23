"use client";

import { Activity, Loader2 } from "lucide-react";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle, AppBadge } from "@/app/ui";
import type { AppBadgeTone } from "@/app/ui/badge";
import type { RecentMotivo } from "@/app/dashboard/types";
import { formatRelative } from "@/app/dashboard/helpers";

export type RecentMotivosTableProps = {
    recent: RecentMotivo[];
    loading: boolean;
};

function priorityTone(prioridade: string | null): AppBadgeTone {
    if (prioridade?.toLowerCase() === "alta") return "danger";
    if (prioridade?.toLowerCase() === "media") return "warning";
    return "primary";
}

export function RecentMotivosTable({ recent, loading }: RecentMotivosTableProps) {
    return (
        <AppCard className="lg:col-span-2">
            <AppCardHeader className="flex flex-row items-center justify-between">
                <AppCardTitle className="text-base sm:text-lg">Motivos recentes</AppCardTitle>
                <div className="flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted)]" />
                    ) : null}
                    <Activity className="h-4 w-4 text-[var(--color-muted)]" />
                </div>
            </AppCardHeader>
            <AppCardBody className="p-0 sm:p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[580px] text-sm">
                        <thead>
                            <tr className="border-b border-[var(--color-border)] text-left text-xs text-[var(--color-muted)]">
                                <th className="px-4 py-2.5 font-medium">Cliente</th>
                                <th className="hidden sm:table-cell px-4 py-2.5 font-medium">Unidade</th>
                                <th className="px-4 py-2.5 font-medium">Motivo</th>
                                <th className="px-4 py-2.5 font-medium">Quando</th>
                                <th className="px-4 py-2.5 font-medium">Prioridade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recent.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-muted)]">
                                        Sem motivos no período.
                                    </td>
                                </tr>
                            ) : null}
                            {recent.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-b border-[var(--color-border)] last:border-0 transition-colors hover:bg-[var(--color-muted-soft)]/50"
                                >
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[10px] sm:text-xs font-semibold">
                                                {row.cliente.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="truncate font-medium text-[var(--color-text)] max-w-[120px] sm:max-w-none">
                                                    {row.cliente}
                                                </div>
                                                <div className="text-[10px] text-[var(--color-muted)]">
                                                    #{row.id}
                                                    {row.internal ? " • interno" : ""}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 py-2.5 text-[var(--color-muted)]">
                                        {row.unidade ?? "—"}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="line-clamp-1">{row.motivo ?? "—"}</span>
                                    </td>
                                    <td className="px-4 py-2.5 whitespace-nowrap text-[var(--color-muted)]">
                                        {formatRelative(row.created_at)}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <AppBadge tone={priorityTone(row.prioridade)}>
                                            {row.prioridade ?? "-"}
                                        </AppBadge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </AppCardBody>
        </AppCard>
    );
}
