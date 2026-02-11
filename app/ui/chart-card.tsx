import type { ReactNode } from "react";
import { AppCard, AppCardBody, AppCardHeader, AppCardTitle, AppCardDescription } from "@/app/ui/card";
import { cn } from "@/lib/utils";

export type ChartCardProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function ChartCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: ChartCardProps) {
  return (
    <AppCard className={cn("h-full", className)}>
      <AppCardHeader className="flex flex-col gap-3 p-4 pb-0 md:p-6 md:pb-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <AppCardTitle className="text-base">{title}</AppCardTitle>
            {description ? (
              <AppCardDescription>{description}</AppCardDescription>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {action}
            {icon ? (
              <span className="text-[var(--color-muted)]">{icon}</span>
            ) : null}
          </div>
        </div>
      </AppCardHeader>
      <AppCardBody className={cn("p-4 pt-4 md:p-6 md:pt-4", bodyClassName)}>
        {children}
      </AppCardBody>
    </AppCard>
  );
}
