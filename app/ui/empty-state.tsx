"use client";

import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
    icon?: ReactNode;
    title?: string;
    description?: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    icon,
    title = "Sem dados",
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center gap-3 py-12 text-center",
                className,
            )}
        >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-muted-soft)] text-[var(--color-muted)]">
                {icon ?? <Inbox className="h-7 w-7" />}
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
                {description ? (
                    <p className="max-w-xs text-xs text-[var(--color-muted)]">{description}</p>
                ) : null}
            </div>
            {action ? <div className="mt-2">{action}</div> : null}
        </div>
    );
}
