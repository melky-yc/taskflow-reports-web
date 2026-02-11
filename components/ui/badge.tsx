import * as React from "react";
import { AppBadge, type AppBadgeProps, type AppBadgeTone } from "@/app/ui";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "muted" | "success" | "warning" | "danger" | "critical";

type BadgeProps = Omit<AppBadgeProps, "variant" | "tone"> & {
  variant?: BadgeVariant;
};

const TONE_MAP: Record<BadgeVariant, AppBadgeTone> = {
  default: "primary",
  muted: "default",
  success: "success",
  warning: "warning",
  danger: "danger",
  critical: "critical",
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <AppBadge
        ref={ref as React.Ref<HTMLDivElement>}
        variant="soft"
        tone={TONE_MAP[variant]}
        className={cn("font-semibold", className)}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
