import { Select, SelectItem, type SelectProps } from "@heroui/react";
import { useMemo } from "react";

export type SelectOption = {
  value: string;
  label: string;
  isDisabled?: boolean;
};

export type AppSelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  errorText?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  name?: string;
  size?: "sm" | "md" | "lg";
  variant?: "bordered" | "faded" | "flat" | "underlined";
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  className?: string;
  classNames?: SelectProps["classNames"];
};

export function AppSelect({
  options,
  value,
  defaultValue,
  onValueChange,
  label,
  placeholder,
  helperText,
  errorText,
  isRequired,
  isDisabled,
  name,
  size = "md",
  variant = "bordered",
  startContent,
  endContent,
  className,
  classNames,
}: AppSelectProps) {
  const selectedKeys = useMemo(() => {
    if (value === undefined) return undefined;
    if (!value) return new Set<string>();
    return new Set([value]);
  }, [value]);

  const defaultSelectedKeys = useMemo(() => {
    if (value !== undefined) return undefined;
    if (!defaultValue) return undefined;
    return new Set([defaultValue]);
  }, [defaultValue, value]);

  return (
    <Select
      aria-label={label || "Selecionar"}
      label={label}
      placeholder={placeholder}
      description={helperText}
      errorMessage={errorText}
      isInvalid={Boolean(errorText)}
      isRequired={isRequired}
      isDisabled={isDisabled}
      name={name}
      selectionMode="single"
      size={size}
      variant={variant}
      radius="md"
      selectedKeys={selectedKeys}
      defaultSelectedKeys={defaultSelectedKeys}
      onSelectionChange={(keys) => {
        const valueKey = Array.from(keys)[0];
        onValueChange?.(valueKey ? String(valueKey) : "");
      }}
      startContent={startContent}
      endContent={endContent}
      className={className}
      classNames={{
        label: "text-xs font-medium text-[var(--color-muted-strong)]",
        trigger:
          "bg-[var(--color-surface)] border border-[var(--color-border)] data-[hover=true]:border-[var(--color-primary-soft)]",
        value: "text-[var(--color-text)]",
        description: "text-xs text-[var(--color-muted)]",
        errorMessage: "text-xs text-[var(--color-danger)]",
        ...classNames,
      }}
    >
      {options.map((option) => (
        <SelectItem key={option.value} isDisabled={option.isDisabled}>
          {option.label}
        </SelectItem>
      ))}
    </Select>
  );
}
