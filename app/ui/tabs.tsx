import { Tab, Tabs, type TabItemProps, type TabsProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppTabsProps = Omit<TabsProps, "radius" | "variant" | "color">;

export function AppTabs({ classNames, ...props }: AppTabsProps) {
  return (
    <Tabs
      variant="light"
      radius="md"
      classNames={{
        base: "w-full",
        tabList: cn(
          "rounded-[var(--radius-md)] border border-[var(--color-border)]",
          "bg-[var(--color-muted-soft)] p-1"
        ),
        tab: "text-[var(--color-muted-strong)]",
        tabContent: "text-sm font-medium",
        cursor: "bg-[var(--color-surface)] shadow-[var(--shadow-card)]",
        panel: "pt-4",
        ...classNames,
      }}
      {...props}
    />
  );
}

export type AppTabProps = TabItemProps;

export function AppTab({ className, ...props }: AppTabProps) {
  return (
    <Tab
      className={cn(
        "data-[selected=true]:text-[var(--color-text)]",
        "data-[selected=true]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}
