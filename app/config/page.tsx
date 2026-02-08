import AppShell from "@/components/AppShell";
import ConfigClient from "@/app/config/ConfigClient";

export default function ConfigPage() {
  return (
    <AppShell active="config" breadcrumb="Configuração">
      <ConfigClient />
    </AppShell>
  );
}
