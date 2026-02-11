import * as React from "react";
import { AppButton, type AppButtonProps } from "@/app/ui";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  asChild?: boolean;
};

const VARIANT_MAP: Record<ButtonVariant, AppButtonProps["variant"]> = {
  primary: "solid",
  secondary: "soft",
  ghost: "ghost",
  outline: "ghost",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", asChild, children, ...props }, ref) => {
    const mappedVariant = VARIANT_MAP[variant];
    const outlineClasses =
      variant === "outline"
        ? "border border-[var(--color-border)] text-[var(--color-text)]"
        : undefined;
    const secondaryClasses =
      variant === "secondary"
        ? "bg-[var(--color-muted-soft)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
        : undefined;

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{
        className?: string;
        children?: React.ReactNode;
      }>;

      return (
        <AppButton
          ref={ref as React.Ref<HTMLButtonElement>}
          as={child.type as AppButtonProps["as"]}
          variant={mappedVariant}
          className={cn(
            outlineClasses,
            secondaryClasses,
            className,
            child.props.className
          )}
          {...props}
          {...child.props}
        >
          {child.props.children}
        </AppButton>
      );
    }

    return (
      <AppButton
        ref={ref as React.Ref<HTMLButtonElement>}
        variant={mappedVariant}
        className={cn(outlineClasses, secondaryClasses, className)}
        {...props}
      >
        {children}
      </AppButton>
    );
  }
);
Button.displayName = "Button";

export { Button };
