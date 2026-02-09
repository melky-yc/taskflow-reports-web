import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-11 w-full rounded-lg border border-() bg-() px-3 text-sm text-() shadow-sm outline-none transition placeholder:text-() focus:border-() focus:ring-2 focus:ring-()",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };

