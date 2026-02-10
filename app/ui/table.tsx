import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  type TableProps,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export function AppTable({ className, classNames, ...props }: TableProps) {
  return (
    <Table
      className={cn("min-w-full", className)}
      classNames={{
        base: cn(
          "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
          "shadow-[var(--shadow-card)]",
          classNames?.base
        ),
        table: cn("min-w-full text-sm", classNames?.table),
        thead: cn("bg-[var(--color-muted-soft)]", classNames?.thead),
        th: cn(
          "px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]",
          classNames?.th
        ),
        tbody: cn("divide-y divide-[var(--color-border)]", classNames?.tbody),
        tr: cn(
          "text-[var(--color-text)] hover:bg-[var(--color-muted-soft)]",
          classNames?.tr
        ),
        td: cn("px-3 py-3", classNames?.td),
        emptyWrapper: cn(
          "px-6 py-10 text-sm text-[var(--color-muted)]",
          classNames?.emptyWrapper
        ),
      }}
      {...props}
    />
  );
}

export {
  TableHeader as AppTableHeader,
  TableBody as AppTableBody,
  TableColumn as AppTableColumn,
  TableRow as AppTableRow,
  TableCell as AppTableCell,
};
