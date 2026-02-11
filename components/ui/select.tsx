import * as React from "react";
import { AppSelect, type AppSelectProps, type SelectOption } from "@/app/ui";

type SelectProps = Omit<AppSelectProps, "options" | "onValueChange" | "value"> & {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  options?: SelectOption[];
  children?: React.ReactNode;
};

function buildOptionsFromChildren(children?: React.ReactNode): SelectOption[] {
  if (!children) return [];
  const options: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (
      !React.isValidElement<{
        value?: string | number;
        disabled?: boolean;
        children?: React.ReactNode;
      }>(child)
    )
      return;
    if (child.type !== "option") return;
    const value = String(child.props.value ?? "");
    const label = String(child.props.children ?? value);
    options.push({ value, label, isDisabled: child.props.disabled });
  });
  return options;
}

function Select({ options, children, value, onChange, ...props }: SelectProps) {
  const selectOptions = options ?? buildOptionsFromChildren(children);
  return (
    <AppSelect
      options={selectOptions}
      value={value}
      onValueChange={(nextValue) => {
        if (onChange) {
          const event = {
            target: { value: nextValue },
          } as React.ChangeEvent<HTMLSelectElement>;
          onChange(event);
        }
      }}
      {...props}
    />
  );
}

export { Select };
