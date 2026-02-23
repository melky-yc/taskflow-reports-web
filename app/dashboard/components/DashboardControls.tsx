"use client";

import { PERIOD_OPTIONS } from "@/app/dashboard/types";
import { AppButton, AppBadge } from "@/app/ui";
import { formatNumber } from "@/app/dashboard/helpers";

export type DashboardControlsProps = {
    period: number;
    setPeriod: (p: number) => void;
    includeInternal: boolean;
    setIncludeInternal: (v: boolean | ((prev: boolean) => boolean)) => void;
    onReload: (period: number) => void;
    loading: boolean;
    internalHiddenCount: number;
    sticky?: boolean;
};

export function DashboardControls({
    period,
    setPeriod,
    includeInternal,
    setIncludeInternal,
    onReload,
    loading,
    internalHiddenCount,
    sticky = false,
}: DashboardControlsProps) {
    return (
        <div>
            <div
                className={
                    sticky
                        ? "sticky top-[60px] z-20 -mx-3 bg-[var(--color-bg)]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4 lg:-mx-5 lg:px-5"
                        : undefined
                }
            >
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <AppButton
                        variant={includeInternal ? "soft" : "ghost"}
                        size="sm"
                        onPress={() => setIncludeInternal((prev: boolean) => !prev)}
                    >
                        <span className="hidden sm:inline">
                            {includeInternal ? "Incluindo internos" : "Ocultar internos"}
                        </span>
                        <span className="sm:hidden">
                            {includeInternal ? "Internos ON" : "Internos OFF"}
                        </span>
                    </AppButton>

                    {PERIOD_OPTIONS.map((option) => (
                        <AppButton
                            key={option.value}
                            variant={option.value === period ? "solid" : "soft"}
                            size="sm"
                            onPress={() => {
                                setPeriod(option.value);
                                onReload(option.value);
                            }}
                            isDisabled={loading}
                        >
                            <span className="hidden sm:inline">{option.labelFull}</span>
                            <span className="sm:hidden">{option.label}</span>
                        </AppButton>
                    ))}
                </div>
            </div>

            {internalHiddenCount > 0 && !includeInternal ? (
                <div className="mt-2">
                    <AppBadge tone="warning" variant="soft">
                        Dados internos ocultos: {formatNumber(internalHiddenCount)}
                    </AppBadge>
                </div>
            ) : null}
        </div>
    );
}
