"use client";

import { Alert, type AlertProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppAlertTone = "primary" | "info" | "success" | "warning" | "danger";

export type AppAlertProps = Omit<AlertProps, "color" | "variant"> & {
  tone?: AppAlertTone;
  variant?: AlertProps["variant"];
};

const toneMap: Record<AppAlertTone, AlertProps["color"]> = {
  primary: "primary",
  info: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function AppAlert({
  tone = "info",
  variant = "flat",
  classNames,
  ...props
}: AppAlertProps) {
  return (
    <Alert
      color={toneMap[tone]}
      variant={variant}
      classNames={{
        base: cn("border border-[var(--color-border)]", classNames?.base),
        title: cn("text-sm font-semibold", classNames?.title),
        description: cn("text-sm text-[var(--color-muted)]", classNames?.description),
        ...classNames,
      }}
      {...props}
    />
  );
}

