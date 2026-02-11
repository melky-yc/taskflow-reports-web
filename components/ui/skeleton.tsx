import * as React from "react";
import { AppSkeleton, type AppSkeletonProps } from "@/app/ui";

const Skeleton = React.forwardRef<HTMLDivElement, AppSkeletonProps>((props, ref) => {
  return <AppSkeleton ref={ref} {...props} />;
});

Skeleton.displayName = "Skeleton";

export { Skeleton };
