"use client";

import type { ReactNode } from "react";
import { AppCard, AppCardBody } from "@/app/ui/card";

export type KpiTone = "primary" | "warning" | "success" | "danger";

const TONE_STYLES: Record<KpiTone, string> = {
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

export type KpiCardProps = {
  title: string;
  value: string;
  delta?: string;
  description?: string;
  icon?: ReactNode;
  tone?: KpiTone;
};

export function KpiCard({
  title,
  value,
  delta,
  description,
  icon,
  tone = "primary",
}: KpiCardProps) {
  return (
    <AppCard>
      <AppCardBody className="flex items-start gap-3 p-4">
        {icon ? (
          <div className={`rounded-[var(--radius-md)] p-2 ${TONE_STYLES[tone]}`}>
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <div className="text-xs text-[var(--color-muted)]">{title}</div>
          <div className="text-2xl font-semibold text-[var(--color-text)]">
            {value}
          </div>
          {description ? (
            <div className="text-xs text-[var(--color-muted)]">{description}</div>
          ) : null}
          {delta ? (
            <div className="text-xs text-[var(--color-muted-strong)]">{delta}</div>
          ) : null}
        </div>
      </AppCardBody>
    </AppCard>
  );
}

