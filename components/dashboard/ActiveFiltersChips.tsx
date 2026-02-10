"use client";

import { X } from "lucide-react";

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
        <span
          key={item.id}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-muted-strong)]"
        >
          <span>{item.label}</span>
          <button
            type="button"
            onClick={item.onRemove}
            aria-label={`Remover filtro ${item.label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-muted-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
