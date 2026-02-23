import { createClient } from "@/lib/supabase/server";
import { NAV_ITEMS } from "@/components/navigation";
import AppShellClient from "@/components/layout/AppShellClient";

type AppShellProps = {
  active: "dashboard" | "tickets" | "reports" | "faq" | "config" | "home" | "units";
  breadcrumb?: string;
  children: React.ReactNode;
};

export default async function AppShell({ active, breadcrumb, children }: AppShellProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AppShellClient
      active={active}
      breadcrumb={breadcrumb}
      email={user?.email}
      items={NAV_ITEMS}
    >
      {children}
    </AppShellClient>
  );
}
