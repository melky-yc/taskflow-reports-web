"use client";

import { useCallback, useEffect, useState } from "react";
import {
    AppButton,
    AppTable,
    AppTableBody,
    AppTableCell,
    AppTableColumn,
    AppTableHeader,
    AppTableRow,
    Section,
    StatusBadge,
} from "@/app/ui";
import {
    type ReportOcorrencia,
    REPORT_COLUMNS,
    COLUMN_STORAGE_KEY,
    ocorrenciaCellValue,
} from "@/utils/exportReportsV2";

export type ReportsDataTableProps = {
    rows: ReportOcorrencia[];
    totalCount: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
};

function loadVisibleColumns(): Set<string> {
    if (typeof window === "undefined") {
        return new Set(REPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
    }
    const stored = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (stored) {
        try {
            return new Set(JSON.parse(stored) as string[]);
        } catch { /* fallback */ }
    }
    return new Set(REPORT_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
}

export function ReportsDataTable({ rows, totalCount, page, pageSize, onPageChange }: ReportsDataTableProps) {
    const [visibleCols, setVisibleCols] = useState(() => loadVisibleColumns());
    const [showConfig, setShowConfig] = useState(false);

    useEffect(() => {
        localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(visibleCols)));
    }, [visibleCols]);

    const toggleColumn = useCallback((key: string) => {
        setVisibleCols((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    }, []);

    const activeCols = REPORT_COLUMNS.filter((c) => visibleCols.has(c.key));
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    return (
        <Section
            title={`Ocorrências (${totalCount.toLocaleString("pt-BR")})`}
            showDivider={false}
            aside={
                <AppButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowConfig(!showConfig)}
                >
                    {showConfig ? "Fechar colunas" : "Configurar colunas"}
                </AppButton>
            }
        >
            {showConfig && (
                <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] p-3">
                    <div className="text-xs font-medium text-[var(--color-muted)] mb-2">
                        Marque as colunas visíveis:
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {REPORT_COLUMNS.map((col) => (
                            <label
                                key={col.key}
                                className="inline-flex items-center gap-1.5 cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-muted-strong)] transition-colors hover:bg-[var(--color-muted-soft)]"
                            >
                                <input
                                    type="checkbox"
                                    checked={visibleCols.has(col.key)}
                                    onChange={() => toggleColumn(col.key)}
                                    className="accent-[var(--color-primary)]"
                                />
                                {col.label}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <AppTable
                aria-label="Ocorrências"
                stickyHeader
                classNames={{ base: "overflow-x-auto", table: "min-w-[960px]" }}
            >
                <AppTableHeader>
                    {activeCols.map((col) => (
                        <AppTableColumn key={col.key}>{col.label}</AppTableColumn>
                    ))}
                </AppTableHeader>
                <AppTableBody>
                    {rows.map((row) => (
                        <AppTableRow key={row.motivo_id}>
                            {activeCols.map((col) => (
                                <AppTableCell key={col.key}>
                                    {col.key === "prioridade" ? (
                                        <StatusBadge status={row.prioridade} size="sm" />
                                    ) : (
                                        ocorrenciaCellValue(row, col.key)
                                    )}
                                </AppTableCell>
                            ))}
                        </AppTableRow>
                    ))}
                </AppTableBody>
            </AppTable>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-[var(--color-muted)]">
                        Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <AppButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            isDisabled={page <= 1}
                            onPress={() => onPageChange(page - 1)}
                        >
                            Anterior
                        </AppButton>
                        <AppButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            isDisabled={page >= totalPages}
                            onPress={() => onPageChange(page + 1)}
                        >
                            Próxima
                        </AppButton>
                    </div>
                </div>
            )}
        </Section>
    );
}
