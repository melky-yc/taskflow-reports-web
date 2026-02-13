"use client";

import Link from "next/link";
import {
  BarChart3,
  CircleHelp,
  Home,
  LayoutDashboard,
  Settings,
  Ticket,
} from "lucide-react";
import type { ComponentType } from "react";
import { AppCard, AppCardBody, AppModal } from "@/app/ui";
import { cn } from "@/lib/utils";

type SidebarIcon =
  | "dashboard"
  | "tickets"
  | "reports"
  | "config"
  | "home"
  | "help";

const ICONS: Record<SidebarIcon, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  tickets: Ticket,
  reports: BarChart3,
  config: Settings,
  home: Home,
  help: CircleHelp,
};

export type SidebarItem = {
  href: string;
  label: string;
  icon: SidebarIcon;
  key: string;
};

type SidebarProps = {
  items: SidebarItem[];
  activeKey?: string;
  variant?: "card" | "plain";
  footer?: React.ReactNode;
  className?: string;
  onNavigate?: () => void;
};

export function Sidebar({
  items,
  activeKey,
  variant = "card",
  footer,
  className,
  onNavigate,
}: SidebarProps) {
  return (
    <AppCard
      className={cn(
        "w-full",
        variant === "plain" && "border-0 shadow-none bg-transparent",
        className
      )}
    >
      <AppCardBody className={cn(variant === "plain" && "p-0 md:p-0")}>
        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Navegação
        </div>
        <nav className="mt-4 flex flex-col gap-1">
          {items.map((item) => {
            const isActive = activeKey === item.key;
            const Icon = ICONS[item.icon] ?? LayoutDashboard;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]",
                  isActive
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted-strong)] hover:bg-[var(--color-muted-soft)]"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-1.5 rounded-full transition",
                    isActive
                      ? "bg-[var(--color-primary)]"
                      : "bg-transparent group-hover:bg-[var(--color-border)]"
                  )}
                />
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {footer ? (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            {footer}
          </div>
        ) : null}
      </AppCardBody>
    </AppCard>
  );
}

type SidebarDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: SidebarItem[];
  activeKey?: string;
  footer?: React.ReactNode;
};

export function SidebarDrawer({
  isOpen,
  onOpenChange,
  items,
  activeKey,
  footer,
}: SidebarDrawerProps) {
  return (
    <AppModalDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Menu"
    >
      <Sidebar
        items={items}
        activeKey={activeKey}
        variant="plain"
        footer={footer}
        onNavigate={() => onOpenChange(false)}
      />
    </AppModalDrawer>
  );
}

type AppModalDrawerProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
};

function AppModalDrawer({ isOpen, onOpenChange, title, children }: AppModalDrawerProps) {
  return (
    <div className="lg:hidden">
      <AppModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        size="sm"
        classNames={{
          wrapper: "items-stretch justify-start",
          base: "m-0 h-full w-80 max-w-[85vw] rounded-none rounded-r-2xl",
          header: "px-5 py-4",
          body: "px-5 py-4",
          footer: "px-5 py-4",
        }}
      >
        {children}
      </AppModal>
    </div>
  );
}


