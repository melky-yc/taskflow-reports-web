"use client";

import type { ReactNode } from "react";
import { AppCard, AppCardBody } from "@/app/ui/card";
import AppCardHeader from "@/components/ui/AppCardHeader";
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
  const actionNode = action || icon ? (
    <div className="flex items-center gap-2">
      {action}
      {icon ? <span className="text-[var(--color-muted)]">{icon}</span> : null}
    </div>
  ) : null;

  return (
    <AppCard className={cn("h-full", className)}>
      <AppCardHeader
        title={title}
        subtitle={description}
        action={actionNode}
        className="p-4 pb-0 md:p-6 md:pb-0"
      />
      <AppCardBody className={cn("p-4 pt-4 md:p-6 md:pt-4", bodyClassName)}>
        {children}
      </AppCardBody>
    </AppCard>
  );
}

