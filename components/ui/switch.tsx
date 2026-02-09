"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange">;

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    { className, checked, defaultChecked, onCheckedChange, disabled, ...props },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(
      defaultChecked ?? false
    );
    const isControlled = typeof checked === "boolean";
    const isChecked = isControlled ? checked : internalChecked;

    const toggle = () => {
      if (disabled) return;
      const next = !isChecked;
      if (!isControlled) {
        setInternalChecked(next);
      }
      onCheckedChange?.(next);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        data-state={isChecked ? "checked" : "unchecked"}
        disabled={disabled}
        onClick={toggle}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full border border-() bg-() transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-() disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-() data-[state=checked]:bg-()",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 translate-x-0 rounded-full bg-() shadow transition",
            isChecked && "translate-x-5"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export { Switch };

