import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "success" | "warning" | "danger";
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<typeof variant, string> = {
      default:
        "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
      muted:
        "bg-[var(--color-muted-soft)] text-[var(--color-muted-strong)]",
      success: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
      warning: "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
      danger: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    };
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
