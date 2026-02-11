"use client";

import { Chip, type ChipProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppBadgeVariant = "solid" | "soft" | "outline" | "ghost";
export type AppBadgeTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "critical";

export type AppBadgeProps = Omit<ChipProps, "variant" | "color" | "radius" | "size"> & {
  variant?: AppBadgeVariant;
  tone?: AppBadgeTone;
  size?: "sm" | "md" | "lg";
};

const variantMap: Record<AppBadgeVariant, ChipProps["variant"]> = {
  solid: "solid",
  soft: "flat",
  outline: "bordered",
  ghost: "light",
};

const toneMap: Record<AppBadgeTone, ChipProps["color"]> = {
  default: "default",
  primary: "primary",
  success: "success",
  warning: "warning",
  danger: "danger",
  critical: "default",
};

const criticalToneClasses: Record<AppBadgeVariant, string> = {
  solid: "bg-[var(--color-critical)] text-white",
  soft: "bg-[var(--color-critical-soft)] text-[var(--color-critical)]",
  outline: "border border-[var(--color-critical)] text-[var(--color-critical)]",
  ghost: "text-[var(--color-critical)]",
};

export function AppBadge({
  variant = "soft",
  tone = "default",
  size = "sm",
  className,
  ...props
}: AppBadgeProps) {
  const criticalClasses =
    tone === "critical" ? criticalToneClasses[variant] : undefined;

  return (
    <Chip
      radius="full"
      variant={variantMap[variant]}
      color={toneMap[tone]}
      size={size}
      className={cn("font-medium", criticalClasses, className)}
      {...props}
    />
  );
}

export type AppChipProps = AppBadgeProps;
export const AppChip = AppBadge;

