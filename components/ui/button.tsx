import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  asChild?: boolean;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-60";
    const variants: Record<typeof variant, string> = {
      primary:
        "bg-[color:var(--primary)] text-white shadow-sm hover:bg-[color:var(--primary-hover)]",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200",
      ghost: "text-slate-600 hover:bg-slate-100",
      outline:
        "border border-slate-200 text-slate-700 hover:bg-slate-50",
    } as const;
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(
          base,
          variants[variant],
          "h-11 px-4",
          className,
          (children.props as { className?: string }).className
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
