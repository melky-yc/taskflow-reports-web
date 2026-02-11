import * as React from "react";
import { AppTextarea, type AppTextareaProps } from "@/app/ui";

const Textarea = React.forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  (props, ref) => {
    return <AppTextarea ref={ref} {...props} />;
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
