"use client";

import { AlertTriangle } from "lucide-react";

export default function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-4 py-6 text-sm text-[var(--color-muted-strong)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">{label}</div>
    </div>
  );
}
