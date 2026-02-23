"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import cidadesPi from "@/data/cidades_pi.json";
import { createTicketAction } from "@/app/tickets/actions";
import { createClient } from "@/lib/supabase/client";
import { formatCpf, isoToBr, isRetroativoIso } from "@/app/tickets/helpers";
import { getTodayLocalISODate } from "@/utils/date";
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
import {
    AppBadge,
    AppButton,
    AppInput,
    AppSelect,
    AppTextarea,
    AppAlert,
    FormCard,
    PageHeader,
    Section,
} from "@/app/ui";
import DatePickerModal from "@/components/tickets/DatePickerModal";

const CREATE_FORM_ID = "create-ticket-form";
const CIDADES_PI = cidadesPi.cidades;
const CIDADES_LIST_ID = "cidades-pi";

function SubmitButton({ disabled, formId }: { disabled: boolean; formId?: string }) {
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

export type TicketCreateFormProps = {
    currentUserId: string;
    currentUserName: string;
    error?: string;
};

export function TicketCreateForm({
    currentUserId,
    currentUserName,
    error,
}: TicketCreateFormProps) {
    const supabase = useMemo(() => createClient(), []);

    /* ── Form state ──────────────────────────────────────── */
    const [motivo, setMotivo] = useState("");
    const [motivoOutro, setMotivoOutro] = useState("");
    const [prioridade, setPrioridade] = useState("");
    const todayIso = useMemo(() => getTodayLocalISODate(), []);
    const [dataAtendimentoIso, setDataAtendimentoIso] = useState(todayIso);
    const [dataAtendimentoBr, setDataAtendimentoBr] = useState(() => isoToBr(todayIso));
    const [retroativoMotivo, setRetroativoMotivo] = useState("");
    const [cpfDigits, setCpfDigits] = useState("");
    const [clienteNome, setClienteNome] = useState("");
    const [clienteEmail, setClienteEmail] = useState("");
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
        "idle" | "loading" | "found" | "found_missing_email" | "not_found" | "error"
    >("idle");
    const [emailLookupState, setEmailLookupState] = useState<
        "idle" | "loading" | "found" | "not_found" | "error"
    >("idle");
    const [nameSuggestions, setNameSuggestions] = useState<
        Array<{ id: number; nome: string; cpf: string }>
    >([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [clientLookupStatus, setClientLookupStatus] = useState<
        "idle" | "found" | "missing_email" | "not_found" | "ambiguous" | "error"
    >("idle");
    const [matchedClientId, setMatchedClientId] = useState<number | null>(null);
    const [isCreateValid, setIsCreateValid] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    const createFormRef = useRef<HTMLFormElement | null>(null);
    const lastLookupCpfRef = useRef("");
    const lastLookupEmailRef = useRef("");

    const unidadeStorageKey = useMemo(
        () => getUnidadeHistoryStorageKey(currentUserId),
        [currentUserId],
    );

    /* ── Helpers ─────────────────────────────────────────── */

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

    const retroativo = useMemo(() => isRetroativoIso(dataAtendimentoIso), [dataAtendimentoIso]);

    const updateCreateValidity = useCallback(
        (nextBr?: string, nextIso?: string) => {
            const form = createFormRef.current;
            if (!form) return;
            const isoValue = typeof nextIso === "string" ? nextIso : dataAtendimentoIso;
            const hasInvalidControl = Boolean(form.querySelector(":invalid"));
            setIsCreateValid(!hasInvalidControl && Boolean(isoValue));
        },
        [dataAtendimentoIso],
    );

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
        setClienteEmail("");
        setClienteCidade("");
        setClienteEstado(UF_PADRAO);
        setClienteUsoPlataforma("");
        setClienteAreaAtuacao("");
        setClienteAreaAtuacaoOutro("");
        setClienteUnidade("");
        setIsClienteMultiUnidade(false);
    }, []);

    const applyClientData = useCallback(
        (client: {
            nome?: string | null;
            email?: string | null;
            cidade?: string | null;
            estado_uf?: string | null;
            uso_plataforma?: string | null;
            area_atuacao?: string | null;
            unidade?: string | null;
            multi_unidade?: boolean | null;
        }) => {
            const isMulti = Boolean(client.multi_unidade);
            setClienteNome(client.nome ?? "");
            setClienteEmail(client.email ?? "");
            setClienteCidade(client.cidade ?? "");
            setClienteEstado((client.estado_uf ?? UF_PADRAO).toUpperCase());
            setClienteUsoPlataforma(client.uso_plataforma ?? "");
            setClienteAreaAtuacao(client.area_atuacao ?? "");
            setClienteAreaAtuacaoOutro("");
            setClienteUnidade(isMulti ? "" : (client.unidade ?? ""));
            setIsClienteMultiUnidade(isMulti);
        },
        [],
    );

    /* ── Lookups ─────────────────────────────────────────── */

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
                setClientLookupStatus("idle");
                return;
            }
            if (lastLookupCpfRef.current === cpfValue && cpfLookupState !== "error") return;
            lastLookupCpfRef.current = cpfValue;
            setCpfLookupState("loading");
            setClientLookupStatus("idle");
            setNameSuggestions([]);

            try {
                const res = await fetch("/api/client/lookup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ cpf: cpfValue }),
                });
                if (!res.ok) throw new Error("lookup_failed");
                const result = await res.json();
                if (result?.client?.id) {
                    setMatchedClientId(result.client.id as number);
                    setIsClientLocked(true);
                    applyClientData(result.client);
                    setClienteEmail(result.primary_email ?? "");
                    setCpfLookupState(
                        result.status === "FOUND_MISSING_EMAIL" ? "found_missing_email" : "found",
                    );
                    setClientLookupStatus(
                        result.status === "FOUND_MISSING_EMAIL" ? "missing_email" : "found",
                    );
                    window.setTimeout(() => updateCreateValidity(), 0);
                    return;
                }
                if (isClientLocked) resetClientFields();
                setMatchedClientId(null);
                setIsClientLocked(false);
                setCpfLookupState("not_found");
                setClientLookupStatus("not_found");
                window.setTimeout(() => updateCreateValidity(), 0);
            } catch (err) {
                console.error(err);
                setCpfLookupState("error");
                setClientLookupStatus("error");
                setIsClientLocked(false);
                setMatchedClientId(null);
                setIsClienteMultiUnidade(false);
            }
        },
        [applyClientData, cpfLookupState, isClientLocked, resetClientFields, updateCreateValidity],
    );

    const handleEmailLookup = useCallback(
        async (emailValue: string) => {
            const trimmed = emailValue.trim();
            if (!trimmed) {
                setEmailLookupState("idle");
                return;
            }
            if (lastLookupEmailRef.current === trimmed && emailLookupState !== "error") return;
            lastLookupEmailRef.current = trimmed;
            setEmailLookupState("loading");
            setNameSuggestions([]);

            try {
                const res = await fetch("/api/client/lookup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: trimmed }),
                });
                if (!res.ok) throw new Error("lookup_failed");
                const result = await res.json();
                if (result?.client?.id) {
                    setMatchedClientId(result.client.id as number);
                    setIsClientLocked(true);
                    setCpfDigits(result.client.cpf ?? "");
                    applyClientData(result.client);
                    setClienteEmail(result.primary_email ?? trimmed);
                    setCpfLookupState(
                        result.status === "FOUND_MISSING_EMAIL" ? "found_missing_email" : "found",
                    );
                    setClientLookupStatus(
                        result.status === "FOUND_MISSING_EMAIL" ? "missing_email" : "found",
                    );
                    setEmailLookupState("found");
                    return;
                }
                setEmailLookupState("not_found");
                setClientLookupStatus("not_found");
            } catch (err) {
                console.error(err);
                setEmailLookupState("error");
            }
        },
        [applyClientData, emailLookupState],
    );

    const handleNameLookup = useCallback(
        async (nameValue: string) => {
            const query = nameValue.trim();
            if (query.length < 3 || isClientLocked) {
                setNameSuggestions([]);
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
                if (Array.isArray(result?.suggestions)) {
                    setNameSuggestions(result.suggestions);
                    setClientLookupStatus("ambiguous");
                } else {
                    setNameSuggestions([]);
                }
            } catch (err) {
                console.error(err);
                setNameSuggestions([]);
            }
        },
        [isClientLocked],
    );

    /* ── Unidade suggestions load ───────────────────────── */

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

    const errorMessage = getTicketErrorMessage(error);
    const cpfDisplay = formatCpf(cpfDigits);
    const maskCpfInline = (digits: string) => {
        if (digits.length !== 11) return digits;
        return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
    };

    /* ── Render ──────────────────────────────────────────── */

    return (
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
                                    if (value !== "Outro") setMotivoOutro("");
                                    handleCreateInput();
                                }}
                                options={MOTIVOS_OPTIONS.map((item) => ({ value: item, label: item }))}
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
                                <input type="hidden" name="data_atendimento" value={dataAtendimentoIso} />
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
                                        const digits = event.target.value.replace(/\D/g, "").slice(0, 11);
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
                                    <p className="text-xs text-[var(--color-muted)]">Buscando cliente...</p>
                                ) : null}
                                {cpfLookupState === "found" ? (
                                    <p className="text-xs text-[var(--color-success)]">
                                        Cliente encontrado. Dados preenchidos automaticamente.
                                    </p>
                                ) : null}
                                {cpfLookupState === "found_missing_email" ? (
                                    <p className="text-xs text-[var(--color-warning)]">
                                        Cliente encontrado, sem email cadastrado. Adicione abaixo se obtiver.
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
                                <AppInput
                                    label="Email"
                                    name="cliente_email"
                                    type="email"
                                    placeholder="cliente@exemplo.com"
                                    value={clienteEmail}
                                    onChange={(event) => setClienteEmail(event.target.value)}
                                    onBlur={() => handleEmailLookup(clienteEmail)}
                                    isDisabled={false}
                                />
                                {emailLookupState === "loading" ? (
                                    <p className="text-xs text-[var(--color-muted)]">Buscando por email...</p>
                                ) : null}
                                {emailLookupState === "found" ? (
                                    <p className="text-xs text-[var(--color-success)]">
                                        Email vinculado a um cliente. Dados preenchidos.
                                    </p>
                                ) : null}
                                {emailLookupState === "not_found" ? (
                                    <p className="text-xs text-[var(--color-muted)]">
                                        Email não encontrado. Você pode salvar junto com o chamado.
                                    </p>
                                ) : null}
                                {emailLookupState === "error" ? (
                                    <p className="text-xs text-[var(--color-danger)]">
                                        Não foi possível buscar pelo email agora.
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
                                onBlur={() => handleNameLookup(clienteNome)}
                            />
                            {nameSuggestions.length > 0 ? (
                                <div className="md:col-span-2 lg:col-span-3 text-xs text-[var(--color-muted-strong)]">
                                    Sugestões pelo nome:
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {nameSuggestions.map((suggestion) => (
                                            <AppBadge key={suggestion.id} variant="soft" tone="default">
                                                {suggestion.nome} — CPF {maskCpfInline(suggestion.cpf)}
                                            </AppBadge>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

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
                                options={USO_PLATAFORMA_OPTIONS.map((item) => ({ value: item, label: item }))}
                            />

                            <AppSelect
                                name="cliente_area_atuacao"
                                label="Área de atuação"
                                placeholder="Selecione"
                                value={clienteAreaAtuacao}
                                onValueChange={(value) => {
                                    setClienteAreaAtuacao(value);
                                    if (value !== "Outro") setClienteAreaAtuacaoOutro("");
                                    handleCreateInput();
                                }}
                                isDisabled={isClientLocked}
                                options={AREA_ATUACAO_OPTIONS.map((item) => ({ value: item, label: item }))}
                                isRequired
                            />
                            {clienteAreaAtuacao === "Outro" ? (
                                <div className="md:col-span-2 lg:col-span-3">
                                    <AppInput
                                        label="Descreva a área de atuação"
                                        name="cliente_area_atuacao_outro"
                                        value={clienteAreaAtuacaoOutro}
                                        onChange={(event) => setClienteAreaAtuacaoOutro(event.target.value)}
                                        placeholder="Ex.: Agropecuária"
                                        isRequired
                                    />
                                </div>
                            ) : null}
                            {isClientLocked ? (
                                <input type="hidden" name="cliente_area_atuacao" value={clienteAreaAtuacao} />
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

            <datalist id={UNIDADE_SUGGESTIONS_LIST_ID}>
                {unidadeSuggestions.map((u) => (
                    <option key={u} value={u} />
                ))}
            </datalist>

            <datalist id={CIDADES_LIST_ID}>
                {CIDADES_PI.map((c) => (
                    <option key={c} value={c} />
                ))}
            </datalist>
        </div>
    );
}
