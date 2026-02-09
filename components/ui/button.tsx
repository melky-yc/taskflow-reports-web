import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60";
    const variants: Record<typeof variant, string> = {
      primary:
        "bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)] shadow-sm hover:bg-[color:var(--color-primary-hover)]",
      secondary:
        "bg-[color:var(--color-muted-soft)] text-[color:var(--color-text)] hover:bg-[color:var(--color-border)]",
      ghost:
        "text-[color:var(--color-muted-strong)] hover:bg-[color:var(--color-muted-soft)]",
      outline:
        "border border-[color:var(--color-border)] text-[color:var(--color-text)] hover:bg-[color:var(--color-muted-soft)]",
    } as const;
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(
          base,
          variants[variant],
          "h-11 px-4",
          className,
          child.props.className
        ),
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], "h-11 px-4", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
