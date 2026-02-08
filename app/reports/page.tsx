import AppShell from "@/components/AppShell";
import ReportsClient from "@/app/reports/ReportsClient";

export default function ReportsPage() {
  return (
    <AppShell active="reports" breadcrumb="Relatórios">
      <ReportsClient />
    </AppShell>
  );
}
