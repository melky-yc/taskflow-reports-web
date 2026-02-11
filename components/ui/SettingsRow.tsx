"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SettingsRowProps = {
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function SettingsRow({
  title,
  description,
  right,
  className,
}: SettingsRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col text-left">
        <div className="text-sm font-medium text-[var(--color-text)]">{title}</div>
        {description ? (
          <div className="text-xs text-[var(--color-muted)]">{description}</div>
        ) : null}
      </div>
      {right ? <div className="flex shrink-0 items-center gap-2">{right}</div> : null}
    </div>
  );
}
