"use client";

import { Input, type InputProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppInputProps = Omit<
  InputProps,
  "variant" | "color" | "size" | "radius" | "label" | "description" | "errorMessage"
> & {
  label?: string;
  helperText?: string;
  errorText?: string;
  variant?: "bordered" | "faded" | "flat" | "underlined";
  size?: "sm" | "md" | "lg";
};

export function AppInput({
  label,
  helperText,
  errorText,
  isInvalid,
  variant = "bordered",
  size = "md",
  classNames,
  className,
  ...props
}: AppInputProps) {
  const hasError = Boolean(errorText) || Boolean(isInvalid);
  const { inputWrapper: inputWrapperOverride, ...restClassNames } = classNames ?? {};

  return (
    <Input
      label={label}
      description={helperText}
      errorMessage={errorText}
      isInvalid={hasError}
      variant={variant}
      size={size}
      radius="md"
      classNames={{
        label: "text-xs font-medium text-[var(--color-muted-strong)]",
        inputWrapper: cn(
          "bg-[var(--color-surface)] border border-[var(--color-border)] data-[hover=true]:border-[var(--color-primary-soft)]",
          className,
          inputWrapperOverride
        ),
        input: "text-[var(--color-text)] placeholder:text-[var(--color-muted)]",
        description: "text-xs text-[var(--color-muted)]",
        errorMessage: "text-xs text-[var(--color-danger)]",
        ...restClassNames,
      }}
      {...props}
    />
  );
}

