"use client";

import { AppBadge, type AppBadgeProps } from "@/app/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; tone: AppBadgeProps["tone"]; variant?: AppBadgeProps["variant"] }
> = {
  Baixa: { label: "Baixa", tone: "default" },
  Media: { label: "Média", tone: "warning" },
  Alta: { label: "Alta", tone: "danger" },
  Critica: { label: "Crítica", tone: "critical", variant: "solid" },
  Retroativo: { label: "Retroativo", tone: "warning" },
  Normal: { label: "Normal", tone: "success" },
};

export type StatusBadgeProps = {
  status: string;
  className?: string;
  size?: AppBadgeProps["size"];
};

export function StatusBadge({ status, className, size }: StatusBadgeProps) {
  const match = STATUS_MAP[status];
  const label = match?.label ?? status;
  const tone = match?.tone ?? "default";
  const variant = match?.variant ?? "soft";

  return (
    <AppBadge
      tone={tone}
      variant={variant}
      size={size}
      className={cn("capitalize", className)}
    >
      {label}
    </AppBadge>
  );
}



