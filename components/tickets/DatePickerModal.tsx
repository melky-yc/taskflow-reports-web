"use client";

import { useState } from "react";
import { AppButton, AppInput, AppModal } from "@/app/ui";

type DatePickerModalProps = {
  title?: string;
  valueIso: string;
  maxIso: string;
  onCancel: () => void;
  onConfirm: (valueIso: string) => void;
};

export default function DatePickerModal({
  title = "Selecionar data",
  valueIso,
  maxIso,
  onCancel,
  onConfirm,
}: DatePickerModalProps) {
  const [draft, setDraft] = useState(valueIso);

  return (
    <AppModal
      isOpen
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={title}
      description="Defina a data de atendimento para o chamado."
      size="sm"
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <AppButton variant="ghost" size="sm" type="button" onPress={onCancel}>
            Cancelar
          </AppButton>
          <AppButton
            size="sm"
            type="button"
            onPress={() => onConfirm(draft)}
            isDisabled={!draft}
          >
            Confirmar
          </AppButton>
        </div>
      }
    >
      <div className="space-y-3">
        <AppInput
          type="date"
          label="Data de atendimento"
          value={draft}
          max={maxIso}
          onChange={(event) => setDraft(event.target.value)}
          helperText="Apenas hoje ou datas anteriores."
          isRequired
        />
      </div>
    </AppModal>
  );
}