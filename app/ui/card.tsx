"use client";

import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  type CardProps,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export function AppCard({ className, ...props }: CardProps) {
  return (
    <Card
      radius="lg"
      className={cn(
        "border border-[var(--color-border)] bg-[var(--color-surface)]",
        "shadow-[var(--shadow-card)]",
        className
      )}
      {...props}
    />
  );
}

export function AppCardHeader({
  className,
  ...props
}: React.ComponentProps<typeof CardHeader>) {
  return (
    <CardHeader
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

export function AppCardBody({
  className,
  ...props
}: React.ComponentProps<typeof CardBody>) {
  return <CardBody className={cn("gap-4", className)} {...props} />;
}

export function AppCardFooter({
  className,
  ...props
}: React.ComponentProps<typeof CardFooter>) {
  return <CardFooter className={cn("gap-2", className)} {...props} />;
}

export function AppCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-[var(--color-text)]", className)}
      {...props}
    />
  );
}

export function AppCardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-[var(--color-muted)]", className)}
      {...props}
    />
  );
}

export { CardBody as AppCardContent };

