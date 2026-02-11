"use client";

import { Switch, type SwitchProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppSwitchTone = "default" | "primary" | "success" | "warning" | "danger";

export type AppSwitchProps = Omit<
  SwitchProps,
  "isSelected" | "defaultSelected" | "onValueChange" | "color" | "size"
> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  tone?: AppSwitchTone;
};

const toneMap: Record<AppSwitchTone, SwitchProps["color"]> = {
  default: "default",
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
};

export function AppSwitch({
  checked,
  defaultChecked,
  onCheckedChange,
  size = "md",
  tone = "primary",
  classNames,
  className,
  ...props
}: AppSwitchProps) {
  return (
    <Switch
      isSelected={checked}
      defaultSelected={defaultChecked}
      onValueChange={onCheckedChange}
      size={size}
      color={toneMap[tone]}
      className={className}
      classNames={{
        base: cn("gap-3", classNames?.base),
        wrapper: cn(
          "border border-[var(--color-border)] bg-[var(--color-muted-soft)]",
          "data-[selected=true]:border-[var(--color-primary)]",
          classNames?.wrapper
        ),
        thumb: cn(
          "bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
          classNames?.thumb
        ),
        label: cn("text-sm text-[var(--color-text)]", classNames?.label),
      }}
      {...props}
    />
  );
}

