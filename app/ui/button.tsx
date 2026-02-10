import { Button, type ButtonProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppButtonVariant =
  | "solid"
  | "soft"
  | "ghost"
  | "danger"
  | "success"
  | "warning"
  | "elevated";

export type AppButtonSize = "sm" | "md" | "lg";

export type AppButtonProps = Omit<ButtonProps, "variant" | "color" | "size" | "radius"> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
};

const variantMap: Record<
  AppButtonVariant,
  { variant: ButtonProps["variant"]; color: ButtonProps["color"]; className?: string }
> = {
  solid: { variant: "solid", color: "primary" },
  soft: { variant: "flat", color: "primary" },
  ghost: { variant: "ghost", color: "default", className: "text-[var(--color-muted-strong)]" },
  danger: { variant: "solid", color: "danger" },
  success: { variant: "solid", color: "success" },
  warning: { variant: "solid", color: "warning" },
  elevated: { variant: "shadow", color: "primary" },
};

export function AppButton({
  variant = "solid",
  size = "md",
  className,
  ...props
}: AppButtonProps) {
  const map = variantMap[variant];

  return (
    <Button
      radius="md"
      variant={map.variant}
      color={map.color}
      size={size}
      className={cn("font-semibold", map.className, className)}
      {...props}
    />
  );
}
