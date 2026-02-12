import AppShell from "@/components/AppShell";
import {
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppSkeleton,
} from "@/app/ui";

export default function DashboardLoading() {
  return (
    <AppShell active="dashboard" breadcrumb="Dashboard">
      <div className="space-y-6">
        <div className="space-y-3">
          <AppSkeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <AppSkeleton className="h-4 w-full max-w-[420px]" />
          <div className="flex flex-wrap gap-2">
            <AppSkeleton className="h-10 w-28" />
            <AppSkeleton className="h-10 w-36" />
          </div>
        </div>

        <AppCard>
          <AppCardBody className="space-y-3 p-3 sm:p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <AppSkeleton className="h-9 w-24" />
              <div className="flex flex-wrap gap-2">
                <AppSkeleton className="h-7 w-28" />
                <AppSkeleton className="h-7 w-24" />
                <AppSkeleton className="h-7 w-20" />
              </div>
              <div className="flex flex-col gap-1.5">
                <AppSkeleton className="h-3 w-44" />
                <AppSkeleton className="h-3 w-44" />
              </div>
            </div>
          </AppCardBody>
        </AppCard>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <AppSkeleton key={`dashboard-kpi-${index}`} className="h-28 w-full" />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AppSkeleton className="h-48 w-full" />
          <AppSkeleton className="h-48 w-full" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppSkeleton className="h-80 w-full" />
          <AppSkeleton className="h-80 w-full" />
        </div>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppSkeleton className="h-5 w-36" />
            <AppSkeleton className="h-4 w-56" />
          </AppCardHeader>
          <AppCardBody className="p-4 pt-4 md:p-6 md:pt-4">
            <AppSkeleton className="h-80 w-full" />
          </AppCardBody>
        </AppCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <AppSkeleton className="h-72 w-full" />
          <AppSkeleton className="h-72 w-full" />
        </div>
      </div>
    </AppShell>
  );
}
