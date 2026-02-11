"use client";

import { AppCard, AppCardBody } from "@/app/ui/card";
import type { ReactNode } from "react";

export type StatCardTone = "primary" | "warning" | "success" | "danger" | "neutral";

const TONE_STYLES: Record<StatCardTone, string> = {
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral: "bg-[var(--color-muted-soft)] text-[var(--color-muted-strong)]",
};

export type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  meta?: string;
  icon?: ReactNode;
  tone?: StatCardTone;
};

export function StatCard({
  title,
  value,
  description,
  meta,
  icon,
  tone = "primary",
}: StatCardProps) {
  return (
    <AppCard className="h-full">
      <AppCardBody className="flex h-full flex-col gap-3 p-4 md:p-6">
        <div className="flex items-start gap-3">
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
          </div>
        </div>
        {meta ? (
          <div className="text-xs text-[var(--color-muted-strong)]">{meta}</div>
        ) : null}
      </AppCardBody>
    </AppCard>
  );
}

