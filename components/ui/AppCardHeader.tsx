"use client";

import type { ReactNode } from "react";
import {
  AppCardDescription,
  AppCardHeader as BaseCardHeader,
  AppCardTitle,
} from "@/app/ui";
import { cn } from "@/lib/utils";

export type AppCardHeaderAlign = "left" | "center";

export type AppCardHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  align?: AppCardHeaderAlign;
  className?: string;
};

export default function AppCardHeader({
  title,
  subtitle,
  action,
  align = "left",
  className,
}: AppCardHeaderProps) {
  const isCenter = align === "center";

  return (
    <BaseCardHeader
      className={cn(
        "flex w-full flex-row items-start justify-between gap-4 text-left",
        isCenter && "items-center text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-1",
          isCenter && "items-center"
        )}
      >
        <AppCardTitle className="text-base">{title}</AppCardTitle>
        {subtitle ? <AppCardDescription>{subtitle}</AppCardDescription> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </BaseCardHeader>
  );
}
