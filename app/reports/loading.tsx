import AppShell from "@/components/AppShell";
import {
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppSkeleton,
} from "@/app/ui";

export default function ReportsLoading() {
  return (
    <AppShell active="reports" breadcrumb="Relatórios">
      <div className="space-y-6">
        <div className="space-y-3">
          <AppSkeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <AppSkeleton className="h-4 w-full max-w-[480px]" />
        </div>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppSkeleton className="h-5 w-44" />
            <AppSkeleton className="h-4 w-full max-w-[360px]" />
          </AppCardHeader>
          <AppCardBody className="p-4 pt-4 md:p-6 md:pt-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="grid flex-1 gap-4 md:grid-cols-2">
                <AppSkeleton className="h-11 w-full" />
                <AppSkeleton className="h-11 w-full" />
              </div>
              <AppSkeleton className="h-10 w-full md:w-40" />
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <AppSkeleton className="h-5 w-28" />
                <AppSkeleton className="h-4 w-64" />
              </div>
              <AppSkeleton className="h-8 w-28" />
            </div>
          </AppCardHeader>
          <AppCardBody className="space-y-4 p-4 pt-4 md:p-6 md:pt-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <AppSkeleton key={`report-metric-${index}`} className="h-28 w-full" />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <AppSkeleton key={`report-top-${index}`} className="h-44 w-full" />
              ))}
            </div>
            <AppSkeleton className="h-px w-full" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <AppSkeleton key={`report-table-${index}`} className="h-11 w-full" />
              ))}
            </div>
          </AppCardBody>
        </AppCard>
      </div>
    </AppShell>
  );
}
