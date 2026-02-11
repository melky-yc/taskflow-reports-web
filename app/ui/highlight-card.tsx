import type { ReactNode } from "react";
import { AppCard, AppCardBody } from "@/app/ui/card";

export type HighlightCardTone = "primary" | "warning" | "success" | "danger" | "neutral";

const TONE_STYLES: Record<HighlightCardTone, string> = {
  primary: "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  neutral: "bg-[var(--color-muted-soft)] text-[var(--color-muted-strong)]",
};

export type HighlightCardProps = {
  title: string;
  value: ReactNode;
  subtitle?: string;
  tone?: HighlightCardTone;
  icon?: ReactNode;
  badge?: ReactNode;
  footer?: ReactNode;
};

export function HighlightCard({
  title,
  value,
  subtitle,
  tone = "primary",
  icon,
  badge,
  footer,
}: HighlightCardProps) {
  return (
    <AppCard className="h-full">
      <AppCardBody className="flex h-full flex-col gap-4 p-4 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {icon ? (
              <div className={`rounded-[var(--radius-md)] p-2 ${TONE_STYLES[tone]}`}>
                {icon}
              </div>
            ) : null}
            <div className="space-y-1">
              <div className="text-xs text-[var(--color-muted)]">{title}</div>
              <div className="text-lg font-semibold text-[var(--color-text)]">
                {value}
              </div>
              {subtitle ? (
                <div className="text-xs text-[var(--color-muted)]">{subtitle}</div>
              ) : null}
            </div>
          </div>
          {badge ? <div className="flex flex-col items-end gap-2">{badge}</div> : null}
        </div>
        {footer ? (
          <div className="mt-auto text-xs text-[var(--color-muted-strong)]">
            {footer}
          </div>
        ) : null}
      </AppCardBody>
    </AppCard>
  );
}

export const InsightCard = HighlightCard;
