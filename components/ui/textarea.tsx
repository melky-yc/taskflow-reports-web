import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[96px] w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-text)] shadow-sm outline-none transition placeholder:text-[color:var(--color-muted)] focus:border-[color:var(--color-primary)] focus:ring-2 focus:ring-[color:var(--color-primary-soft)]",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
