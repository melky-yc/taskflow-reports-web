import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormSectionProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function FormSection({
  title,
  description,
  aside,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
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
      <div className={cn("space-y-4", contentClassName)}>{children}</div>
    </section>
  );
}
