"use client";

import { useMemo, useState } from "react";
import { createTicketContainerAction } from "@/app/tickets/actions-motivos";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppCardTitle,
  AppInput,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableColumn,
  AppTableHeader,
  AppTableRow,
  FormCard,
  PageHeader,
} from "@/app/ui";
import type { TicketListItem } from "@/app/tickets/page";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

type Props = {
  tickets: TicketListItem[];
  currentUserName: string;
  error?: string;
};

export default function TicketsListClient({ tickets, currentUserName, error }: Props) {
  const [retroativo, setRetroativo] = useState(false);
  const [retroativoMotivo, setRetroativoMotivo] = useState("");
  const [dataAtendimento, setDataAtendimento] = useState("");

  const canSubmit = useMemo(() => {
    if (retroativo && !retroativoMotivo.trim()) return false;
    return true;
  }, [retroativo, retroativoMotivo]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tickets"
        subtitle="Ticket é container; os motivos são os chamados que contam."
        className="flex items-center justify-between"
      />
      <AppBadge variant="soft" tone="default">
        {currentUserName}
      </AppBadge>

      {error ? (
        <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] p-3 text-sm text-[var(--color-danger)]">
          Não foi possível criar o ticket. Rode as migrations do Supabase e tente novamente.
        </div>
      ) : null}

      <FormCard
        title="Novo ticket"
        description="Cria apenas o container. Os motivos são adicionados depois (deduplicação por cliente)."
        footer={
          <div className="flex justify-end">
            <AppButton type="submit" form="create-ticket-container" isDisabled={!canSubmit}>
              Criar container
            </AppButton>
          </div>
        }
      >
        <form
          id="create-ticket-container"
          action={createTicketContainerAction}
          className="grid gap-4 md:grid-cols-2"
        >
          <AppInput
            label="Data de atendimento (opcional)"
            name="data_atendimento"
            type="date"
            value={dataAtendimento}
            onChange={(event) => setDataAtendimento(event.target.value)}
          />
          <div className="md:col-span-2 grid gap-3">
            <label className="text-sm font-medium text-[var(--color-text)]">
              <input
                type="checkbox"
                name="retroativo"
                value="true"
                checked={retroativo}
                onChange={(event) => setRetroativo(event.target.checked)}
                className="mr-2"
              />
              Retroativo
            </label>
            {retroativo ? (
              <AppInput
                label="Motivo do retroativo"
                name="retroativo_motivo"
                value={retroativoMotivo}
                onChange={(event) => setRetroativoMotivo(event.target.value)}
                isRequired
              />
            ) : null}
          </div>
        </form>
      </FormCard>

      <AppCard>
        <AppCardHeader>
          <AppCardTitle className="text-base">Tickets recentes</AppCardTitle>
        </AppCardHeader>
        <AppCardBody>
          <AppTable aria-label="Tickets">
            <AppTableHeader>
              <AppTableColumn>ID</AppTableColumn>
              <AppTableColumn>Cliente</AppTableColumn>
              <AppTableColumn>Última atualização</AppTableColumn>
              <AppTableColumn>Motivos</AppTableColumn>
              <AppTableColumn>Último motivo</AppTableColumn>
              <AppTableColumn>Criado em</AppTableColumn>
              <AppTableColumn>Ações</AppTableColumn>
            </AppTableHeader>
            <AppTableBody emptyContent="Nenhum ticket. Crie o primeiro.">
              {tickets.map((ticket) => (
                <AppTableRow key={ticket.id}>
                  <AppTableCell>#{ticket.id}</AppTableCell>
                  <AppTableCell>
                    {ticket.cliente_nome ? (
                      ticket.cliente_nome
                    ) : (
                      <AppBadge tone="danger" variant="soft">
                        — sem cliente
                      </AppBadge>
                    )}
                  </AppTableCell>
                  <AppTableCell>{formatDateTime(ticket.updated_at)}</AppTableCell>
                  <AppTableCell>
                    <AppBadge tone="primary" variant="soft">
                      {ticket.motivos_count}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell className="max-w-xs truncate">
                    {ticket.ultimo_motivo ?? "—"}
                  </AppTableCell>
                  <AppTableCell>{formatDate(ticket.created_at)}</AppTableCell>
                  <AppTableCell>
                    <a
                      href={`/tickets/${ticket.id}`}
                      className="text-[var(--color-primary)] hover:underline text-sm font-medium"
                    >
                      Abrir
                    </a>
                  </AppTableCell>
                </AppTableRow>
              ))}
            </AppTableBody>
          </AppTable>
        </AppCardBody>
      </AppCard>
    </div>
  );
}

