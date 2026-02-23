"use client";

import { useState, type ReactNode } from "react";
import { Maximize2 } from "lucide-react";
import { AppModal, AppButton } from "@/app/ui";
import { AppTooltip } from "@/app/ui/tooltip";

export type ChartExpandModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
};

export function ChartExpandModal({
    open,
    onOpenChange,
    title,
    subtitle,
    children,
}: ChartExpandModalProps) {
    return (
        <AppModal
            isOpen={open}
            onOpenChange={onOpenChange}
            title={title}
            description={subtitle}
            size="xl"
            classNames={{
                base: "max-w-[95vw] max-h-[90vh]",
                body: "p-4 sm:p-6",
            }}
        >
            <div className="h-[70vh] min-h-[300px] w-full">{children}</div>
        </AppModal>
    );
}

/** Small expand trigger button to place inside ChartCard headers */
export function ChartExpandButton({
    onClick,
    label = "Expandir gráfico",
}: {
    onClick: () => void;
    label?: string;
}) {
    return (
        <AppTooltip content={label} placement="top" delay={300}>
            <button
                onClick={onClick}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                aria-label={label}
            >
                <Maximize2 className="h-3.5 w-3.5" />
            </button>
        </AppTooltip>
    );
}

/** Convenience hook for a single chart modal state */
export function useChartExpand() {
    const [expandedChart, setExpandedChart] = useState<string | null>(null);

    return {
        expandedChart,
        isExpanded: (key: string) => expandedChart === key,
        expand: (key: string) => setExpandedChart(key),
        close: () => setExpandedChart(null),
    };
}
