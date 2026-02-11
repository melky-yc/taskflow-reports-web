"use client";

import type { ReactNode } from "react";
import { AppDivider } from "@/app/ui/divider";
import { cn } from "@/lib/utils";

export type SectionProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  showDivider?: boolean;
  className?: string;
  contentClassName?: string;
  dividerClassName?: string;
};

export function Section({
  title,
  description,
  aside,
  children,
  showDivider = true,
  className,
  contentClassName,
  dividerClassName,
}: SectionProps) {
  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)]">
            {title}
          </h3>
          {description ? (
            <p className="text-sm text-[var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {aside ? <div className="flex items-center gap-2">{aside}</div> : null}
      </div>
      {showDivider ? <AppDivider className={dividerClassName} /> : null}
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}

