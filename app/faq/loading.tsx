import AppShell from "@/components/AppShell";
import { AppSkeleton } from "@/app/ui";

export default function FaqLoading() {
  return (
    <AppShell active="faq" breadcrumb="Perguntas Frequentes">
      <div className="space-y-4">
        <AppSkeleton className="h-20 w-full" />
        <AppSkeleton className="h-64 w-full" />
      </div>
    </AppShell>
  );
}
