"use client";

import { Tooltip, type TooltipProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppTooltipProps = TooltipProps;

export function AppTooltip({ classNames, ...props }: AppTooltipProps) {
  return (
    <Tooltip
      classNames={{
        ...classNames,
        content: cn(
          "rounded-md border border-[var(--color-border)]",
          "bg-[var(--color-surface)] text-xs text-[var(--color-text)]",
          "shadow-[var(--shadow-popover)]",
          classNames?.content
        ),
        arrow: cn("bg-[var(--color-surface)]", classNames?.arrow),
      }}
      {...props}
    />
  );
}

