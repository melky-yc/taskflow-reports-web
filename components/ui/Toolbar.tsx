"use client";

import type { ReactNode } from "react";
import { AppCard, AppCardBody } from "@/app/ui";
import { cn } from "@/lib/utils";

export type ToolbarProps = {
  left: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Toolbar({
  left,
  center,
  right,
  className,
  bodyClassName,
}: ToolbarProps) {
  return (
    <AppCard className={cn("border border-[var(--color-border)]", className)}>
      <AppCardBody className={cn("min-h-12 p-3 sm:p-4 md:p-4", bodyClassName)}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex min-w-0 items-center gap-2">{left}</div>
          {center ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 md:flex-1 md:justify-center">
              {center}
            </div>
          ) : null}
          {right ? (
            <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-[var(--color-muted)] md:justify-end">
              {right}
            </div>
          ) : null}
        </div>
      </AppCardBody>
    </AppCard>
  );
}
