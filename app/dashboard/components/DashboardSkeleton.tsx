"use client";

import { AppCard, AppCardBody } from "@/app/ui";

function SkeletonBlock({ className }: { className?: string }) {
    return (
        <div className={`animate-pulse rounded-xl bg-[var(--color-muted-soft)] ${className ?? ""}`} />
    );
}

function SkeletonStatCards() {
    return (
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <AppCard key={i} className="h-full">
                    <AppCardBody className="flex flex-col gap-3 p-4 md:p-6">
                        <SkeletonBlock className="h-10 w-10 rounded-lg" />
                        <SkeletonBlock className="h-3 w-20" />
                        <SkeletonBlock className="h-7 w-28" />
                        <SkeletonBlock className="h-3 w-32" />
                    </AppCardBody>
                </AppCard>
            ))}
        </div>
    );
}

function SkeletonChart({ height = "h-64 sm:h-80" }: { height?: string }) {
    return (
        <AppCard>
            <AppCardBody>
                <SkeletonBlock className={`w-full ${height}`} />
            </AppCardBody>
        </AppCard>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-4 sm:space-y-6">
            <SkeletonStatCards />
            <SkeletonChart />
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                <SkeletonChart height="h-48 sm:h-80" />
                <SkeletonChart height="h-48 sm:h-80" />
                <SkeletonChart height="h-48 sm:h-80" />
            </div>
        </div>
    );
}
