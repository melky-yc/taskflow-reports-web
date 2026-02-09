import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "muted" | "success" | "warning" | "danger";
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants: Record<typeof variant, string> = {
      default:
        "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]",
      muted:
        "bg-[color:var(--color-muted-soft)] text-[color:var(--color-muted-strong)]",
      success: "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]",
      warning: "bg-[color:var(--color-warning-soft)] text-[color:var(--color-warning)]",
      danger: "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
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
