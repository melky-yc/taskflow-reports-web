import AppShell from "@/components/AppShell";
import DashboardClient from "@/app/dashboard/DashboardClient";

export default function DashboardPage() {
  return (
    <AppShell active="dashboard" breadcrumb="Dashboard">
      <DashboardClient />
    </AppShell>
  );
}
