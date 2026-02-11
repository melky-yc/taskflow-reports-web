import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "@/components/MobileNav";
import UserMenu from "@/components/UserMenu";
import { AlertsProvider } from "@/components/alerts/AlertsProvider";
import { Sidebar } from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/components/navigation";

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
    <AlertsProvider>
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
        <header className="fixed left-0 top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
          <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <MobileNav active={active} items={NAV_ITEMS} />
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface)]">
                <Image
                  src="/logotsf.svg"
                  alt="Taskflow Reports"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                  priority
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-[var(--color-text)]">
                  Taskflow Reports
                </div>
                {breadcrumb ? (
                  <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
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

        <div className="mx-auto flex w-full max-w-[1200px] gap-6 px-4 pb-10 pt-24 md:px-6">
          <aside className="hidden w-64 lg:block">
            <div className="sticky top-24">
              <Sidebar items={NAV_ITEMS} activeKey={active} />
            </div>
          </aside>

          <section className="min-w-0 flex-1">{children}</section>
        </div>
      </div>
    </AlertsProvider>
  );
}



