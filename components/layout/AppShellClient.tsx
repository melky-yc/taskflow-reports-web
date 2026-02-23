"use client";

import { SidebarProvider } from "@/components/layout/SidebarContext";
import { AppHeader } from "@/components/layout/AppHeader";
import {
    DesktopSidebar,
    MobileSidebarDrawer,
    type SidebarItemType,
} from "@/components/layout/SidebarNav";
import { AlertsProvider } from "@/components/alerts/AlertsProvider";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/SidebarContext";

/* ────────────────────────────────────────────────────────────── */
/*  Inner layout (needs sidebar context)                          */
/* ────────────────────────────────────────────────────────────── */

function ShellInner({
    breadcrumb,
    email,
    items,
    activeKey,
    children,
}: {
    breadcrumb?: string;
    email?: string | null;
    items: SidebarItemType[];
    activeKey?: string;
    children: React.ReactNode;
}) {
    const { mode } = useSidebar();

    return (
        <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
            <AppHeader breadcrumb={breadcrumb} email={email} />
            <MobileSidebarDrawer items={items} activeKey={activeKey} />

            <div
                className={cn(
                    "flex w-full gap-4 px-3 pb-8 pt-[72px] sm:px-4 sm:pb-10 sm:pt-[76px] lg:gap-5 lg:px-5",
                    // When hidden, no sidebar gap needed
                    mode === "hidden" && "lg:px-6",
                )}
            >
                <DesktopSidebar items={items} activeKey={activeKey} />
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Public API                                                    */
/* ────────────────────────────────────────────────────────────── */

export type AppShellClientProps = {
    active: string;
    breadcrumb?: string;
    email?: string | null;
    items: SidebarItemType[];
    children: React.ReactNode;
};

export default function AppShellClient({
    active,
    breadcrumb,
    email,
    items,
    children,
}: AppShellClientProps) {
    return (
        <SidebarProvider>
            <AlertsProvider>
                <ShellInner
                    breadcrumb={breadcrumb}
                    email={email}
                    items={items}
                    activeKey={active}
                >
                    {children}
                </ShellInner>
            </AlertsProvider>
        </SidebarProvider>
    );
}
