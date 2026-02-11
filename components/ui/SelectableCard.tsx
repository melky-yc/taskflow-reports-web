"use client";

import { cloneElement, isValidElement, type ReactNode } from "react";
import { AppCard, AppCardBody } from "@/app/ui";
import { cn } from "@/lib/utils";

export type SelectableCardProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

export function SelectableCard({
  title,
  description,
  icon,
  selected = false,
  onPress,
  className,
}: SelectableCardProps) {
  const renderedIcon = isValidElement<{ className?: string }>(icon)
    ? cloneElement(icon, {
        className: cn("h-4 w-4", icon.props.className),
      })
    : icon;

  return (
    <AppCard
      isPressable={Boolean(onPress)}
      onPress={onPress}
      className={cn(
        "transition",
        selected
          ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]",
        className
      )}
    >
      <AppCardBody className="flex items-start gap-3 p-4 md:p-6">
        {icon ? (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-muted-soft)] text-[var(--color-muted-strong)]">
            {renderedIcon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text)]">{title}</div>
          {description ? (
            <div className="mt-1 text-xs text-[var(--color-muted)]">
              {description}
            </div>
          ) : null}
        </div>
      </AppCardBody>
    </AppCard>
  );
}
