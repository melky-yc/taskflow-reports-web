import Link from "next/link";
import {
  BarChart3,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Ticket,
} from "lucide-react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    key: "dashboard",
  },
  { href: "/tickets", label: "Tickets", icon: Ticket, key: "tickets" },
  { href: "/reports", label: "Relatórios", icon: BarChart3, key: "reports" },
  { href: "/config", label: "Configuração", icon: Settings, key: "config" },
] as const;

type AppShellProps = {
  active: "dashboard" | "tickets" | "reports" | "config" | "home";
  breadcrumb?: string;
  children: React.ReactNode;
};

export default function AppShell({ active, breadcrumb, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed left-0 top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--primary)] text-white">
              <span className="text-sm font-semibold">TR</span>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Taskflow Reports
              </div>
              {breadcrumb ? (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span>Início</span>
                  <ChevronRight className="h-3 w-3" />
                  <span>{breadcrumb}</span>
                </div>
              ) : null}
            </div>
          </div>
          <form action={signOutAction}>
            <Button variant="outline" className="h-9">
              Sair
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-6 pb-10 pt-24">
        <aside className="w-60">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Navegação
            </div>
            <nav className="mt-4 flex flex-col gap-2 text-sm">
              {NAV_ITEMS.map((item) => {
                const isActive = active === item.key;
                const Icon = item.icon;
                if (item.disabled) {
                  return (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-slate-400"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label} (em breve)
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition ${
                      isActive
                        ? "bg-[color:var(--primary)] text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
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
