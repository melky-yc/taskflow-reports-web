"use client";

import { AppChip } from "@/app/ui";

export type ActiveFilterChip = {
  id: string;
  label: string;
  onRemove: () => void;
};

export default function ActiveFiltersChips({ items }: { items: ActiveFilterChip[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <AppChip
          key={item.id}
          variant="outline"
          tone="default"
          size="sm"
          onClose={item.onRemove}
          className="pl-3 pr-2 text-xs text-[var(--color-muted-strong)]"
          aria-label={`Remover filtro ${item.label}`}
        >
          {item.label}
        </AppChip>
      ))}
    </div>
  );
}
