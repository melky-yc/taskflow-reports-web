"use client";

import { Filter } from "lucide-react";
import { AppButton } from "@/app/ui/button";
import { AppModal, type AppModalSize } from "@/app/ui/modal";

export type FilterModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  onApply?: () => void;
  onClear?: () => void;
  applyLabel?: string;
  clearLabel?: string;
  isLoading?: boolean;
  triggerLabel?: string;
  trigger?: React.ReactNode;
  size?: AppModalSize;
  closeOnApply?: boolean;
};

export function FilterModal({
  isOpen,
  onOpenChange,
  title = "Filtros",
  description,
  children,
  onApply,
  onClear,
  applyLabel = "Aplicar",
  clearLabel = "Limpar",
  isLoading,
  triggerLabel = "Filtros",
  trigger,
  size = "lg",
  closeOnApply = true,
}: FilterModalProps) {
  const footer = onApply ? (
    <div className="flex w-full items-center justify-between gap-2">
      {onClear ? (
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          onPress={onClear}
          isDisabled={isLoading}
        >
          {clearLabel}
        </AppButton>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">
        <AppButton
          type="button"
          variant="ghost"
          size="sm"
          onPress={() => onOpenChange(false)}
        >
          Cancelar
        </AppButton>
        <AppButton
          type="button"
          size="sm"
          onPress={() => {
            onApply();
            if (closeOnApply) {
              onOpenChange(false);
            }
          }}
          isLoading={isLoading}
        >
          {applyLabel}
        </AppButton>
      </div>
    </div>
  ) : null;

  return (
    <>
      {trigger ?? (
        <AppButton
          type="button"
          variant="soft"
          size="sm"
          startContent={<Filter className="h-4 w-4" />}
          onPress={() => onOpenChange(true)}
          aria-label={triggerLabel}
        >
          {triggerLabel}
        </AppButton>
      )}
      <AppModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        size={size}
        footer={footer ?? undefined}
      >
        {children}
      </AppModal>
    </>
  );
}

