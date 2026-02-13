import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MobileNav from "@/components/MobileNav";
import UserMenu from "@/components/UserMenu";
import { AlertsProvider } from "@/components/alerts/AlertsProvider";
import { Sidebar } from "@/components/ui/sidebar";
import { NAV_ITEMS } from "@/components/navigation";

type AppShellProps = {
  active: "dashboard" | "tickets" | "reports" | "faq" | "config" | "home";
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
          <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center justify-between px-3 sm:h-16 sm:px-4 lg:px-6 xl:max-w-[1680px] xl:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
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
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                  Taskflow Reports
                </div>
                {breadcrumb ? (
                  <div className="hidden min-w-0 items-center gap-1 text-xs text-[var(--color-muted)] sm:flex">
                    <span>Início</span>
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    <span className="truncate">{breadcrumb}</span>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="shrink-0">
              <UserMenu email={user?.email} />
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-screen-2xl gap-4 px-3 pb-8 pt-20 sm:px-4 sm:pb-10 sm:pt-24 lg:gap-6 lg:px-6 xl:max-w-[1680px] xl:gap-8 xl:px-8">
          <aside className="hidden w-64 lg:block xl:w-72">
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



