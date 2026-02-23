"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createUnitAction, updateUnitAction } from "@/app/units/actions";
import {
  NAME_STATUS_BADGE_TONE,
  NAME_STATUS_OPTIONS,
  type NameStatus,
} from "@/app/units/constants";
import type { Unit } from "@/app/units/types";
import { useAlerts } from "@/components/alerts/AlertsProvider";
import {
  AppBadge,
  AppButton,
  AppCard,
  AppCardBody,
  AppInput,
  AppSelect,
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableColumn,
  AppTableHeader,
  AppTableRow,
  AppTextarea,
  AppSwitch,
  FormCard,
  PageHeader,
  Section,
} from "@/app/ui";
import { formatUnitDisplay, isGarbageUnitName, sanitizeUnitName } from "@/utils/unit-name";

type UnitsClientProps = {
  units: Unit[];
  status?: string;
  error?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function SubmitButton({ disabled, isEditing }: { disabled: boolean; isEditing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <AppButton
      type="submit"
      variant="solid"
      isDisabled={disabled || pending}
      isLoading={pending}
    >
      {isEditing ? "Salvar alterações" : "Salvar unidade"}
    </AppButton>
  );
}

export default function UnitsClient({ units, status, error }: UnitsClientProps) {
  const { notify } = useAlerts();

  const [unitName, setUnitName] = useState("");
  const [semNome, setSemNome] = useState(false);
  const [nameStatus, setNameStatus] = useState<NameStatus>("INFORMADO");
  const [nameNote, setNameNote] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ unit_name?: string; name_status?: string }>({});

  useEffect(() => {
    if (status === "created") {
      notify({
        title: "Unidade criada",
        description: "Registro salvo com sucesso.",
        tone: "success",
      });
    }
    if (status === "updated") {
      notify({
        title: "Unidade atualizada",
        description: "Alterações salvas.",
        tone: "success",
      });
    }
    if (error) {
      notify({
        title: "Não foi possível salvar",
        description: "Revise os campos e tente novamente.",
        tone: "danger",
      });
    }
  }, [status, error, notify]);

  const statusLabelMap = useMemo(() => {
    const map: Record<NameStatus, string> = {
      INFORMADO: "Informado",
      NAO_INFORMADO: "Não informado",
      NAO_ENCONTRADO: "Não encontrado",
      SEM_NOME: "Sem nome",
    };
    return map;
  }, []);

  const currentErrors = useMemo(() => {
    const nextErrors: typeof errors = {};
    if (semNome) {
      if (!nameStatus || nameStatus === "INFORMADO") {
        nextErrors.name_status = "Selecione o status.";
      }
    } else {
      const sanitized = sanitizeUnitName(unitName);
      if (!sanitized) {
        nextErrors.unit_name = "Informe o nome da unidade.";
      } else if (sanitized.length < 3) {
        nextErrors.unit_name = "Mínimo de 3 caracteres.";
      } else if (isGarbageUnitName(sanitized)) {
        nextErrors.unit_name = "Esse valor não é aceito.";
      }
    }
    return nextErrors;
  }, [semNome, nameStatus, unitName]);

  useEffect(() => {
    setErrors(currentErrors);
  }, [currentErrors]);

  const isValid = Object.keys(currentErrors).length === 0;
  const isEditing = editingId !== null;

  const handleToggleSemNome = (checked: boolean) => {
    setSemNome(checked);
    if (checked) {
      setUnitName("");
      setNameStatus("NAO_INFORMADO");
    } else {
      setNameStatus("INFORMADO");
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingId(unit.id);
    setSemNome(unit.unit_name === null);
    setUnitName(unit.unit_name ?? "");
    setNameStatus(unit.name_status);
    setNameNote(unit.name_note ?? "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSemNome(false);
    setUnitName("");
    setNameStatus("INFORMADO");
    setNameNote("");
    setErrors({});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Unidades"
        subtitle="Cadastre ou ajuste unidades e o status do nome."
      />

      <FormCard
        title={isEditing ? "Editar unidade" : "Nova unidade"}
        description="Informe o nome real ou marque como sem nome."
        footer={
          <div className="flex justify-between">
            {isEditing ? (
              <AppButton variant="ghost" onPress={handleCancelEdit}>
                Cancelar edição
              </AppButton>
            ) : (
              <span />
            )}
            <SubmitButton disabled={!isValid} isEditing={isEditing} />
          </div>
        }
      >
        <form action={isEditing ? updateUnitAction : createUnitAction} className="space-y-4">
          {isEditing ? (
            <input type="hidden" name="unit_id" value={editingId ?? ""} />
          ) : null}
          <input type="hidden" name="sem_nome" value={semNome ? "true" : "false"} />
          {!semNome ? (
            <input type="hidden" name="name_status" value="INFORMADO" />
          ) : null}

          <Section
            title="Identificação"
            description="Preencha apenas dados reais. Evite marcadores como S/N ou N/A."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AppInput
                name="unit_name"
                label="Nome da unidade"
                placeholder="Ex.: Unidade Central"
                value={unitName}
                onChange={(event) => setUnitName(event.target.value)}
                isDisabled={semNome}
                isRequired={!semNome}
                errorText={errors.unit_name}
              />
              <div className="flex items-end justify-between gap-3">
                <AppSwitch
                  checked={semNome}
                  onCheckedChange={handleToggleSemNome}
                  tone="warning"
                >
                  Unidade sem nome
                </AppSwitch>
              </div>
            </div>
          </Section>

          {semNome ? (
            <Section
              title="Status do nome"
              description="Obrigatório quando a unidade está sem nome."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <AppSelect
                  name="name_status"
                  label="Situação"
                  placeholder="Selecione"
                  options={NAME_STATUS_OPTIONS.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                  value={nameStatus}
                  onValueChange={(value) => setNameStatus(value as NameStatus)}
                  isRequired
                  errorText={errors.name_status}
                />
              </div>
            </Section>
          ) : null}

          <Section title="Observação" description="Opcional para contexto adicional.">
            <AppTextarea
              name="name_note"
              label="Nota"
              placeholder="Ex.: Informação pendente do solicitante."
              value={nameNote}
              onChange={(event) => setNameNote(event.target.value)}
              minRows={2}
            />
          </Section>
        </form>
      </FormCard>

      <AppCard>
        <AppCardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[var(--color-muted-strong)]">
              Unidades cadastradas ({units.length})
            </div>
          </div>

          <AppTable aria-label="Tabela de unidades" density="compact">
            <AppTableHeader>
              <AppTableColumn>Nome</AppTableColumn>
              <AppTableColumn>Status</AppTableColumn>
              <AppTableColumn>Nota</AppTableColumn>
              <AppTableColumn>Atualizado</AppTableColumn>
              <AppTableColumn>Ações</AppTableColumn>
            </AppTableHeader>
            <AppTableBody emptyContent="Nenhuma unidade cadastrada.">
              {units.map((unit) => (
                <AppTableRow key={unit.id}>
                  <AppTableCell>{formatUnitDisplay(unit.unit_name, unit.name_status)}</AppTableCell>
                  <AppTableCell>
                    <AppBadge tone={NAME_STATUS_BADGE_TONE[unit.name_status]}>
                      {statusLabelMap[unit.name_status]}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell>{unit.name_note?.trim() || "—"}</AppTableCell>
                  <AppTableCell>
                    {formatDateTime(unit.updated_at ?? unit.created_at ?? null)}
                  </AppTableCell>
                  <AppTableCell>
                    <AppButton variant="ghost" size="sm" onPress={() => handleEdit(unit)}>
                      Editar
                    </AppButton>
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
