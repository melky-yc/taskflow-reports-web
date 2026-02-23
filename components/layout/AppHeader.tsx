"use client";

import Image from "next/image";
import {
    ChevronRight,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    PanelLeft,
} from "lucide-react";
import { useSidebar } from "@/components/layout/SidebarContext";
import UserMenu from "@/components/UserMenu";
import { AppTooltip } from "@/app/ui/tooltip";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────────────────────────── */
/*  Sidebar toggle button                                         */
/* ────────────────────────────────────────────────────────────── */

function SidebarToggle() {
    const { mode, toggle, openMobile } = useSidebar();

    const desktopIcon =
        mode === "expanded" ? (
            <PanelLeftClose className="h-[18px] w-[18px]" />
        ) : mode === "collapsed" ? (
            <PanelLeft className="h-[18px] w-[18px]" />
        ) : (
            <PanelLeftOpen className="h-[18px] w-[18px]" />
        );

    const label =
        mode === "expanded"
            ? "Recolher sidebar"
            : mode === "collapsed"
                ? "Ocultar sidebar"
                : "Expandir sidebar";

    return (
        <>
            {/* Desktop toggle */}
            <AppTooltip content={`${label} (Ctrl+B)`} placement="bottom" delay={400}>
                <button
                    onClick={toggle}
                    className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    aria-label={label}
                >
                    {desktopIcon}
                </button>
            </AppTooltip>

            {/* Mobile hamburger */}
            <button
                onClick={openMobile}
                className="flex lg:hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] transition-colors hover:bg-[var(--color-muted-soft)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                aria-label="Abrir menu"
            >
                <Menu className="h-5 w-5" />
            </button>
        </>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  App Header                                                    */
/* ────────────────────────────────────────────────────────────── */

type AppHeaderProps = {
    breadcrumb?: string;
    email?: string | null;
};

export function AppHeader({ breadcrumb, email }: AppHeaderProps) {
    return (
        <header className="fixed left-0 top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/80">
            <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-[60px] sm:px-4 lg:px-5">
                {/* Left group */}
                <div className="flex min-w-0 flex-1 items-center gap-2">
                    <SidebarToggle />

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                        <Image
                            src="/logotsf.svg"
                            alt="Taskflow Reports"
                            width={22}
                            height={22}
                            className="h-[22px] w-[22px]"
                            priority
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                            Taskflow Reports
                        </div>
                        {breadcrumb ? (
                            <div className="hidden min-w-0 items-center gap-1 text-[11px] text-[var(--color-muted)] sm:flex">
                                <span>Início</span>
                                <ChevronRight className="h-3 w-3 shrink-0" />
                                <span className="truncate">{breadcrumb}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Right group */}
                <div className="shrink-0">
                    <UserMenu email={email} />
                </div>
            </div>
        </header>
    );
}
