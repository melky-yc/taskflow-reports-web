import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[96px] w-full rounded-lg border border-() bg-() px-3 py-2 text-sm text-() shadow-sm outline-none transition placeholder:text-() focus:border-() focus:ring-2 focus:ring-()",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };

