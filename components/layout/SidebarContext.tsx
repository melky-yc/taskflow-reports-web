"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

/* ────────────────────────────────────────────────────────────── */
/*  Types                                                         */
/* ────────────────────────────────────────────────────────────── */

export type SidebarMode = "expanded" | "collapsed" | "hidden";

type SidebarContextValue = {
    mode: SidebarMode;
    isMobileOpen: boolean;
    setMode: (mode: SidebarMode) => void;
    toggle: () => void;
    openMobile: () => void;
    closeMobile: () => void;
};

const STORAGE_KEY = "taskflow-sidebar-mode";

const SidebarContext = createContext<SidebarContextValue | null>(null);

/* ────────────────────────────────────────────────────────────── */
/*  Provider                                                      */
/* ────────────────────────────────────────────────────────────── */

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<SidebarMode>("expanded");
    const [isMobileOpen, setMobileOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Restore from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === "collapsed" || stored === "hidden" || stored === "expanded") {
                setModeState(stored);
            }
        } catch { }
        setHydrated(true);
    }, []);

    // Persist to localStorage
    const setMode = useCallback((next: SidebarMode) => {
        setModeState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch { }
    }, []);

    // Cycle: expanded → collapsed → hidden → expanded
    const toggle = useCallback(() => {
        setModeState((prev) => {
            const next =
                prev === "expanded"
                    ? "collapsed"
                    : prev === "collapsed"
                        ? "hidden"
                        : "expanded";
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch { }
            return next;
        });
    }, []);

    const openMobile = useCallback(() => setMobileOpen(true), []);
    const closeMobile = useCallback(() => setMobileOpen(false), []);

    // Close mobile drawer on resize to desktop
    useEffect(() => {
        const mql = window.matchMedia("(min-width: 1024px)");
        const handler = () => {
            if (mql.matches) setMobileOpen(false);
        };
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
    }, []);

    // Keyboard shortcut: Ctrl+B toggles sidebar
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "b") {
                e.preventDefault();
                toggle();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [toggle]);

    // Prevent rendering with wrong mode on SSR
    if (!hydrated) return null;

    return (
        <SidebarContext.Provider
            value={{ mode, isMobileOpen, setMode, toggle, openMobile, closeMobile }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

/* ────────────────────────────────────────────────────────────── */
/*  Hook                                                          */
/* ────────────────────────────────────────────────────────────── */

export function useSidebar(): SidebarContextValue {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
    return ctx;
}
