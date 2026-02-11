"use client";

import { Skeleton, type SkeletonProps } from "@heroui/react";
import { cn } from "@/lib/utils";

export type AppSkeletonProps = SkeletonProps;

export function AppSkeleton({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      className={cn(
        "rounded-[var(--radius-md)] bg-[var(--color-muted-soft)]",
        className
      )}
      {...props}
    />
  );
}

