"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addMotivoAction, migrateLegacyTicketToMotivoAction, updateMotivoStatusAction } from "@/app/tickets/actions-motivos";
import {
  MOTIVO_STATUS_BADGE,
  MOTIVO_STATUS_LABEL,
  MOTIVO_STATUS_OPTIONS,
  MOTIVOS_OPTIONS,
  PRIORIDADES_OPTIONS,
  USO_PLATAFORMA_OPTIONS,
  formatPrioridadeLabel,
  type MotivoOption,
  type PrioridadeOption,
  type UsoPlataformaOption,
} from "@/app/tickets/constants";
import { formatCPF, maskCPF, unmaskCPF } from "@/utils/cpf";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppCardTitle,
  AppInput,
  AppSelect,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableColumn,
  AppTableHeader,
  AppTableRow,
  AppTextarea,
  FormCard,
  PageHeader,
  Section,
} from "@/app/ui";
import type { AppBadgeTone } from "@/app/ui/badge";
import type { TicketDetail, TicketMotivoItem } from "@/app/tickets/[id]/page";

type Props = {
  ticket: TicketDetail;
  motivos: TicketMotivoItem[];
  isLegacy: boolean;
};

export default function TicketDetailClient({ ticket, motivos, isLegacy }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [motivo, setMotivo] = useState<MotivoOption>("Problema de acesso");
  const [motivoOutro, setMotivoOutro] = useState("");
  const [clientCpfDigits, setClientCpfDigits] = useState("");
  const [clientId, setClientId] = useState<number | null>(null);
  const [clientNome, setClientNome] = useState("");
  const [clientNomeInput, setClientNomeInput] = useState("");
  const [clientCidade, setClientCidade] = useState("");
  const [clientEstado, setClientEstado] = useState("");
  const [unidade, setUnidade] = useState("");
  const [usoPlataforma, setUsoPlataforma] = useState<UsoPlataformaOption | "">("");
  const [prioridade, setPrioridade] = useState<PrioridadeOption>("Baixa");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ id: number; nome: string; cpf: string }>>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!showAdd) {
      setClientCpfDigits("");
      setClientId(null);
      setClientNome("");
      setClientNomeInput("");
      setClientCidade("");
      setClientEstado("");
      setUnidade("");
      setUsoPlataforma("");
      setMotivoOutro("");
      setStatusMessage(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setSuggestions([]);
    }
  }, [showAdd]);

  const handleLookupCpf = async (cpf: string) => {
    const digits = unmaskCPF(cpf);
    setClientCpfDigits(digits);
    if (digits.length !== 11) {
      setStatusMessage(null);
      setClientId(null);
      return;
    }
    try {
      const res = await fetch("/api/client/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digits }),
      });
      if (!res.ok) throw new Error("lookup_failed");
      const result = await res.json();
      if (result?.client?.id) {
        const parsedId = Number(result.client.id);
        setClientId(Number.isFinite(parsedId) ? parsedId : null);
        setClientNome(result.client.nome ?? "");
        setClientNomeInput(result.client.nome ?? "");
        setClientCidade(result.client.cidade ?? "");
        setClientEstado((result.client.estado_uf ?? "").toString().toUpperCase());
        setStatusMessage(
          result.status === "FOUND_MISSING_EMAIL"
            ? "Cliente encontrado (sem email cadastrado)."
            : "Cliente encontrado."
        );
      } else {
        setClientId(null);
        setClientNome("");
        setStatusMessage("Cliente não encontrado.");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao buscar cliente.");
    }
  };

  const handleNameSuggestions = async (nome: string) => {
    const query = nome.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch("/api/client/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: query }),
      });
      if (!res.ok) throw new Error("lookup_failed");
      const result = await res.json();
      setSuggestions(result.suggestions ?? []);
    } catch (error) {
      console.error(error);
      setSuggestions([]);
    }
  };

  const isFormValid = useMemo(() => {
    const hasClient = Boolean(clientId);
    const hasCpf = clientCpfDigits.length === 11;
    const hasPrioridade = PRIORIDADES_OPTIONS.includes(prioridade as PrioridadeOption);
    const outroOk = motivo !== "Outro" || Boolean(motivoOutro.trim());
    const isExistingClient = hasClient;
    const isNewClientValid =
      clientNomeInput.trim().length > 2 &&
      clientCidade.trim().length > 2 &&
      clientEstado.trim().length === 2;
    return hasCpf && hasPrioridade && outroOk && (isExistingClient || isNewClientValid);
  }, [clientCpfDigits, clientId, clientCidade, clientEstado, clientNomeInput, motivo, motivoOutro, prioridade]);

  const ERROR_MESSAGES: Record<string, string> = {
    MOTIVO_INVALIDO: "Selecione um motivo válido.",
    PRIORIDADE_INVALIDA: "Selecione uma prioridade válida.",
    MOTIVO_OUTRO_REQUIRED: "Descreva o motivo quando selecionar 'Outro'.",
    CLIENT_REQUIRED: "Selecione um cliente antes de salvar.",
    UNIDADE_INVALIDA: "A unidade informada é inválida.",
    MOTIVO_CREATE_FAILED: "Erro ao salvar o motivo. Tente novamente.",
    CLIENT_CREATE_FAILED: "Erro ao salvar o cliente. Verifique os dados e tente novamente.",
  };

  const handleSubmitMotivo = (formData: FormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    startTransition(async () => {
      try {
        // Ensure we have a client id. Create client if needed.
        let ensuredClientId = Number(formData.get("client_id"));
        const cpfDigits = unmaskCPF(String(formData.get("client_cpf") ?? ""));

        if (!ensuredClientId) {
          const nome = String(formData.get("client_nome") ?? clientNomeInput).trim();
          const cidade = String(formData.get("client_cidade") ?? clientCidade).trim();
          const estado = String(formData.get("client_estado") ?? clientEstado).trim().toUpperCase();

          const upsertRes = await fetch("/api/client/upsert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              cpf: cpfDigits,
              nome,
              cidade,
              estado_uf: estado,
              email: null,
              uso_plataforma: usoPlataforma || null,
              area_atuacao: null,
              unidade: unidade || null,
            }),
          });

          if (!upsertRes.ok) throw new Error("CLIENT_CREATE_FAILED");
          const upsertData = await upsertRes.json();
          ensuredClientId = Number(upsertData?.client_id);
          if (!ensuredClientId) throw new Error("CLIENT_CREATE_FAILED");
          formData.set("client_id", String(ensuredClientId));
        }

        await addMotivoAction(formData);
        setSuccessMessage("Motivo adicionado com sucesso!");
        setShowAdd(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro desconhecido.";
        setErrorMessage(ERROR_MESSAGES[msg] ?? msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ticket #${ticket.id}`}
        subtitle={`Criado em ${new Intl.DateTimeFormat("pt-BR").format(new Date(ticket.created_at))}`}
      />

      <AppCard>
        <AppCardHeader className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {ticket.data_atendimento ? (
              <AppBadge tone="primary">
                Data {new Intl.DateTimeFormat("pt-BR").format(new Date(ticket.data_atendimento))}
              </AppBadge>
            ) : null}
            {ticket.retroativo ? (
              <AppBadge tone="warning">Retroativo</AppBadge>
            ) : null}
          </div>
          <div className="text-sm text-[var(--color-muted-strong)]">
            Profissional: {ticket.profissional_nome}
          </div>
        </AppCardHeader>
      </AppCard>

      {isLegacy ? (
        <div className="space-y-2 rounded-lg border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-4">
          <div className="font-semibold text-[var(--color-warning)]">Ticket legado sem itens</div>
          <div className="text-sm text-[var(--color-muted-strong)]">
            Migrar motivo do ticket para um item em ticket_motivos?
          </div>
          <form action={migrateLegacyTicketToMotivoAction}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <AppButton type="submit" size="sm">
              Migrar motivo legado
            </AppButton>
          </form>
        </div>
      ) : null}

      <AppCard>
        <AppCardHeader className="flex items-center justify-between">
          <AppCardTitle className="text-base">Motivos</AppCardTitle>
          <AppButton size="sm" onPress={() => setShowAdd((prev) => !prev)}>
            {showAdd ? "Fechar" : "Adicionar motivo"}
          </AppButton>
        </AppCardHeader>
        <AppCardBody className="space-y-4">
          {showAdd ? (
            <FormCard
              title="Novo motivo"
              description="Selecione o cliente e o motivo para este ticket."
              footer={
                <div className="flex justify-end">
                  <AppButton
                    type="submit"
                    form="add-motivo-form"
                    isDisabled={!isFormValid || isPending}
                  >
                    {isPending ? "Salvando..." : "Salvar motivo"}
                  </AppButton>
                </div>
              }
            >
              <form id="add-motivo-form" action={handleSubmitMotivo} className="space-y-4">
                <input type="hidden" name="ticket_id" value={ticket.id} />
                <input type="hidden" name="client_id" value={clientId ?? ""} />
                <Section title="Cliente" description="Busque por CPF ou nome.">
                  <div className="grid gap-3 md:grid-cols-2">
                    <AppInput
                      label="CPF"
                      value={formatCPF(clientCpfDigits)}
                      onChange={(event) => handleLookupCpf(event.target.value)}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                    />
                    <input type="hidden" name="client_cpf" value={clientCpfDigits} />
                    <AppInput
                      label="Buscar por nome (sugestões)"
                      onChange={(event) => handleNameSuggestions(event.target.value)}
                      placeholder="Nome do cliente"
                    />
                    <AppInput
                      label="Nome (preencha se for cliente novo)"
                      name="client_nome"
                      value={clientNomeInput}
                      onChange={(event) => setClientNomeInput(event.target.value)}
                      placeholder="Nome completo"
                    />
                    <AppInput
                      label="Cidade"
                      name="client_cidade"
                      value={clientCidade}
                      onChange={(event) => setClientCidade(event.target.value)}
                      placeholder="Cidade do cliente"
                    />
                    <AppInput
                      label="Estado (UF)"
                      name="client_estado"
                      value={clientEstado}
                      onChange={(event) => setClientEstado(event.target.value.toUpperCase())}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                  {statusMessage ? (
                    <p className="text-xs text-[var(--color-success)] mt-1">{statusMessage}</p>
                  ) : null}
                  {errorMessage ? (
                    <p className="text-xs text-[var(--color-danger)] mt-1">{errorMessage}</p>
                  ) : null}
                  {suggestions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestions.map((item) => (
                        <AppButton
                          key={item.id}
                          size="sm"
                          variant="ghost"
                          onPress={() => {
                            setClientId(Number(item.id));
                            setClientNome(item.nome);
                            setClientNomeInput(item.nome);
                            setClientCpfDigits(unmaskCPF(item.cpf));
                            setStatusMessage("Cliente selecionado por nome.");
                            setSuggestions([]);
                          }}
                        >
                          {item.nome} — {maskCPF(item.cpf)}
                        </AppButton>
                      ))}
                    </div>
                  ) : null}
                  {clientNome ? (
                    <p className="text-xs text-[var(--color-muted-strong)] mt-1">
                      Selecionado: {clientNome} ({maskCPF(clientCpfDigits)})
                    </p>
                  ) : null}
                </Section>

                <Section title="Detalhes" description="Defina o motivo e informações adicionais.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <AppSelect
                      label="Motivo"
                      name="motivo"
                      options={MOTIVOS_OPTIONS.map((m) => ({ value: m, label: m }))}
                      value={motivo}
                      onValueChange={(value) => setMotivo(value as MotivoOption)}
                      isRequired
                    />
                    <AppSelect
                      label="Uso da plataforma (opcional)"
                      name="uso_plataforma"
                      options={USO_PLATAFORMA_OPTIONS.map((u) => ({ value: u, label: u }))}
                      value={usoPlataforma}
                      onValueChange={(value) => setUsoPlataforma(value as UsoPlataformaOption)}
                    />
                    <AppSelect
                      label="Prioridade"
                      name="prioridade"
                      options={PRIORIDADES_OPTIONS.map((p) => ({
                        value: p,
                        label: formatPrioridadeLabel(p),
                      }))}
                      value={prioridade}
                      onValueChange={(value) => setPrioridade(value as PrioridadeOption)}
                      isRequired
                    />
                    <AppInput
                      label="Unidade (texto)"
                      name="unidade"
                      value={unidade}
                      onChange={(event) => setUnidade(event.target.value)}
                      placeholder="Ex.: Unidade Central"
                    />
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
                </Section>
                {errorMessage ? (
                  <div className="rounded-md border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] p-3">
                    <p className="text-sm font-medium text-[var(--color-danger)]">{errorMessage}</p>
                  </div>
                ) : null}
              </form>
            </FormCard>
          ) : null}
          {successMessage ? (
            <div className="rounded-md border border-[var(--color-success)] bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] p-3">
              <p className="text-sm font-medium text-[var(--color-success)]">{successMessage}</p>
            </div>
          ) : null}

          <AppTable aria-label="Motivos">
            <AppTableHeader>
              <AppTableColumn>Cliente</AppTableColumn>
              <AppTableColumn>Cidade/UF</AppTableColumn>
              <AppTableColumn>Prioridade</AppTableColumn>
              <AppTableColumn>Unidade</AppTableColumn>
              <AppTableColumn>Motivo</AppTableColumn>
              <AppTableColumn>Status</AppTableColumn>
              <AppTableColumn>Atualizado</AppTableColumn>
              <AppTableColumn>Ações</AppTableColumn>
            </AppTableHeader>
            <AppTableBody emptyContent="Nenhum motivo ainda.">
              {motivos.map((item) => (
                <AppTableRow key={item.id}>
                  <AppTableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--color-text)]">
                        {item.cliente_nome || "—"}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {maskCPF(item.cliente_cpf)}
                      </span>
                    </div>
                  </AppTableCell>
                  <AppTableCell>
                    {item.cliente_cidade || "—"} {item.cliente_estado ? `/${item.cliente_estado}` : ""}
                  </AppTableCell>
                  <AppTableCell>{formatPrioridadeLabel(item.prioridade)}</AppTableCell>
                  <AppTableCell>{item.unidade || "—"}</AppTableCell>
                  <AppTableCell>
                    <div className="flex flex-col">
                      <span>{item.motivo}</span>
                      {item.motivo === "Outro" && item.motivo_outro_descricao ? (
                        <span className="text-xs text-[var(--color-muted)]">
                          {item.motivo_outro_descricao}
                        </span>
                      ) : null}
                    </div>
                  </AppTableCell>
                  <AppTableCell>
                    <AppBadge tone={(MOTIVO_STATUS_BADGE[item.status] ?? "default") as AppBadgeTone}>
                      {MOTIVO_STATUS_LABEL[item.status]}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell>
                    {item.updated_at
                      ? new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(item.updated_at))
                      : "-"}
                  </AppTableCell>
                  <AppTableCell>
                    <form action={updateMotivoStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="motivo_id" value={item.id} />
                      <input type="hidden" name="ticket_id" value={item.ticket_id} />
                      <select
                        name="status"
                        defaultValue={item.status}
                        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-sm"
                      >
                        {MOTIVO_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {MOTIVO_STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <AppButton type="submit" size="sm" variant="soft">
                        Atualizar
                      </AppButton>
                    </form>
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


