import { Divider, type DividerProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export function AppDivider({ className, ...props }: DividerProps) {
  return (
    <Divider
      className={cn("bg-[var(--color-border)]", className)}
      {...props}
    />
  );
}
