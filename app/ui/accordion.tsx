"use client";

import {
  Accordion,
  AccordionItem,
  type AccordionItemProps,
  type AccordionProps,
} from "@heroui/react";
import { cn } from "@/lib/utils";

export function AppAccordion({ className, itemClasses, ...props }: AccordionProps) {
  return (
    <Accordion
      className={cn("w-full", className)}
      itemClasses={{
        ...itemClasses,
        base: cn("border border-[var(--color-border)] bg-[var(--color-surface)]", itemClasses?.base),
        title: cn("text-sm font-semibold text-[var(--color-text)]", itemClasses?.title),
        content: cn("text-sm text-[var(--color-muted-strong)]", itemClasses?.content),
      }}
      {...props}
    />
  );
}

export type AppAccordionItemProps = AccordionItemProps;

export const AppAccordionItem = AccordionItem;
