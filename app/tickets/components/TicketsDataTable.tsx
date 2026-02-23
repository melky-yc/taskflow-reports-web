"use client";

import { Inbox } from "lucide-react";
import type { TicketClient } from "@/app/tickets/types";
import { maskCpf, formatDate, formatDateTime, motivoTone } from "@/app/tickets/helpers";
import { formatUnidade } from "@/utils/unidade";
import {
    AppBadge,
    AppButton,
    AppTable,
    AppTableBody,
    AppTableCell,
    AppTableColumn,
    AppTableHeader,
    AppTableRow,
    StatusBadge,
} from "@/app/ui";

export type TicketsDataTableProps = {
    tickets: TicketClient[];
    pagination: {
        page: number;
        totalPages: number;
        prevHref?: string;
        nextHref?: string;
    };
    onEdit: (ticket: TicketClient) => void;
};

export function TicketsDataTable({
    tickets,
    pagination,
    onEdit,
}: TicketsDataTableProps) {
    return (
        <>
            <AppTable
                aria-label="Tabela de chamados"
                stickyHeader
                classNames={{ base: "overflow-x-auto", table: "min-w-[980px]" }}
            >
                <AppTableHeader>
                    <AppTableColumn>ID</AppTableColumn>
                    <AppTableColumn>Data</AppTableColumn>
                    <AppTableColumn>Profissional</AppTableColumn>
                    <AppTableColumn>Motivo</AppTableColumn>
                    <AppTableColumn>Prioridade</AppTableColumn>
                    <AppTableColumn>Cliente</AppTableColumn>
                    <AppTableColumn>CPF</AppTableColumn>
                    <AppTableColumn>Unidade afetada</AppTableColumn>
                    <AppTableColumn>Criado em</AppTableColumn>
                    <AppTableColumn className="text-right">Ações</AppTableColumn>
                </AppTableHeader>
                <AppTableBody>
                    {tickets.length === 0 ? (
                        <AppTableRow>
                            <AppTableCell colSpan={10} className="px-6 py-14">
                                <div className="flex flex-col items-center gap-3 text-[var(--color-muted)]">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted-soft)]">
                                        <Inbox className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm font-medium">
                                        Nenhum chamado encontrado
                                    </div>
                                    <div className="text-xs text-[var(--color-muted)]">
                                        Ajuste os filtros ou crie um novo chamado.
                                    </div>
                                </div>
                            </AppTableCell>
                        </AppTableRow>
                    ) : (
                        tickets.map((ticket) => (
                            <AppTableRow key={ticket.id}>
                                <AppTableCell className="font-medium">#{ticket.id}</AppTableCell>
                                <AppTableCell>
                                    {formatDate(ticket.data_atendimento)}
                                </AppTableCell>
                                <AppTableCell>{ticket.profissional_nome}</AppTableCell>
                                <AppTableCell>
                                    <AppBadge tone={motivoTone(ticket.motivo)} variant="soft" size="sm">
                                        {ticket.motivo}
                                    </AppBadge>
                                </AppTableCell>
                                <AppTableCell>
                                    <StatusBadge status={ticket.prioridade} size="sm" />
                                </AppTableCell>
                                <AppTableCell>{ticket.client.nome}</AppTableCell>
                                <AppTableCell className="font-mono text-xs">
                                    {maskCpf(ticket.client.cpf)}
                                </AppTableCell>
                                <AppTableCell>{formatUnidade(ticket.unidade)}</AppTableCell>
                                <AppTableCell>
                                    {formatDateTime(ticket.created_at)}
                                </AppTableCell>
                                <AppTableCell className="text-right">
                                    <AppButton
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onPress={() => onEdit(ticket)}
                                    >
                                        Editar
                                    </AppButton>
                                </AppTableCell>
                            </AppTableRow>
                        ))
                    )}
                </AppTableBody>
            </AppTable>

            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-muted-strong)] sm:flex-row sm:items-center sm:justify-between">
                <div>
                    Página {pagination.page} de {pagination.totalPages}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    {pagination.prevHref ? (
                        <a
                            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-muted-soft)]"
                            href={pagination.prevHref}
                        >
                            Anterior
                        </a>
                    ) : (
                        <span className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] opacity-60">
                            Anterior
                        </span>
                    )}
                    {pagination.nextHref ? (
                        <a
                            className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] hover:bg-[var(--color-muted-soft)]"
                            href={pagination.nextHref}
                        >
                            Próxima
                        </a>
                    ) : (
                        <span className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] opacity-60">
                            Próxima
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}
