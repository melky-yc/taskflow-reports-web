import { Chip, type ChipProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppBadgeVariant = "solid" | "soft" | "outline" | "ghost";
export type AppBadgeTone =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger";

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
};

export function AppBadge({
  variant = "soft",
  tone = "default",
  size = "sm",
  className,
  ...props
}: AppBadgeProps) {
  return (
    <Chip
      radius="full"
      variant={variantMap[variant]}
      color={toneMap[tone]}
      size={size}
      className={cn("font-medium", className)}
      {...props}
    />
  );
}
