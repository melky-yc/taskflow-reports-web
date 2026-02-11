"use client";

import type { ReactNode } from "react";
import {
  AppCard,
  AppCardBody,
  AppCardFooter,
} from "@/app/ui/card";
import AppCardHeader from "@/components/ui/AppCardHeader";
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
        <AppCardHeader
          title={title}
          subtitle={description}
          action={actions}
          className="p-4 pb-0 md:p-6 md:pb-0"
        />
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

