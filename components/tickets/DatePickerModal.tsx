"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 py-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--color-muted-strong)]">
              Data de atendimento
            </label>
            <input
              type="date"
              value={draft}
              max={maxIso}
              onChange={(event) => setDraft(event.target.value)}
              className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            />
            <p className="text-xs text-[var(--color-muted)]">
              Apenas hoje ou datas anteriores.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" className="h-8 px-3 text-xs" onClick={onCancel}>
              Cancelar
            </Button>
            <Button
              className="h-8 px-4 text-xs"
              onClick={() => onConfirm(draft)}
              disabled={!draft}
            >
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
