"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import cidadesPi from "@/data/cidades_pi.json";
import { updateTicketAction } from "@/app/tickets/actions";
import type { TicketClient } from "@/app/tickets/types";
import { formatCpf, isoToBr, isRetroativoIso } from "@/app/tickets/helpers";
import { getTodayLocalISODate } from "@/utils/date";
import {
    AREA_ATUACAO_OPTIONS,
    formatPrioridadeLabel,
    MOTIVOS_OPTIONS,
    PRIORIDADES_OPTIONS,
    UNIDADE_AFETADA_HELPER,
    UNIDADE_AFETADA_LABEL,
    UNIDADE_MULTI_REQUIRED_HELPER,
    UNIDADE_SUGGESTIONS_LIST_ID,
    USO_PLATAFORMA_OPTIONS,
    UF_PADRAO,
} from "@/app/tickets/constants";
import {
    AppBadge,
    AppButton,
    AppInput,
    AppModal,
    AppSelect,
    AppTextarea,
    Section,
} from "@/app/ui";
import DatePickerModal from "@/components/tickets/DatePickerModal";

const EDIT_FORM_ID = "edit-ticket-form";
const CIDADES_LIST_ID = "cidades-pi";
const CIDADES_PI = cidadesPi.cidades;

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

function UpdateButton({ pending, formId }: { pending: boolean; formId: string }) {
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

export type TicketEditModalProps = {
    ticket: TicketClient;
    onClose: () => void;
    rememberUnidade: (raw: string) => void;
    unidadeSuggestions: string[];
};

export function TicketEditModal({
    ticket,
    onClose,
    rememberUnidade,
    unidadeSuggestions,
}: TicketEditModalProps) {
    const todayIso = useMemo(() => getTodayLocalISODate(), []);
    const [isEditPending, setIsEditPending] = useState(false);
    const [isEditDateModalOpen, setIsEditDateModalOpen] = useState(false);

    const [editForm, setEditForm] = useState<EditFormState>(() => {
        const dataIso = ticket.data_atendimento ?? "";
        return {
            motivo: ticket.motivo,
            motivoOutro: ticket.motivo_outro_descricao ?? "",
            prioridade: ticket.prioridade,
            dataAtendimentoBr: isoToBr(dataIso),
            dataAtendimentoIso: dataIso,
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
        };
    });

    const editRetroativo = useMemo(
        () => isRetroativoIso(editForm.dataAtendimentoIso),
        [editForm.dataAtendimentoIso],
    );

    const handleEditDateConfirm = (isoValue: string) => {
        setEditForm((prev) => ({
            ...prev,
            dataAtendimentoIso: isoValue,
            dataAtendimentoBr: isoToBr(isoValue),
        }));
    };

    const handleClose = () => {
        setIsEditDateModalOpen(false);
        setIsEditPending(false);
        onClose();
    };

    return (
        <>
            <AppModal
                isOpen
                onOpenChange={(open) => {
                    if (!open) handleClose();
                }}
                title="Editar chamado"
                description="Atualize os dados do chamado e do cliente."
                size="xl"
                footer={
                    <div className="flex w-full items-center justify-end gap-2">
                        <AppButton
                            variant="ghost"
                            type="button"
                            onPress={handleClose}
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
                    <input type="hidden" name="ticket_id" value={ticket.id} />
                    <input type="hidden" name="client_id" value={ticket.client_id} />
                    <input type="hidden" name="cliente_cpf" value={editForm.clienteCpfDigits} />
                    <input type="hidden" name="data_atendimento" value={editForm.dataAtendimentoIso} />

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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        motivo: value,
                                        motivoOutro: value === "Outro" ? prev.motivoOutro : "",
                                    }))
                                }
                                options={MOTIVOS_OPTIONS.map((item) => ({ value: item, label: item }))}
                                isRequired
                            />

                            <AppSelect
                                name="prioridade"
                                label="Prioridade"
                                value={editForm.prioridade}
                                onValueChange={(value) =>
                                    setEditForm((prev) => ({ ...prev, prioridade: value }))
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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        motivoOutro: event.target.value,
                                    }))
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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        clienteNome: event.target.value,
                                    }))
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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        clienteCidade: event.target.value,
                                    }))
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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        clienteUsoPlataforma: value,
                                    }))
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
                                        setEditForm((prev) => ({
                                            ...prev,
                                            clienteAreaAtuacao: value,
                                            clienteAreaAtuacaoOutro:
                                                value === "Outro" ? prev.clienteAreaAtuacaoOutro : "",
                                        }))
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
                                            setEditForm((prev) => ({
                                                ...prev,
                                                clienteAreaAtuacaoOutro: event.target.value,
                                            }))
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
                                        setEditForm((prev) => ({
                                            ...prev,
                                            clienteUnidade: event.target.value,
                                        }))
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
                                    setEditForm((prev) => ({
                                        ...prev,
                                        retroativoMotivo: event.target.value,
                                    }))
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

            {isEditDateModalOpen ? (
                <DatePickerModal
                    title="Alterar data de atendimento"
                    valueIso={editForm.dataAtendimentoIso || todayIso}
                    maxIso={todayIso}
                    onCancel={() => setIsEditDateModalOpen(false)}
                    onConfirm={(valueIso) => {
                        handleEditDateConfirm(valueIso || todayIso);
                        setIsEditDateModalOpen(false);
                    }}
                />
            ) : null}

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
        </>
    );
}
