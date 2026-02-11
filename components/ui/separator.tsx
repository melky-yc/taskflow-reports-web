import type { ComponentProps } from "react";
import { AppDivider } from "@/app/ui";

function Separator(props: ComponentProps<typeof AppDivider>) {
  return <AppDivider {...props} />;
}

export { Separator };
