import AppShell from "@/components/AppShell";
import {
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppSkeleton,
} from "@/app/ui";

export default function ConfigLoading() {
  return (
    <AppShell active="config" breadcrumb="Configuração">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <AppSkeleton className="h-9 w-9 rounded-xl" />
          <div className="flex-1 space-y-3">
            <AppSkeleton className="h-7 w-44 sm:h-8 sm:w-52" />
            <AppSkeleton className="h-4 w-full max-w-[520px]" />
          </div>
        </div>

        <div className="flex max-w-full gap-2 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-muted-soft)] p-1">
          <AppSkeleton className="h-9 w-32 shrink-0" />
          <AppSkeleton className="h-9 w-48 shrink-0" />
          <AppSkeleton className="h-9 w-24 shrink-0" />
        </div>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppSkeleton className="h-5 w-40" />
            <AppSkeleton className="h-4 w-full max-w-[380px]" />
          </AppCardHeader>
          <AppCardBody className="space-y-4 p-4 pt-4 md:p-6 md:pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <AppSkeleton className="h-28 w-full" />
              <AppSkeleton className="h-28 w-full" />
            </div>
            <AppCard>
              <AppCardBody className="space-y-3 p-4 md:p-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <AppSkeleton key={`config-row-${index}`} className="h-12 w-full" />
                ))}
              </AppCardBody>
            </AppCard>
          </AppCardBody>
        </AppCard>
      </div>
    </AppShell>
  );
}
