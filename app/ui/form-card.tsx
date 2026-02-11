import type { ReactNode } from "react";
import {
  AppCard,
  AppCardBody,
  AppCardDescription,
  AppCardFooter,
  AppCardHeader,
  AppCardTitle,
} from "@/app/ui/card";
import { cn } from "@/lib/utils";

export type FormCardProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function FormCard({
  title,
  description,
  actions,
  footer,
  children,
  className,
  bodyClassName,
}: FormCardProps) {
  return (
    <AppCard className={cn("h-full", className)}>
      {title ? (
        <AppCardHeader className="flex flex-col gap-3 p-4 pb-0 md:p-6 md:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <AppCardTitle className="text-base">{title}</AppCardTitle>
              {description ? (
                <AppCardDescription>{description}</AppCardDescription>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </AppCardHeader>
      ) : null}
      <AppCardBody className={cn("p-4 pt-4 md:p-6 md:pt-4", bodyClassName)}>
        {children}
      </AppCardBody>
      {footer ? (
        <AppCardFooter className="border-t border-[var(--color-border)] p-4 md:p-6">
          {footer}
        </AppCardFooter>
      ) : null}
    </AppCard>
  );
}
