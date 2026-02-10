"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

type KpiTone = "primary" | "warning" | "success" | "danger";

const TONE_STYLES: Record<KpiTone, string> = {
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

type KpiCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description?: string;
  meta?: string;
  tone?: KpiTone;
};

export default function KpiCard({
  icon,
  label,
  value,
  description,
  meta,
  tone = "primary",
}: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div className={`rounded-lg p-2 ${TONE_STYLES[tone]}`}>{icon}</div>
        <div className="space-y-1">
          <div className="text-xs text-[var(--color-muted)]">{label}</div>
          <div className="text-2xl font-semibold text-[var(--color-text)]">{value}</div>
          {description ? (
            <div className="text-xs text-[var(--color-muted)]">{description}</div>
          ) : null}
          {meta ? (
            <div className="text-xs text-[var(--color-muted-strong)]">{meta}</div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
