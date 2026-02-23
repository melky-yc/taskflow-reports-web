"use client";

import { formatPrioridadeLabel } from "@/app/tickets/constants";
import { MOTIVO_STATUS_LABEL, type MotivoStatusOption } from "@/app/tickets/constants";
import { priorityTone } from "@/app/reports/helpers";
import {
    AppBadge,
    AppCard,
    AppCardBody,
} from "@/app/ui";
import type { AppBadgeTone } from "@/app/ui/badge";
import type { ReportSummaryV2, LabelCount } from "@/utils/exportReportsV2";

/** Guarantees a finite number — never NaN, never Infinity */
function safeNum(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

export type ReportsSummaryPanelProps = {
    summary: ReportSummaryV2;
    segmentLabel: string;
};

function statusTone(status: string): AppBadgeTone {
    const map: Record<string, AppBadgeTone> = {
        ABERTO: "default",
        EM_ANDAMENTO: "warning",
        AGUARDANDO: "primary",
        RESOLVIDO: "success",
        CANCELADO: "danger",
    };
    return map[status] ?? "default";
}

function RankingList({ items, emptyText = "Sem dados" }: { items: LabelCount[]; emptyText?: string }) {
    if (items.length === 0) return <span className="text-[var(--color-muted)]">{emptyText}</span>;
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={item.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-[var(--color-muted-strong)]">
                        <span className="w-5 text-right text-xs text-[var(--color-muted)]">{i + 1}.</span>
                        {item.label}
                    </span>
                    <span className="font-medium text-[var(--color-text)]">{safeNum(item.count)}</span>
                </div>
            ))}
        </div>
    );
}

export function ReportsSummaryPanel({ summary, segmentLabel }: ReportsSummaryPanelProps) {
    const totalOc = safeNum(summary.total_ocorrencias);
    const totalRetro = safeNum(summary.retroativos);
    const retroPercent = totalOc > 0
        ? `${((totalRetro / totalOc) * 100).toFixed(1)}%`
        : "0%";

    return (
        <>
            {/* KPIs */}
            <div className="grid gap-4 md:gap-6 md:grid-cols-4">
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-xs font-medium text-[var(--color-muted)]">Ocorrências</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                            {totalOc.toLocaleString("pt-BR")}
                        </div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-xs font-medium text-[var(--color-muted)]">Tickets únicos</div>
                        <div className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                            {safeNum(summary.total_tickets_unicos).toLocaleString("pt-BR")}
                        </div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-xs font-medium text-[var(--color-muted)]">Retroativos</div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-semibold text-[var(--color-text)]">{retroPercent}</span>
                            <span className="text-sm text-[var(--color-muted)]">({totalRetro})</span>
                        </div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-xs font-medium text-[var(--color-muted)]">Segmentação</div>
                        <div className="mt-2 text-sm font-semibold text-[var(--color-text)]">{segmentLabel}</div>
                    </AppCardBody>
                </AppCard>
            </div>

            {/* Distributions */}
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Distribuição por status</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                            {summary.por_status.map((s) => (
                                <div key={s.label} className="flex items-center justify-between">
                                    <span>{MOTIVO_STATUS_LABEL[s.label as MotivoStatusOption] ?? s.label}</span>
                                    <AppBadge tone={statusTone(s.label)} variant="soft" size="sm">
                                        {safeNum(s.count)}
                                    </AppBadge>
                                </div>
                            ))}
                        </div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Distribuição por prioridade</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                            {summary.por_prioridade.map((p) => (
                                <div key={p.label} className="flex items-center justify-between">
                                    <span>{formatPrioridadeLabel(p.label)}</span>
                                    <AppBadge tone={priorityTone(p.label)} variant="soft" size="sm">
                                        {safeNum(p.count)}
                                    </AppBadge>
                                </div>
                            ))}
                        </div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Uso da plataforma</div>
                        <div className="mt-3 space-y-2 text-sm text-[var(--color-muted-strong)]">
                            {summary.por_uso_plataforma.map((u) => (
                                <div key={u.label} className="flex items-center justify-between">
                                    <span>{u.label}</span>
                                    <span className="font-medium text-[var(--color-text)]">{safeNum(u.count)}</span>
                                </div>
                            ))}
                        </div>
                    </AppCardBody>
                </AppCard>
            </div>

            {/* Rankings */}
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Top 10 motivos</div>
                        <div className="mt-3"><RankingList items={summary.top_motivos} /></div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Top 10 unidades</div>
                        <div className="mt-3"><RankingList items={summary.top_unidades} /></div>
                    </AppCardBody>
                </AppCard>
                <AppCard>
                    <AppCardBody className="p-4 md:p-6">
                        <div className="text-sm font-semibold text-[var(--color-text)]">Ranking profissionais</div>
                        <div className="mt-3"><RankingList items={summary.ranking_profissionais} /></div>
                    </AppCardBody>
                </AppCard>
            </div>
        </>
    );
}
