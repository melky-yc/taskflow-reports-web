import * as React from "react";
import { AppSwitch, type AppSwitchProps } from "@/app/ui";

const Switch = React.forwardRef<HTMLInputElement, AppSwitchProps>(
  (props, ref) => {
    return <AppSwitch ref={ref} {...props} />;
  }
);

Switch.displayName = "Switch";

export { Switch };
