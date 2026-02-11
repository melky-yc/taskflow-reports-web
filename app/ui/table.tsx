"use client";

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

export type AppTableDensity = "comfortable" | "compact";

export type AppTableProps = TableProps & {
  stickyHeader?: boolean;
  density?: AppTableDensity;
};

export function AppTable({
  className,
  classNames,
  stickyHeader = false,
  density = "comfortable",
  ...props
}: AppTableProps) {
  const baseOverride = typeof classNames?.base === "string" ? classNames.base : undefined;
  const tableOverride =
    typeof classNames?.table === "string" ? classNames.table : undefined;
  const theadOverride =
    typeof classNames?.thead === "string" ? classNames.thead : undefined;
  const thOverride = typeof classNames?.th === "string" ? classNames.th : undefined;
  const tbodyOverride =
    typeof classNames?.tbody === "string" ? classNames.tbody : undefined;
  const trOverride = typeof classNames?.tr === "string" ? classNames.tr : undefined;
  const tdOverride = typeof classNames?.td === "string" ? classNames.td : undefined;
  const emptyOverride =
    typeof classNames?.emptyWrapper === "string"
      ? classNames.emptyWrapper
      : undefined;
  const paddingClass = density === "compact" ? "px-3 py-2" : "px-4 py-3";

  return (
    <Table
      className={cn("min-w-full", className)}
      classNames={{
        base: cn(
          "overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]",
          "shadow-[var(--shadow-card)]",
          baseOverride
        ),
        table: cn("min-w-full text-sm", tableOverride),
        thead: cn(
          "bg-[var(--color-muted-soft)]",
          stickyHeader && "sticky top-0 z-10 shadow-[0_1px_0_var(--color-border)]",
          theadOverride
        ),
        th: cn(
          `${paddingClass} text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]`,
          thOverride
        ),
        tbody: cn("divide-y divide-[var(--color-border)]", tbodyOverride),
        tr: cn(
          "text-[var(--color-text)] hover:bg-[var(--color-muted-soft)]",
          trOverride
        ),
        td: cn(paddingClass, tdOverride),
        emptyWrapper: cn(
          "px-6 py-10 text-sm text-[var(--color-muted)]",
          emptyOverride
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

