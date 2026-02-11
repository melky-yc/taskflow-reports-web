"use client";

import { Tab, Tabs, type TabItemProps, type TabsProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppTabsProps = Omit<TabsProps, "radius" | "variant" | "color">;

export function AppTabs({ classNames, ...props }: AppTabsProps) {
  return (
    <Tabs
      variant="light"
      radius="md"
      classNames={{
        base: cn("w-full", classNames?.base),
        tabList: cn(
          "rounded-[var(--radius-md)] border border-[var(--color-border)]",
          "bg-[var(--color-muted-soft)] p-1",
          "max-w-full overflow-x-auto whitespace-nowrap",
          classNames?.tabList
        ),
        tab: cn(
          "shrink-0 text-[var(--color-muted-strong)]",
          "data-[selected=true]:text-[var(--color-text)] data-[selected=true]:shadow-sm",
          classNames?.tab
        ),
        tabContent: cn("text-sm font-medium", classNames?.tabContent),
        cursor: cn("bg-[var(--color-surface)] shadow-[var(--shadow-card)]", classNames?.cursor),
        panel: cn("pt-4", classNames?.panel),
      }}
      {...props}
    />
  );
}

export type AppTabProps = TabItemProps;

export const AppTab = Tab;

