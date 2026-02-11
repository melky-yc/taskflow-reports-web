import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  type DropdownItemProps,
  type DropdownMenuProps,
  type DropdownProps,
  type DropdownSectionProps,
  type DropdownTriggerProps,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export function AppDropdown(props: DropdownProps) {
  return <Dropdown {...props} />;
}

export function AppDropdownTrigger(props: DropdownTriggerProps) {
  return <DropdownTrigger {...props} />;
}

export function AppDropdownMenu<T extends object>({
  classNames,
  itemClasses,
  ...props
}: DropdownMenuProps<T>) {
  return (
    <DropdownMenu
      classNames={{
        base: cn(
          "min-w-[220px] rounded-[var(--radius-lg)] border border-[var(--color-border)]",
          "bg-[var(--color-surface)] p-2 shadow-[var(--shadow-popover)]",
          classNames?.base
        ),
        list: cn("gap-1", classNames?.list),
        ...classNames,
      }}
      itemClasses={{
        base: cn(
          "rounded-md px-3 py-2 text-sm text-[var(--color-text)]",
          "data-[hover=true]:bg-[var(--color-muted-soft)]",
          itemClasses?.base
        ),
        description: cn("text-xs text-[var(--color-muted)]", itemClasses?.description),
        ...itemClasses,
      }}
      {...props}
    />
  );
}

export function AppDropdownItem({ className, ...props }: DropdownItemProps) {
  return <DropdownItem className={cn("gap-2", className)} {...props} />;
}

export function AppDropdownSection({
  className,
  ...props
}: DropdownSectionProps) {
  return (
    <DropdownSection
      className={cn("text-xs text-[var(--color-muted)]", className)}
      {...props}
    />
  );
}
