"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Inbox } from "lucide-react";
import cidadesPi from "@/data/cidades_pi.json";
import { createTicketAction, updateTicketAction } from "@/app/tickets/actions";
import type { TicketClient } from "@/app/tickets/types";
import { createClient } from "@/lib/supabase/client";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import {
  AREA_ATUACAO_OPTIONS,
  formatPrioridadeLabel,
  getUnidadeHistoryStorageKey,
  MOTIVOS_OPTIONS,
  PRIORIDADES_OPTIONS,
  UNIDADE_AFETADA_HELPER,
  UNIDADE_AFETADA_LABEL,
  UNIDADE_MULTI_REQUIRED_HELPER,
  UNIDADE_SUGGESTIONS_LIST_ID,
  USO_PLATAFORMA_OPTIONS,
  UF_PADRAO,
} from "@/app/tickets/constants";
import { getTicketErrorMessage } from "@/app/tickets/error-messages";
import { getTodayLocalISODate } from "@/utils/date";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
  AppInput,
  AppModal,
  AppSelect,
  AppTextarea,
  AppAlert,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableColumn,
  AppTableHeader,
  AppTableRow,
  FilterModal,
  FormCard,
  PageHeader,
  Section,
  StatusBadge,
} from "@/app/ui";
import DatePickerModal from "@/components/tickets/DatePickerModal";
import {
  buildTicketsFilename,
  exportToCSV,
  exportToXLSX,
  mapToExportRow,
} from "@/utils/exportTickets";
import { formatUnidade } from "@/utils/unidade";

const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-pi";
const CREATE_FORM_ID = "create-ticket-form";
const EDIT_FORM_ID = "edit-ticket-form";

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

type EditFormState = {
  motivo: string;
  motivoOutro: string;
  prioridade: string;
  dataAtendimentoBr: string;
  dataAtendimentoIso: string;
  retroativoMotivo: string;
  clienteNome: string;
  clienteCpfDigits: string;
  clienteCidade: string;
  clienteEstado: string;
  clienteUsoPlataforma: string;
  clienteAreaAtuacao: string;
  clienteAreaAtuacaoOutro: string;
  clienteUnidade: string;
  clienteMultiUnidade: boolean;
};

function formatCpf(digits: string) {
  const clean = digits.replace(/\D/g, "").slice(0, 11);
  const part1 = clean.slice(0, 3);
  const part2 = clean.slice(3, 6);
  const part3 = clean.slice(6, 9);
  const part4 = clean.slice(9, 11);
  if (!clean) {
    return "";
  }
  if (clean.length <= 3) {
    return part1;
  }
  if (clean.length <= 6) {
    return `${part1}.${part2}`;
  }
  if (clean.length <= 9) {
    return `${part1}.${part2}.${part3}`;
  }
  return `${part1}.${part2}.${part3}-${part4}`;
}

function maskCpf(digits: string) {
  if (digits.length !== 11) {
    return digits;
  }
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatDate(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR").format(parseDateOnly(value));
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function isoToBr(value?: string | null) {
  if (!value) {
    return "";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}/${month}/${year}`;
}

function isRetroativoIso(dateValue: string) {
  if (!dateValue) {
    return false;
  }
  return dateValue < getTodayLocalISODate();
}

function motivoTone(motivo: string) {
  if (motivo === "Outro") return "warning";
  if (motivo.includes("Problema")) return "default";
  return "success";
}

function SubmitButton({
  disabled,
  formId,
}: {
  disabled: boolean;
  formId?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <AppButton
      type="submit"
      form={formId}
      isDisabled={disabled || pending}
      isLoading={pending}
    >
      Salvar chamado
    </AppButton>
  );
}

function UpdateButton({
  pending,
  formId,
}: {
  pending: boolean;
  formId: string;
}) {
  return (
    <AppButton
      type="submit"
      form={formId}
      isDisabled={pending}
      isLoading={pending}
    >
      Salvar alterações
    </AppButton>
  );
}

function EditPendingObserver({
  onPendingChange,
}: {
  onPendingChange: (pending: boolean) => void;
}) {
  const { pending } = useFormStatus();

  useEffect(() => {
    onPendingChange(pending);
  }, [onPendingChange, pending]);

  return null;
}

export default function TicketsClient({
  currentUserId,
  currentUserName,
  tickets,
  filters,
  pagination,
  status,
  error,
}: TicketsClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const { notify } = useAlerts();
  const [motivo, setMotivo] = useState("");
  const [motivoOutro, setMotivoOutro] = useState("");
  const [prioridade, setPrioridade] = useState("");
  const todayIso = useMemo(() => getTodayLocalISODate(), []);
  const [dataAtendimentoIso, setDataAtendimentoIso] = useState(todayIso);
  const [dataAtendimentoBr, setDataAtendimentoBr] = useState(() =>
    isoToBr(todayIso)
  );
  const [retroativoMotivo, setRetroativoMotivo] = useState("");
  const [cpfDigits, setCpfDigits] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCidade, setClienteCidade] = useState("");
  const [clienteEstado, setClienteEstado] = useState(UF_PADRAO);
  const [clienteUsoPlataforma, setClienteUsoPlataforma] = useState("");
  const [clienteAreaAtuacao, setClienteAreaAtuacao] = useState("");
  const [clienteAreaAtuacaoOutro, setClienteAreaAtuacaoOutro] = useState("");
  const [clienteUnidade, setClienteUnidade] = useState("");
  const [isClienteMultiUnidade, setIsClienteMultiUnidade] = useState(false);
  const [unidadeSuggestions, setUnidadeSuggestions] = useState<string[]>([]);
  const [isClientLocked, setIsClientLocked] = useState(false);
  const [cpfLookupState, setCpfLookupState] = useState<
    "idle" | "loading" | "found" | "not_found" | "error"
  >("idle");
  const [matchedClientId, setMatchedClientId] = useState<number | null>(null);
  const [isCreateValid, setIsCreateValid] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isEditPending, setIsEditPending] = useState(false);

  const createFormRef = useRef<HTMLFormElement | null>(null);
  const filtersFormRef = useRef<HTMLFormElement | null>(null);
  const lastLookupCpfRef = useRef("");
  const lastNotifiedStatusRef = useRef<string | null>(null);
  const unidadeStorageKey = useMemo(
    () => getUnidadeHistoryStorageKey(currentUserId),
    [currentUserId]
  );

  const mergeUnidadeSuggestions = useCallback((incoming: Array<string | null | undefined>) => {
    const unique = new Set<string>();
    incoming.forEach((item) => {
      const value = (item ?? "").trim();
      if (value) {
        unique.add(value);
      }
    });
    return Array.from(unique).slice(0, 20);
  }, []);

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
    [mergeUnidadeSuggestions, unidadeStorageKey]
  );

  const retroativo = useMemo(
    () => isRetroativoIso(dataAtendimentoIso),
    [dataAtendimentoIso]
  );

  const [editTicket, setEditTicket] = useState<TicketClient | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);

  const openEdit = (ticket: TicketClient) => {
    const dataAtendimentoIso = ticket.data_atendimento ?? "";
    setIsEditDateModalOpen(false);
    setEditTicket(ticket);
    setEditForm({
      motivo: ticket.motivo,
      motivoOutro: ticket.motivo_outro_descricao ?? "",
      prioridade: ticket.prioridade,
      dataAtendimentoBr: isoToBr(dataAtendimentoIso),
      dataAtendimentoIso,
      retroativoMotivo: ticket.retroativo_motivo ?? "",
      clienteNome: ticket.client.nome,
      clienteCpfDigits: ticket.client.cpf,
      clienteCidade: ticket.client.cidade,
      clienteEstado: ticket.client.estado_uf || UF_PADRAO,
      clienteUsoPlataforma:
        ticket.uso_plataforma ?? ticket.client.uso_plataforma ?? "",
      clienteAreaAtuacao: ticket.client.area_atuacao ?? "",
      clienteAreaAtuacaoOutro: "",
      clienteUnidade: ticket.unidade ?? ticket.client.unidade ?? "",
      clienteMultiUnidade: ticket.client.multi_unidade,
    });
  };

  const closeEdit = () => {
    setIsEditDateModalOpen(false);
    setEditTicket(null);
    setEditForm(null);
    setIsEditPending(false);
  };

  const editRetroativo = useMemo(
    () => (editForm ? isRetroativoIso(editForm.dataAtendimentoIso) : false),
    [editForm]
  );

  useEffect(() => {
    if (!status || lastNotifiedStatusRef.current === status) {
      return;
    }
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

  useEffect(() => {
    const loadUnidadeSuggestions = async () => {
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

      const dbSuggestions = (data ?? []).map((item) => item.unidade as string | null);
      setUnidadeSuggestions(mergeUnidadeSuggestions([...localHistory, ...dbSuggestions]));
    };

    void loadUnidadeSuggestions();
  }, [mergeUnidadeSuggestions, supabase, unidadeStorageKey]);

  const errorMessage = getTicketErrorMessage(error);

  const cpfDisplay = formatCpf(cpfDigits);

  const updateCreateValidity = useCallback((nextBr?: string, nextIso?: string) => {
    const form = createFormRef.current;
    if (!form) return;
    const isoValue = typeof nextIso === "string" ? nextIso : dataAtendimentoIso;
    // Avoid imperative validation side effects that can steal focus while typing.
    const hasInvalidControl = Boolean(form.querySelector(":invalid"));
    setIsCreateValid(!hasInvalidControl && Boolean(isoValue));
  }, [dataAtendimentoIso]);

  const handleCreateInput = () => {
    updateCreateValidity();
  };

  const handleCreateDateConfirm = (isoValue: string) => {
    setDataAtendimentoIso(isoValue);
    setDataAtendimentoBr(isoToBr(isoValue));
    updateCreateValidity(undefined, isoValue);
  };

  const resetClientFields = useCallback(() => {
    setClienteNome("");
    setClienteCidade("");
    setClienteEstado(UF_PADRAO);
    setClienteUsoPlataforma("");
    setClienteAreaAtuacao("");
    setClienteAreaAtuacaoOutro("");
    setClienteUnidade("");
    setIsClienteMultiUnidade(false);
  }, []);

  const applyClientData = useCallback((client: {
    nome?: string | null;
    cidade?: string | null;
    estado_uf?: string | null;
    uso_plataforma?: string | null;
    area_atuacao?: string | null;
    unidade?: string | null;
    multi_unidade?: boolean | null;
  }) => {
    const isMultiUnidadeClient = Boolean(client.multi_unidade);
    setClienteNome(client.nome ?? "");
    setClienteCidade(client.cidade ?? "");
    setClienteEstado((client.estado_uf ?? UF_PADRAO).toUpperCase());
    setClienteUsoPlataforma(client.uso_plataforma ?? "");
    setClienteAreaAtuacao(client.area_atuacao ?? "");
    setClienteAreaAtuacaoOutro("");
    setClienteUnidade(isMultiUnidadeClient ? "" : (client.unidade ?? ""));
    setIsClienteMultiUnidade(isMultiUnidadeClient);
  }, []);

  const handleCpfLookup = useCallback(
    async (cpfValue: string) => {
      if (cpfValue.length !== 11) {
        if (isClientLocked) {
          setIsClientLocked(false);
          setMatchedClientId(null);
          resetClientFields();
          updateCreateValidity();
        }
        setCpfLookupState("idle");
        return;
      }

      if (lastLookupCpfRef.current === cpfValue && cpfLookupState !== "error") {
        return;
      }

      lastLookupCpfRef.current = cpfValue;
      setCpfLookupState("loading");

      const { data, error: lookupError } = await supabase.rpc(
        "find_client_by_cpf",
        {
          cpf_param: cpfValue,
        }
      );

      if (lookupError) {
        setCpfLookupState("error");
        setIsClientLocked(false);
        setMatchedClientId(null);
        setIsClienteMultiUnidade(false);
        return;
      }

      const matchedClient = Array.isArray(data) ? data[0] : data;

      if (matchedClient?.id) {
        setMatchedClientId(matchedClient.id);
        setIsClientLocked(true);
        setCpfLookupState("found");
        applyClientData(matchedClient);
        window.setTimeout(() => updateCreateValidity(), 0);
        return;
      }

      if (isClientLocked) {
        resetClientFields();
      }
      setMatchedClientId(null);
      setIsClientLocked(false);
      setCpfLookupState("not_found");
      window.setTimeout(() => updateCreateValidity(), 0);
    },
    [
      applyClientData,
      cpfLookupState,
      isClientLocked,
      resetClientFields,
      supabase,
      updateCreateValidity,
    ]
  );

  const handleEditDateConfirm = (isoValue: string) => {
    setEditForm((prev) =>
      prev
        ? {
            ...prev,
            dataAtendimentoIso: isoValue,
            dataAtendimentoBr: isoToBr(isoValue),
          }
        : prev
    );
  };

  const handleExport = (type: "csv" | "xlsx") => {
    const rows = tickets.map(mapToExportRow);
    if (rows.length === 0) {
      return;
    }
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

  return (
    <div className="space-y-6">
      <div id="novo-chamado" className="space-y-4">
        <PageHeader
          title="Novo chamado"
          subtitle="Preencha os dados do cliente e do atendimento."
        />

        <FormCard
          footer={
            <div className="flex justify-end">
              <SubmitButton disabled={!isCreateValid} formId={CREATE_FORM_ID} />
            </div>
          }
        >
          <form
            id={CREATE_FORM_ID}
            ref={createFormRef}
            action={createTicketAction}
            className="space-y-6"
            onInput={handleCreateInput}
            onSubmit={() => rememberUnidade(clienteUnidade)}
          >
            {errorMessage ? (
              <AppAlert
                tone="danger"
                title="Não foi possível salvar"
                description={errorMessage}
              />
            ) : null}

            <Section
              title="Profissional"
              description="Usuário responsável pelo atendimento registrado."
              className="rounded-lg bg-[var(--color-muted-soft)] p-4"
              aside={
                <AppBadge tone="default" variant="soft" size="sm">
                  Autenticado
                </AppBadge>
              }
            >
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                <AppInput
                  label="E-mail"
                  isReadOnly
                  value={currentUserName}
                  className="bg-[var(--color-muted-soft)]"
                />
              </div>
            </Section>

            <Section
              title="Dados do Chamado"
              description="Defina o motivo, a prioridade e a data do atendimento."
            >
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AppSelect
                  name="motivo"
                  label="Motivo"
                  placeholder="Selecione"
                  value={motivo}
                  onValueChange={(value) => {
                    setMotivo(value);
                    if (value !== "Outro") {
                      setMotivoOutro("");
                    }
                    handleCreateInput();
                  }}
                  options={MOTIVOS_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                  isRequired
                />

                <AppSelect
                  name="prioridade"
                  label="Prioridade"
                  placeholder="Selecione"
                  value={prioridade}
                  onValueChange={(value) => {
                    setPrioridade(value);
                    handleCreateInput();
                  }}
                  options={PRIORIDADES_OPTIONS.map((item) => ({
                    value: item,
                    label: formatPrioridadeLabel(item),
                  }))}
                  isRequired
                />

                <div className="space-y-2">
                  <AppInput
                    label="Data de atendimento"
                    value={dataAtendimentoBr}
                    isReadOnly
                    isRequired
                    className="bg-[var(--color-muted-soft)]"
                    endContent={
                      <AppButton
                        type="button"
                        variant="ghost"
                        size="sm"
                        onPress={() => setIsDateModalOpen(true)}
                      >
                        Alterar
                      </AppButton>
                    }
                  />
                  <input
                    type="hidden"
                    name="data_atendimento"
                    value={dataAtendimentoIso}
                  />
                </div>
              </div>

              {motivo === "Outro" ? (
                <AppTextarea
                  label="Descrição do motivo (Outro)"
                  name="motivo_outro_descricao"
                  value={motivoOutro}
                  onChange={(event) => setMotivoOutro(event.target.value)}
                  isRequired
                />
              ) : null}

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      Retroativo
                    </div>
                    <div className="text-xs text-[var(--color-muted)]">
                      Chamados com data anterior a hoje exigem justificativa.
                    </div>
                  </div>
                  <AppBadge tone={retroativo ? "warning" : "success"} variant="soft" size="sm">
                    {retroativo ? "Retroativo" : "Normal"}
                  </AppBadge>
                </div>
                <div className="mt-3 text-xs text-[var(--color-muted-strong)]">
                  A data de atendimento define automaticamente se o chamado é retroativo.
                </div>
              </div>

              {retroativo ? (
                <AppTextarea
                  label="Motivo do retroativo"
                  name="retroativo_motivo"
                  value={retroativoMotivo}
                  onChange={(event) => setRetroativoMotivo(event.target.value)}
                  isRequired
                />
              ) : null}
            </Section>

            <Section
              title="Dados do Cliente"
              description="Informações cadastrais do cliente atendido."
            >
              <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <AppInput
                    label="CPF"
                    inputMode="numeric"
                    value={cpfDisplay}
                    onChange={(event) => {
                      const digits = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
                      setCpfDigits(digits);
                      if (digits.length === 11 || isClientLocked) {
                        handleCpfLookup(digits);
                      }
                    }}
                    onBlur={() => handleCpfLookup(cpfDigits)}
                    placeholder="000.000.000-00"
                    isRequired
                  />
                  <input type="hidden" name="cliente_cpf" value={cpfDigits} />
                  {matchedClientId ? (
                    <input type="hidden" name="client_id" value={matchedClientId} />
                  ) : null}
                  {cpfLookupState === "loading" ? (
                    <p className="text-xs text-[var(--color-muted)]">
                      Buscando cliente...
                    </p>
                  ) : null}
                  {cpfLookupState === "found" ? (
                    <p className="text-xs text-[var(--color-success)]">
                      Cliente encontrado. Dados preenchidos automaticamente.
                    </p>
                  ) : null}
                  {cpfLookupState === "not_found" ? (
                    <p className="text-xs text-[var(--color-muted)]">
                      Cliente não encontrado. Preencha os dados abaixo.
                    </p>
                  ) : null}
                  {cpfLookupState === "error" ? (
                    <p className="text-xs text-[var(--color-danger)]">
                      Não foi possível buscar o cliente agora.
                    </p>
                  ) : null}
                </div>

                <AppInput
                  label="Nome"
                  name="cliente_nome"
                  value={clienteNome}
                  onChange={(event) => setClienteNome(event.target.value)}
                  isReadOnly={isClientLocked}
                  className={isClientLocked ? "bg-[var(--color-muted-soft)]" : ""}
                  isRequired
                />

                <AppInput
                  label="Cidade"
                  name="cliente_cidade"
                  list={CIDADES_LIST_ID}
                  placeholder="Selecione a cidade"
                  value={clienteCidade}
                  onChange={(event) => setClienteCidade(event.target.value)}
                  isReadOnly={isClientLocked}
                  className={isClientLocked ? "bg-[var(--color-muted-soft)]" : ""}
                  isRequired
                />

                <AppInput
                  label="UF"
                  name="cliente_estado"
                  value={clienteEstado || UF_PADRAO}
                  isReadOnly
                  className="bg-[var(--color-muted-soft)]"
                  isRequired
                />

                <AppSelect
                  name="uso_plataforma"
                  label="Uso da plataforma"
                  placeholder="Selecione"
                  value={clienteUsoPlataforma}
                  onValueChange={(value) => {
                    setClienteUsoPlataforma(value);
                    handleCreateInput();
                  }}
                  options={USO_PLATAFORMA_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />

                <AppSelect
                  name="cliente_area_atuacao"
                  label="Área de atuação"
                  placeholder="Selecione"
                  value={clienteAreaAtuacao}
                  onValueChange={(value) => {
                    setClienteAreaAtuacao(value);
                    if (value !== "Outro") {
                      setClienteAreaAtuacaoOutro("");
                    }
                    handleCreateInput();
                  }}
                  isDisabled={isClientLocked}
                  options={AREA_ATUACAO_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                  isRequired
                />
                {clienteAreaAtuacao === "Outro" ? (
                  <div className="md:col-span-2 lg:col-span-3">
                    <AppInput
                      label="Descreva a área de atuação"
                      name="cliente_area_atuacao_outro"
                      value={clienteAreaAtuacaoOutro}
                      onChange={(event) =>
                        setClienteAreaAtuacaoOutro(event.target.value)
                      }
                      placeholder="Ex.: Agropecuária"
                      isRequired
                    />
                  </div>
                ) : null}
                {isClientLocked ? (
                  <input
                    type="hidden"
                    name="cliente_area_atuacao"
                    value={clienteAreaAtuacao}
                  />
                ) : null}

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <AppInput
                    label={UNIDADE_AFETADA_LABEL}
                    name="ticket_unidade"
                    value={clienteUnidade}
                    onChange={(event) => setClienteUnidade(event.target.value)}
                    list={UNIDADE_SUGGESTIONS_LIST_ID}
                    isRequired={isClienteMultiUnidade}
                    placeholder="Informe a unidade afetada"
                    helperText={
                      isClienteMultiUnidade
                        ? UNIDADE_MULTI_REQUIRED_HELPER
                        : UNIDADE_AFETADA_HELPER
                    }
                  />
                  {isClienteMultiUnidade ? (
                    <p className="text-xs font-medium text-[var(--color-warning)]">
                      Obrigatório para este cliente.
                    </p>
                  ) : null}
                </div>
              </div>
            </Section>
          </form>

          {isDateModalOpen ? (
            <DatePickerModal
              title="Alterar data de atendimento"
              valueIso={dataAtendimentoIso}
              maxIso={todayIso}
              onCancel={() => setIsDateModalOpen(false)}
              onConfirm={(valueIso) => {
                handleCreateDateConfirm(valueIso || todayIso);
                setIsDateModalOpen(false);
              }}
            />
          ) : null}
        </FormCard>
      </div>

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
                        onPress={() => openEdit(ticket)}
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
        </AppCardBody>
      </AppCard>

      {editTicket && editForm ? (
        <AppModal
          isOpen
          onOpenChange={(open) => {
            if (!open) {
              closeEdit();
            }
          }}
          title="Editar chamado"
          description="Atualize os dados do chamado e do cliente."
          size="xl"
          footer={
            <div className="flex w-full items-center justify-end gap-2">
              <AppButton
                variant="ghost"
                type="button"
                onPress={closeEdit}
                isDisabled={isEditPending}
              >
                Cancelar
              </AppButton>
              <UpdateButton pending={isEditPending} formId={EDIT_FORM_ID} />
            </div>
          }
        >
          <form
            id={EDIT_FORM_ID}
            action={updateTicketAction}
            className="space-y-6"
            onSubmit={() => rememberUnidade(editForm.clienteUnidade)}
          >
            <EditPendingObserver onPendingChange={setIsEditPending} />
            <input type="hidden" name="ticket_id" value={editTicket.id} />
            <input type="hidden" name="client_id" value={editTicket.client_id} />
            <input
              type="hidden"
              name="cliente_cpf"
              value={editForm.clienteCpfDigits}
            />
            <input
              type="hidden"
              name="data_atendimento"
              value={editForm.dataAtendimentoIso}
            />

            <Section
              title="Dados do Chamado"
              description="Atualize motivo, prioridade e data do atendimento."
            >
              <div className="grid gap-4 md:gap-6 md:grid-cols-3">
                <AppSelect
                  name="motivo"
                  label="Motivo"
                  value={editForm.motivo}
                  onValueChange={(value) =>
                    setEditForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            motivo: value,
                            motivoOutro:
                              value === "Outro" ? prev.motivoOutro : "",
                          }
                        : prev
                    )
                  }
                  options={MOTIVOS_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                  isRequired
                />

                <AppSelect
                  name="prioridade"
                  label="Prioridade"
                  value={editForm.prioridade}
                  onValueChange={(value) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, prioridade: value } : prev
                    )
                  }
                  options={PRIORIDADES_OPTIONS.map((item) => ({
                    value: item,
                    label: formatPrioridadeLabel(item),
                  }))}
                  isRequired
                />

                <AppInput
                  label="Data de atendimento"
                  value={editForm.dataAtendimentoBr || "?"}
                  isReadOnly
                  className="bg-[var(--color-muted-soft)]"
                  endContent={
                    <AppButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onPress={() => setIsEditDateModalOpen(true)}
                    >
                      Alterar
                    </AppButton>
                  }
                />
              </div>

              {editForm.motivo === "Outro" ? (
                <AppTextarea
                  label="Descricao do motivo (Outro)"
                  name="motivo_outro_descricao"
                  value={editForm.motivoOutro}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? { ...prev, motivoOutro: event.target.value }
                        : prev
                    )
                  }
                  isRequired
                />
              ) : null}
            </Section>

            <Section
              title="Dados do Cliente"
              description="Informacoes cadastrais do cliente atendido."
            >
              <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                <AppInput
                  label="Nome"
                  name="cliente_nome"
                  value={editForm.clienteNome}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, clienteNome: event.target.value } : prev
                    )
                  }
                  isRequired
                />

                <AppInput
                  label="CPF (nao editavel)"
                  value={formatCpf(editForm.clienteCpfDigits)}
                  isReadOnly
                  className="bg-[var(--color-muted-soft)]"
                />

                <AppInput
                  label="Cidade"
                  name="cliente_cidade"
                  value={editForm.clienteCidade}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev ? { ...prev, clienteCidade: event.target.value } : prev
                    )
                  }
                  list={CIDADES_LIST_ID}
                  isRequired
                />

                <AppInput
                  label="UF"
                  name="cliente_estado"
                  value={editForm.clienteEstado || UF_PADRAO}
                  isReadOnly
                  className="bg-[var(--color-muted-soft)]"
                  isRequired
                />

                <AppSelect
                  name="uso_plataforma"
                  label="Uso da plataforma"
                  value={editForm.clienteUsoPlataforma}
                  onValueChange={(value) =>
                    setEditForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            clienteUsoPlataforma: value,
                          }
                        : prev
                    )
                  }
                  options={USO_PLATAFORMA_OPTIONS.map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />

                <div className="space-y-4">
                  <AppSelect
                    name="cliente_area_atuacao"
                    label="Area de atuacao"
                    value={editForm.clienteAreaAtuacao}
                    onValueChange={(value) =>
                      setEditForm((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          clienteAreaAtuacao: value,
                          clienteAreaAtuacaoOutro:
                            value === "Outro" ? prev.clienteAreaAtuacaoOutro : "",
                        };
                      })
                    }
                    options={AREA_ATUACAO_OPTIONS.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                    isRequired
                  />
                  {editForm.clienteAreaAtuacao === "Outro" ? (
                    <AppInput
                      label="Descreva a area de atuacao"
                      name="cliente_area_atuacao_outro"
                      value={editForm.clienteAreaAtuacaoOutro}
                      onChange={(event) =>
                        setEditForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                clienteAreaAtuacaoOutro: event.target.value,
                              }
                            : prev
                        )
                      }
                      placeholder="Ex.: Agropecuaria"
                      isRequired
                    />
                  ) : null}
                </div>

                <div className="md:col-span-2">
                  <AppInput
                    label={UNIDADE_AFETADA_LABEL}
                    name="ticket_unidade"
                    value={editForm.clienteUnidade}
                    onChange={(event) =>
                      setEditForm((prev) =>
                        prev ? { ...prev, clienteUnidade: event.target.value } : prev
                      )
                    }
                    list={UNIDADE_SUGGESTIONS_LIST_ID}
                    isRequired={editForm.clienteMultiUnidade}
                    placeholder="Informe a unidade afetada"
                    helperText={
                      editForm.clienteMultiUnidade
                        ? UNIDADE_MULTI_REQUIRED_HELPER
                        : UNIDADE_AFETADA_HELPER
                    }
                  />
                </div>
              </div>
            </Section>

            <Section
              title="Retroativo"
              aside={
                <AppBadge
                  tone={editRetroativo ? "warning" : "success"}
                  variant="soft"
                  size="sm"
                >
                  {editRetroativo ? "Retroativo" : "Normal"}
                </AppBadge>
              }
            >
              {editRetroativo ? (
                <AppTextarea
                  label="Motivo do retroativo"
                  name="retroativo_motivo"
                  value={editForm.retroativoMotivo}
                  onChange={(event) =>
                    setEditForm((prev) =>
                      prev
                        ? {
                            ...prev,
                            retroativoMotivo: event.target.value,
                          }
                        : prev
                    )
                  }
                  isRequired
                />
              ) : (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-3 text-sm text-[var(--color-muted-strong)]">
                  Este chamado não é retroativo.
                </div>
              )}
            </Section>
          </form>
        </AppModal>
      ) : null}

      {isEditDateModalOpen ? (
        <DatePickerModal
          title="Alterar data de atendimento"
          valueIso={editForm?.dataAtendimentoIso || todayIso}
          maxIso={todayIso}
          onCancel={() => setIsEditDateModalOpen(false)}
          onConfirm={(valueIso) => {
            handleEditDateConfirm(valueIso || todayIso);
            setIsEditDateModalOpen(false);
          }}
        />
      ) : null}

      <datalist id={UNIDADE_SUGGESTIONS_LIST_ID}>
        {unidadeSuggestions.map((unidade) => (
          <option key={unidade} value={unidade} />
        ))}
      </datalist>

      <datalist id={CIDADES_LIST_ID}>
        {CIDADES_PI.map((cidade) => (
          <option key={cidade} value={cidade} />
        ))}
      </datalist>
    </div>
  );
}







