import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-() disabled:cursor-not-allowed disabled:opacity-60";
    const variants: Record<typeof variant, string> = {
      primary:
        "bg-() text-() shadow-sm hover:bg-()",
      secondary:
        "bg-() text-() hover:bg-()",
      ghost:
        "text-() hover:bg-()",
      outline:
        "border border-() text-() hover:bg-()",
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

