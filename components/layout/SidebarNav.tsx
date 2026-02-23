"use client";

import Link from "next/link";
import { X } from "lucide-react";
import {
    BarChart3,
    Building2,
    CircleHelp,
    Home,
    LayoutDashboard,
    Settings,
    Ticket,
} from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { AppTooltip } from "@/app/ui/tooltip";
import { useSidebar } from "@/components/layout/SidebarContext";

/* ────────────────────────────────────────────────────────────── */
/*  Icon registry                                                 */
/* ────────────────────────────────────────────────────────────── */

type SidebarIcon =
    | "dashboard"
    | "tickets"
    | "reports"
    | "config"
    | "home"
    | "help"
    | "building";

const ICONS: Record<SidebarIcon, ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    tickets: Ticket,
    reports: BarChart3,
    config: Settings,
    home: Home,
    help: CircleHelp,
    building: Building2,
};

export type SidebarItemType = {
    href: string;
    label: string;
    icon: SidebarIcon;
    key: string;
};

/* ────────────────────────────────────────────────────────────── */
/*  Single nav item                                               */
/* ────────────────────────────────────────────────────────────── */

function SidebarNavItem({
    item,
    isActive,
    isCollapsed,
    onClick,
}: {
    item: SidebarItemType;
    isActive: boolean;
    isCollapsed: boolean;
    onClick?: () => void;
}) {
    const Icon = ICONS[item.icon] ?? LayoutDashboard;

    const link = (
        <Link
            href={item.href}
            onClick={onClick}
            aria-current={isActive ? "page" : undefined}
            className={cn(
                "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]",
                isCollapsed ? "justify-center px-2.5 py-2.5" : "px-3 py-2.5",
                isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted-strong)] hover:bg-[var(--color-muted-soft)] hover:text-[var(--color-text)]",
            )}
        >
            {/* Active indicator bar */}
            <span
                className={cn(
                    "absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full transition-all",
                    isActive
                        ? "bg-[var(--color-primary)] opacity-100"
                        : "bg-transparent opacity-0 group-hover:bg-[var(--color-border)] group-hover:opacity-100",
                )}
            />
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
    );

    // Show tooltip when collapsed
    if (isCollapsed) {
        return (
            <AppTooltip content={item.label} placement="right" delay={200}>
                {link}
            </AppTooltip>
        );
    }

    return link;
}

/* ────────────────────────────────────────────────────────────── */
/*  Desktop sidebar                                               */
/* ────────────────────────────────────────────────────────────── */

export function DesktopSidebar({
    items,
    activeKey,
}: {
    items: SidebarItemType[];
    activeKey?: string;
}) {
    const { mode } = useSidebar();

    if (mode === "hidden") return null;

    const isCollapsed = mode === "collapsed";

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[68px]" : "w-60 xl:w-64",
            )}
        >
            <div className="sticky top-[72px]">
                <nav
                    className={cn(
                        "flex flex-col gap-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)]",
                        isCollapsed ? "items-center" : "",
                    )}
                    aria-label="Navegação principal"
                >
                    {!isCollapsed ? (
                        <div className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                            Menu
                        </div>
                    ) : null}
                    {items.map((item) => (
                        <SidebarNavItem
                            key={item.key}
                            item={item}
                            isActive={activeKey === item.key}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </nav>
            </div>
        </aside>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Mobile drawer                                                 */
/* ────────────────────────────────────────────────────────────── */

export function MobileSidebarDrawer({
    items,
    activeKey,
}: {
    items: SidebarItemType[];
    activeKey?: string;
}) {
    const { isMobileOpen, closeMobile } = useSidebar();

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 z-50 bg-[var(--color-overlay)] transition-opacity duration-300 lg:hidden",
                    isMobileOpen
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0",
                )}
                onClick={closeMobile}
                aria-hidden="true"
            />

            {/* Drawer panel */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[var(--color-surface)] shadow-[var(--shadow-popover)] transition-transform duration-300 ease-in-out lg:hidden",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full",
                )}
                role="dialog"
                aria-modal="true"
                aria-label="Menu de navegação"
            >
                {/* Drawer header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4">
                    <span className="text-sm font-semibold text-[var(--color-text)]">
                        Menu
                    </span>
                    <button
                        onClick={closeMobile}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                        aria-label="Fechar menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Navegação">
                    {items.map((item) => (
                        <SidebarNavItem
                            key={item.key}
                            item={item}
                            isActive={activeKey === item.key}
                            isCollapsed={false}
                            onClick={closeMobile}
                        />
                    ))}
                </nav>

                {/* Keyboard shortcut hint */}
                <div className="border-t border-[var(--color-border)] px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted)]">
                        <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-muted-soft)] px-1.5 py-0.5 font-mono text-[10px]">
                            Ctrl+B
                        </kbd>
                        <span>alternar sidebar</span>
                    </div>
                </div>
            </div>
        </>
    );
}
