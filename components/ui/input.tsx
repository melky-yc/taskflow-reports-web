import * as React from "react";
import { AppInput, type AppInputProps } from "@/app/ui";

const Input = React.forwardRef<HTMLInputElement, AppInputProps>(
  (props, ref) => {
    return <AppInput ref={ref} {...props} />;
  }
);
Input.displayName = "Input";

export { Input };
