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
    <div className="min-h-screen bg-() text-()">
      <header className="fixed left-0 top-0 z-40 w-full border-b border-() bg-() backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav active={active} />
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-()">
              <img
                src="/logotsf.svg"
                alt="Taskflow Reports"
                className="h-6 w-6"
                loading="eager"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-()">
                Taskflow Reports
              </div>
              {breadcrumb ? (
                <div className="flex items-center gap-1 text-xs text-()">
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
          <div className="sticky top-24 rounded-2xl border border-() bg-() p-4 shadow-()">
            <div className="text-xs font-semibold uppercase tracking-wide text-()">
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
                        ? "bg-() text-()"
                        : "text-() hover:bg-()"
                    }`}
                  >
                    <span
                      className={`h-4 w-1 rounded-full ${
                        isActive
                          ? "bg-()"
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

