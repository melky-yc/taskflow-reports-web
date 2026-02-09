"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
} & React.HTMLAttributes<HTMLDivElement>;

function Tabs({ value, defaultValue, onValueChange, className, ...props }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isControlled = typeof value === "string";
  const currentValue = isControlled ? (value as string) : internalValue;

  const setValue = (next: string) => {
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue }}>
      <div className={cn("w-full", className)} {...props} />
    </TabsContext.Provider>
  );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

function TabsList({ className, ...props }: TabsListProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted-soft)] p-1",
        className
      )}
      {...props}
    />
  );
}

type TabsTriggerProps = {
  value: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) return null;
  const active = context.value === value;
  return (
    <button
      type="button"
      data-state={active ? "active" : "inactive"}
      onClick={() => context.setValue(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium text-[color:var(--color-muted-strong)] transition data-[state=active]:bg-[color:var(--color-surface)] data-[state=active]:text-[color:var(--color-text)] data-[state=active]:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

type TabsContentProps = {
  value: string;
} & React.HTMLAttributes<HTMLDivElement>;

function TabsContent({ className, value, ...props }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context || context.value !== value) return null;
  return <div className={cn("mt-4", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
