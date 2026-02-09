import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Ticket,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "@/components/MobileNav";
import UserMenu from "@/components/UserMenu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/tickets", label: "Tickets", icon: Ticket, key: "tickets" },
  { href: "/reports", label: "Relatórios", icon: BarChart3, key: "reports" },
  { href: "/config", label: "Configuração", icon: Settings, key: "config" },
] as const;

type AppShellProps = {
  active: "dashboard" | "tickets" | "reports" | "config" | "home";
  breadcrumb?: string;
  children: React.ReactNode;
};

export default async function AppShell({ active, breadcrumb, children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <header className="fixed left-0 top-0 z-40 w-full border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav active={active} />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--color-primary)] text-[color:var(--color-on-primary)]">
              <span className="text-sm font-semibold">TR</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-[color:var(--color-text)]">
                Taskflow Reports
              </div>
              {breadcrumb ? (
                <div className="flex items-center gap-1 text-xs text-[color:var(--color-muted)]">
                  <span>Início</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{breadcrumb}</span>
                </div>
              ) : null}
            </div>
          </div>
          <UserMenu email={user?.email} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-10 pt-24 lg:px-6">
        <aside className="hidden w-64 lg:block">
          <div className="sticky top-24 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 shadow-[var(--color-shadow)]">
            <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-muted)]">
              Navegação
            </div>
            <nav className="mt-4 flex flex-col gap-1.5 text-sm">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.key;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 font-medium transition ${
                      isActive
                        ? "bg-[color:var(--color-primary-soft)] text-[color:var(--color-primary)]"
                        : "text-[color:var(--color-muted-strong)] hover:bg-[color:var(--color-muted-soft)]"
                    }`}
                  >
                    <span
                      className={`h-4 w-1 rounded-full ${
                        isActive
                          ? "bg-[color:var(--color-primary)]"
                          : "bg-transparent"
                      }`}
                    />
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </div>
  );
}
