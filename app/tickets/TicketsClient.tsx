"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import cidadesPi from "@/data/cidades_pi.json";
import type { TicketClient } from "@/app/tickets/types";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import { MOTIVOS_OPTIONS, getUnidadeHistoryStorageKey } from "@/app/tickets/constants";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppSelect,
  FilterModal,
} from "@/app/ui";
import {
  buildTicketsFilename,
  exportToCSV,
  exportToXLSX,
  mapToExportRow,
} from "@/utils/exportTickets";
import { createClient } from "@/lib/supabase/client";
import { TicketCreateForm } from "@/app/tickets/components/TicketCreateForm";
import { TicketsDataTable } from "@/app/tickets/components/TicketsDataTable";
import { TicketEditModal } from "@/app/tickets/components/TicketEditModal";

type TicketsClientProps = {
  currentUserId: string;
  currentUserName: string;
  tickets: TicketClient[];
  filters: { period: string; motivo: string };
  pagination: {
    page: number;
    totalPages: number;
    prevHref?: string;
    nextHref?: string;
  };
  status?: string;
  error?: string;
};

export default function TicketsClient({
  currentUserId,
  currentUserName,
  tickets,
  filters,
  pagination,
  status,
  error,
}: TicketsClientProps) {
  const { notify } = useAlerts();
  const supabase = useMemo(() => createClient(), []);
  const [editTicket, setEditTicket] = useState<TicketClient | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersFormRef = useRef<HTMLFormElement | null>(null);
  const lastNotifiedStatusRef = useRef<string | null>(null);

  const unidadeStorageKey = useMemo(
    () => getUnidadeHistoryStorageKey(currentUserId),
    [currentUserId],
  );

  /* ── Unidade suggestions (shared between create & edit) ── */
  const [unidadeSuggestions, setUnidadeSuggestions] = useState<string[]>([]);

  const mergeUnidadeSuggestions = useCallback(
    (incoming: Array<string | null | undefined>) => {
      const unique = new Set<string>();
      incoming.forEach((item) => {
        const v = (item ?? "").trim();
        if (v) unique.add(v);
      });
      return Array.from(unique).slice(0, 20);
    },
    [],
  );

  useEffect(() => {
    const load = async () => {
      let localHistory: string[] = [];
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(unidadeStorageKey);
        if (stored) {
          try {
            localHistory = JSON.parse(stored) as string[];
          } catch {
            localHistory = [];
          }
        }
      }
      const { data } = await supabase
        .from("tickets")
        .select("unidade")
        .not("unidade", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);
      const dbSuggestions = (data ?? []).map((i) => i.unidade as string | null);
      setUnidadeSuggestions(mergeUnidadeSuggestions([...localHistory, ...dbSuggestions]));
    };
    void load();
  }, [mergeUnidadeSuggestions, supabase, unidadeStorageKey]);

  const rememberUnidade = useCallback(
    (rawUnidade: string) => {
      if (!rawUnidade.trim()) return;
      if (typeof window === "undefined") return;
      const current = window.localStorage.getItem(unidadeStorageKey);
      const parsed = current ? (JSON.parse(current) as string[]) : [];
      const next = mergeUnidadeSuggestions([rawUnidade, ...parsed]);
      window.localStorage.setItem(unidadeStorageKey, JSON.stringify(next));
      setUnidadeSuggestions((prev) => mergeUnidadeSuggestions([rawUnidade, ...prev]));
    },
    [mergeUnidadeSuggestions, unidadeStorageKey],
  );

  /* ── Status toast notifications ─────────────────────── */

  useEffect(() => {
    if (!status || lastNotifiedStatusRef.current === status) return;
    lastNotifiedStatusRef.current = status;
    if (status === "created") {
      notify({
        title: "Chamado criado",
        description: "Ticket registrado com sucesso.",
        tone: "success",
      });
    }
    if (status === "updated") {
      notify({
        title: "Chamado atualizado",
        description: "As alterações foram salvas.",
        tone: "success",
      });
    }
  }, [status, notify]);

  /* ── Export ──────────────────────────────────────────── */

  const handleExport = (type: "csv" | "xlsx") => {
    const rows = tickets.map(mapToExportRow);
    if (rows.length === 0) return;
    const filename = buildTicketsFilename(filters, type);
    if (type === "csv") {
      exportToCSV(rows, filename);
    } else {
      exportToXLSX(rows, filename);
    }
    notify({
      title: "Exportação concluída",
      description: `Arquivo ${type.toUpperCase()} gerado.`,
      tone: "success",
    });
  };

  const handleFilterSubmit = () => {
    filtersFormRef.current?.requestSubmit();
  };

  /* ── Render ──────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Create form — self-contained */}
      <TicketCreateForm
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        error={error}
      />

      {/* Tickets list card */}
      <AppCard>
        <AppCardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <AppCardTitle className="text-base">Últimos chamados</AppCardTitle>
              <AppBadge tone="default" variant="soft" size="sm">
                {tickets.length} registros
              </AppBadge>
            </div>
            <AppCardDescription>
              Histórico recente de chamados registrados.
            </AppCardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FilterModal
              isOpen={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
              title="Filtros"
              description="Filtre os chamados por periodo e motivo."
              onApply={handleFilterSubmit}
              size="md"
            >
              <form
                ref={filtersFormRef}
                method="get"
                className="grid gap-3 sm:grid-cols-2"
              >
                <AppSelect
                  name="period"
                  label="Periodo"
                  defaultValue={filters.period}
                  options={[
                    { value: "7", label: "7 dias" },
                    { value: "30", label: "30 dias" },
                    { value: "90", label: "90 dias" },
                  ]}
                />
                <AppSelect
                  name="motivo"
                  label="Motivo"
                  placeholder="Todos"
                  defaultValue={filters.motivo === "all" ? "" : filters.motivo}
                  options={MOTIVOS_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </form>
            </FilterModal>
            <div className="flex items-center gap-2">
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onPress={() => handleExport("csv")}
                isDisabled={tickets.length === 0}
              >
                Exportar CSV
              </AppButton>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                onPress={() => handleExport("xlsx")}
                isDisabled={tickets.length === 0}
              >
                Exportar XLSX
              </AppButton>
            </div>
          </div>
        </AppCardHeader>
        <AppCardBody>
          <TicketsDataTable
            tickets={tickets}
            pagination={pagination}
            onEdit={(ticket) => setEditTicket(ticket)}
          />
        </AppCardBody>
      </AppCard>

      {/* Edit modal — self-contained */}
      {editTicket ? (
        <TicketEditModal
          ticket={editTicket}
          onClose={() => setEditTicket(null)}
          rememberUnidade={rememberUnidade}
          unidadeSuggestions={unidadeSuggestions}
        />
      ) : null}
    </div>
  );
}
