import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-() bg-() px-3 text-sm text-() shadow-sm outline-none transition focus:border-() focus:ring-2 focus:ring-()",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";

export { Select };

