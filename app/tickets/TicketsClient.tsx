"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown, Inbox } from "lucide-react";
import cidadesPi from "@/data/cidades_pi.json";
import { createTicketAction, updateTicketAction } from "@/app/tickets/actions";
import type { TicketClient } from "@/app/tickets/types";
import { createClient } from "@/lib/supabase/client";
import {
  AREA_ATUACAO_OPTIONS,
  getPriorityBadgeVariant,
  MOTIVOS_OPTIONS,
  PRIORIDADES_OPTIONS,
  USO_PLATAFORMA_OPTIONS,
  UF_PADRAO,
} from "@/app/tickets/constants";
import { getTodayLocalISODate } from "@/utils/date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import DatePickerModal from "@/components/tickets/DatePickerModal";
import {
  buildTicketsFilename,
  exportToCSV,
  exportToXLSX,
  mapToExportRow,
} from "@/utils/exportTickets";

const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-pi";

type TicketsClientProps = {
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
  clienteUnidade: string;
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

function formatPrioridadeLabel(prioridade: string) {
  return prioridade === "Media" ? "Média" : prioridade;
}

function motivoBadge(motivo: string) {
  if (motivo === "Outro") return "warning";
  if (motivo.includes("Problema")) return "muted";
  return "success";
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? "Salvando..." : "Salvar chamado"}
    </Button>
  );
}

function UpdateButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar alterações"}
    </Button>
  );
}

export default function TicketsClient({
  currentUserName,
  tickets,
  filters,
  pagination,
  status,
  error,
}: TicketsClientProps) {
  const supabase = useMemo(() => createClient(), []);
  const [motivo, setMotivo] = useState("");
  const [motivoOutro, setMotivoOutro] = useState("");
  const todayIso = useMemo(() => getTodayLocalISODate(), []);
  const [dataAtendimentoIso, setDataAtendimentoIso] = useState(todayIso);
  const [dataAtendimentoBr, setDataAtendimentoBr] = useState(() =>
    isoToBr(todayIso)
  );
  const [retroativoMotivo, setRetroativoMotivo] = useState("");
  const [cpfDigits, setCpfDigits] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteCidade, setClienteCidade] = useState("");
  const [clienteUsoPlataforma, setClienteUsoPlataforma] = useState("");
  const [clienteAreaAtuacao, setClienteAreaAtuacao] = useState("");
  const [clienteUnidade, setClienteUnidade] = useState("");
  const [isClientLocked, setIsClientLocked] = useState(false);
  const [cpfLookupState, setCpfLookupState] = useState<
    "idle" | "loading" | "found" | "not_found" | "error"
  >("idle");
  const [matchedClientId, setMatchedClientId] = useState<number | null>(null);
  const [isCreateValid, setIsCreateValid] = useState(false);
  const [exportNotice, setExportNotice] = useState("");
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);

  const createFormRef = useRef<HTMLFormElement | null>(null);
  const lastLookupCpfRef = useRef("");

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
      clienteUnidade: ticket.client.unidade,
    });
  };

  const closeEdit = () => {
    setIsEditDateModalOpen(false);
    setEditTicket(null);
    setEditForm(null);
  };

  const editRetroativo = useMemo(
    () => (editForm ? isRetroativoIso(editForm.dataAtendimentoIso) : false),
    [editForm]
  );

  const statusMessage =
    status === "created"
      ? "Chamado criado com sucesso."
      : status === "updated"
      ? "Chamado atualizado com sucesso."
      : "";

  const errorMessage = (() => {
    switch (error) {
      case "campos":
        return "Preencha todos os campos obrigatórios.";
      case "cpf":
        return "CPF deve conter 11 dígitos.";
      case "estado":
        return "UF deve conter 2 letras.";
      case "motivo":
        return "Descreva o motivo quando selecionar Outro.";
      case "retroativo":
        return "Informe o motivo do retroativo.";
      case "cliente":
        return "Não foi possível salvar o cliente.";
      case "ticket":
        return "Não foi possível salvar o chamado.";
      case "editar":
        return "Não foi possível editar o chamado.";
      default:
        return "";
    }
  })();

  const cpfDisplay = formatCpf(cpfDigits);

  const updateCreateValidity = useCallback((nextBr?: string, nextIso?: string) => {
    const form = createFormRef.current;
    if (!form) return;
    const isoValue = typeof nextIso === "string" ? nextIso : dataAtendimentoIso;
    setIsCreateValid(form.checkValidity() && Boolean(isoValue));
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
    setClienteUsoPlataforma("");
    setClienteAreaAtuacao("");
    setClienteUnidade("");
  }, []);

  const applyClientData = useCallback((client: {
    nome?: string | null;
    cidade?: string | null;
    uso_plataforma?: string | null;
    area_atuacao?: string | null;
    unidade?: string | null;
  }) => {
    setClienteNome(client.nome ?? "");
    setClienteCidade(client.cidade ?? "");
    setClienteUsoPlataforma(client.uso_plataforma ?? "");
    setClienteAreaAtuacao(client.area_atuacao ?? "");
    setClienteUnidade(client.unidade ?? "");
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
    setExportNotice("Exportação gerada.");
    window.setTimeout(() => setExportNotice(""), 3000);
  };

  return (
    <div className="space-y-6">
      <Card id="novo-chamado">
        <CardHeader>
          <CardTitle>Chamados de Suporte</CardTitle>
          <CardDescription>
            Registre e acompanhe chamados de suporte de TI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {statusMessage ? (
              <div className="rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-2 text-sm text-[var(--color-success)]">
                {statusMessage}
              </div>
            ) : null}
            {errorMessage ? (
              <div className="rounded-lg border border-[var(--color-danger)] bg-[var(--color-danger-soft)] px-4 py-2 text-sm text-[var(--color-danger)]">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Novo Chamado</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para abrir um novo chamado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            ref={createFormRef}
            action={createTicketAction}
            className="space-y-6"
            onInput={handleCreateInput}
            onChange={handleCreateInput}
          >
            <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    Profissional
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Usuário responsável pelo atendimento registrado.
                  </p>
                </div>
                <Badge variant="muted">Autenticado</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    E-mail
                  </label>
                  <Input
                    readOnly
                    value={currentUserName}
                    className="bg-[var(--color-muted-soft)]"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  Dados do Chamado
                </h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Defina o motivo, a prioridade e a data do atendimento.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Motivo
                  </label>
                  <Select
                    name="motivo"
                    value={motivo}
                    onChange={(event) => {
                      setMotivo(event.target.value);
                      if (event.target.value !== "Outro") {
                        setMotivoOutro("");
                      }
                    }}
                    required
                  >
                    <option value="">Selecione</option>
                    {MOTIVOS_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Prioridade
                  </label>
                  <Select name="prioridade" required>
                    <option value="">Selecione</option>
                    {PRIORIDADES_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {formatPrioridadeLabel(item)}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Data de atendimento
                  </label>
                  <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                    <span className="text-sm text-[var(--color-text)]">
                      {dataAtendimentoBr}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDateModalOpen(true)}
                      className="text-xs font-medium text-[var(--color-primary)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      Alterar
                    </button>
                  </div>
                  <input
                    type="hidden"
                    name="data_atendimento"
                    value={dataAtendimentoIso}
                  />
                </div>
              </div>

              {motivo === "Outro" ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Descrição do motivo (Outro)
                  </label>
                  <Textarea
                    name="motivo_outro_descricao"
                    value={motivoOutro}
                    onChange={(event) => setMotivoOutro(event.target.value)}
                    required
                  />
                </div>
              ) : null}
            </section>

            <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  Dados do Cliente
                </h3>
                <p className="text-xs text-[var(--color-muted)]">
                  Informações cadastrais do cliente atendido.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    CPF
                  </label>
                  <Input
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
                    required
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

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Nome
                  </label>
                  <Input
                    name="cliente_nome"
                    value={clienteNome}
                    onChange={(event) => setClienteNome(event.target.value)}
                    readOnly={isClientLocked}
                    className={isClientLocked ? "bg-[var(--color-muted-soft)]" : ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Cidade
                  </label>
                  <Input
                    name="cliente_cidade"
                    list={CIDADES_LIST_ID}
                    placeholder="Selecione a cidade"
                    value={clienteCidade}
                    onChange={(event) => setClienteCidade(event.target.value)}
                    readOnly={isClientLocked}
                    className={isClientLocked ? "bg-[var(--color-muted-soft)]" : ""}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">UF</label>
                  <Input
                    name="cliente_estado"
                    value={UF_PADRAO}
                    readOnly
                    className="bg-[var(--color-muted-soft)]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Uso da plataforma
                  </label>
                  <Select
                    name="uso_plataforma"
                    value={clienteUsoPlataforma}
                    onChange={(event) => setClienteUsoPlataforma(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {USO_PLATAFORMA_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Área de atuação
                  </label>
                  <Select
                    name="cliente_area_atuacao"
                    value={clienteAreaAtuacao}
                    onChange={(event) => setClienteAreaAtuacao(event.target.value)}
                    disabled={isClientLocked}
                    required
                  >
                    <option value="">Selecione</option>
                    {AREA_ATUACAO_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                  {isClientLocked ? (
                    <input
                      type="hidden"
                      name="cliente_area_atuacao"
                      value={clienteAreaAtuacao}
                    />
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Unidade
                  </label>
                  <Input
                    name="cliente_unidade"
                    value={clienteUnidade}
                    onChange={(event) => setClienteUnidade(event.target.value)}
                    readOnly={isClientLocked}
                    className={isClientLocked ? "bg-[var(--color-muted-soft)]" : ""}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    Retroativo
                  </h3>
                  <p className="text-xs text-[var(--color-muted)]">
                    Chamados com data anterior a hoje exigem justificativa.
                  </p>
                </div>
                <Badge variant={retroativo ? "warning" : "muted"}>
                  {retroativo ? "Retroativo" : "Normal"}
                </Badge>
              </div>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-3 text-sm text-[var(--color-muted-strong)]">
                A data de atendimento define automaticamente se o chamado é
                retroativo.
              </div>

              {retroativo ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                    Motivo do retroativo
                  </label>
                  <Textarea
                    name="retroativo_motivo"
                    value={retroativoMotivo}
                    onChange={(event) => setRetroativoMotivo(event.target.value)}
                    required
                  />
                </div>
              ) : null}
            </section>

            <div className="flex justify-end">
              <SubmitButton disabled={!isCreateValid} />
            </div>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Últimos Chamados</CardTitle>
            <CardDescription>
              {tickets.length} registros encontrados
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <form method="get" className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-strong)]">
                <span>Período</span>
                <div className="relative">
                  <Select
                    name="period"
                    defaultValue={filters.period}
                    className="h-9 pr-8"
                  >
                    <option value="7">7 dias</option>
                    <option value="30">30 dias</option>
                    <option value="90">90 dias</option>
                  </Select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-[var(--color-muted)]" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--color-muted-strong)]">
                <span>Motivo</span>
                <div className="relative">
                  <Select
                    name="motivo"
                    defaultValue={filters.motivo === "all" ? "" : filters.motivo}
                    className="h-9 pr-8"
                  >
                    <option value="">Todos</option>
                    {MOTIVOS_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </Select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-[var(--color-muted)]" />
                </div>
              </div>
              <Button variant="secondary" className="h-9">
                Filtrar
              </Button>
            </form>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => handleExport("csv")}
                disabled={tickets.length === 0}
              >
                Exportar CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={() => handleExport("xlsx")}
                disabled={tickets.length === 0}
              >
                Exportar XLSX
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exportNotice ? (
            <div className="mb-4 rounded-lg border border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-2 text-sm text-[var(--color-success)]">
              {exportNotice}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-[var(--color-muted-soft)]">
                <tr className="border-b border-[var(--color-border)] text-left text-xs uppercase tracking-wide text-[var(--color-muted)]">
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Profissional</th>
                  <th className="px-3 py-2">Motivo</th>
                  <th className="px-3 py-2">Prioridade</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">CPF</th>
                  <th className="px-3 py-2">Unidade</th>
                  <th className="px-3 py-2">Criado em</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-14">
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
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-b border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-muted-soft)]"
                    >
                      <td className="px-3 py-3 font-medium">#{ticket.id}</td>
                      <td className="px-3 py-3">
                        {formatDate(ticket.data_atendimento)}
                      </td>
                      <td className="px-3 py-3">{ticket.profissional_nome}</td>
                      <td className="px-3 py-3">
                        <Badge variant={motivoBadge(ticket.motivo)}>
                          {ticket.motivo}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={getPriorityBadgeVariant(ticket.prioridade)}>
                          {formatPrioridadeLabel(ticket.prioridade)}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">{ticket.client.nome}</td>
                      <td className="px-3 py-3 font-mono text-xs">
                        {maskCpf(ticket.client.cpf)}
                      </td>
                      <td className="px-3 py-3">{ticket.client.unidade}</td>
                      <td className="px-3 py-3">
                        {formatDateTime(ticket.created_at)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          variant="ghost"
                          className="h-8 px-3"
                          type="button"
                          onClick={() => openEdit(ticket)}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-muted-strong)]">
            <div>
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              {pagination.prevHref ? (
                <a
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-muted-soft)]"
                  href={pagination.prevHref}
                >
                  Anterior
                </a>
              ) : (
                <span className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-[var(--color-muted)] opacity-60">
                  Anterior
                </span>
              )}
              {pagination.nextHref ? (
                <a
                  className="rounded-lg border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-muted-soft)]"
                  href={pagination.nextHref}
                >
                  Próxima
                </a>
              ) : (
                <span className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-[var(--color-muted)] opacity-60">
                  Próxima
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {editTicket && editForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 py-6">
          <div className="w-full max-w-3xl overflow-hidden rounded-xl bg-[var(--color-surface)] shadow-[var(--color-shadow)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text)]">
                  Editar chamado
                </h3>
                <p className="text-sm text-[var(--color-muted)]">
                  Atualize os dados do chamado e do cliente.
                </p>
              </div>
              <Button variant="ghost" className="h-8 px-3" type="button" onClick={closeEdit}>
                Fechar
              </Button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
              <form action={updateTicketAction} className="space-y-5">
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

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">
                    Dados do Chamado
                  </h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Motivo
                      </label>
                      <Select
                        name="motivo"
                        value={editForm.motivo}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  motivo: event.target.value,
                                  motivoOutro:
                                    event.target.value === "Outro"
                                      ? prev.motivoOutro
                                      : "",
                                }
                              : prev
                          )
                        }
                        required
                      >
                        {MOTIVOS_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Prioridade
                      </label>
                      <Select
                        name="prioridade"
                        value={editForm.prioridade}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev ? { ...prev, prioridade: event.target.value } : prev
                          )
                        }
                        required
                      >
                        {PRIORIDADES_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {formatPrioridadeLabel(item)}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Data de atendimento
                      </label>
                      <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
                        <span className="text-sm text-[var(--color-text)]">
                          {editForm.dataAtendimentoBr || "—"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditDateModalOpen(true)}
                          className="text-xs font-medium text-[var(--color-primary)] transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        >
                          Alterar
                        </button>
                      </div>
                    </div>
                  </div>

                  {editForm.motivo === "Outro" ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Descrição do motivo (Outro)
                      </label>
                      <Textarea
                        name="motivo_outro_descricao"
                        value={editForm.motivoOutro}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, motivoOutro: event.target.value }
                              : prev
                          )
                        }
                        required
                      />
                    </div>
                  ) : null}
                </section>

                <Separator />

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--color-text)]">
                    Dados do Cliente
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Nome
                      </label>
                      <Input
                        name="cliente_nome"
                        value={editForm.clienteNome}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, clienteNome: event.target.value }
                              : prev
                          )
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        CPF (não editável)
                      </label>
                      <Input
                        value={formatCpf(editForm.clienteCpfDigits)}
                        readOnly
                        className="bg-[var(--color-muted-soft)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Cidade
                      </label>
                      <Input
                        name="cliente_cidade"
                        value={editForm.clienteCidade}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, clienteCidade: event.target.value }
                              : prev
                          )
                        }
                        list={CIDADES_LIST_ID}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">UF</label>
                      <Input
                        name="cliente_estado"
                        value={editForm.clienteEstado || UF_PADRAO}
                        readOnly
                        className="bg-[var(--color-muted-soft)]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Uso da plataforma
                      </label>
                      <Select
                        name="uso_plataforma"
                        value={editForm.clienteUsoPlataforma}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  clienteUsoPlataforma: event.target.value,
                                }
                              : prev
                          )
                        }
                      >
                        <option value="">Selecione</option>
                        {USO_PLATAFORMA_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Área de atuação
                      </label>
                      <Select
                        name="cliente_area_atuacao"
                        value={editForm.clienteAreaAtuacao}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, clienteAreaAtuacao: event.target.value }
                              : prev
                          )
                        }
                        required
                      >
                        <option value="">Selecione</option>
                        {AREA_ATUACAO_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Unidade
                      </label>
                      <Input
                        name="cliente_unidade"
                        value={editForm.clienteUnidade}
                        onChange={(event) =>
                          setEditForm((prev) =>
                            prev
                              ? { ...prev, clienteUnidade: event.target.value }
                              : prev
                          )
                        }
                        required
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[var(--color-text)]">Retroativo</h4>
                    <Badge variant={editRetroativo ? "warning" : "muted"}>
                      {editRetroativo ? "Retroativo" : "Normal"}
                    </Badge>
                  </div>
                  {editRetroativo ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-[var(--color-muted-strong)]">
                        Motivo do retroativo
                      </label>
                      <Textarea
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
                        required
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-3 text-sm text-[var(--color-muted-strong)]">
                      Este chamado não é retroativo.
                    </div>
                  )}
                </section>

                <div className="sticky bottom-0 -mx-6 mt-6 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" type="button" onClick={closeEdit}>
                      Cancelar
                    </Button>
                    <UpdateButton />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
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

      <datalist id={CIDADES_LIST_ID}>
        {CIDADES_PI.map((cidade) => (
          <option key={cidade} value={cidade} />
        ))}
      </datalist>
    </div>
  );
}

