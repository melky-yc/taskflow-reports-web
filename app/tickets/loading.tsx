import AppShell from "@/components/AppShell";
import {
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppSkeleton,
} from "@/app/ui";

export default function TicketsLoading() {
  return (
    <AppShell active="tickets" breadcrumb="Tickets">
      <div className="space-y-6">
        <div className="space-y-3">
          <AppSkeleton className="h-7 w-40 sm:h-8 sm:w-48" />
          <AppSkeleton className="h-4 w-full max-w-[480px]" />
        </div>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppSkeleton className="h-5 w-40" />
            <AppSkeleton className="h-4 w-full max-w-[340px]" />
          </AppCardHeader>
          <AppCardBody className="space-y-6 p-4 pt-4 md:p-6 md:pt-4">
            <div className="space-y-4">
              <AppSkeleton className="h-4 w-40" />
              <div className="grid gap-4 md:grid-cols-2">
                <AppSkeleton className="h-11 w-full" />
                <AppSkeleton className="h-11 w-full" />
              </div>
            </div>
            <div className="space-y-4">
              <AppSkeleton className="h-4 w-44" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <AppSkeleton key={`ticket-form-${index}`} className="h-11 w-full" />
                ))}
              </div>
              <AppSkeleton className="h-24 w-full" />
            </div>
            <div className="space-y-4">
              <AppSkeleton className="h-4 w-36" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <AppSkeleton key={`ticket-client-${index}`} className="h-11 w-full" />
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <AppSkeleton className="h-10 w-36" />
            </div>
          </AppCardBody>
        </AppCard>

        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <AppSkeleton className="h-5 w-44" />
                <AppSkeleton className="h-4 w-full max-w-[360px]" />
              </div>
              <div className="flex gap-2">
                <AppSkeleton className="h-9 w-24" />
                <AppSkeleton className="h-9 w-24" />
              </div>
            </div>
          </AppCardHeader>
          <AppCardBody className="space-y-4 p-4 pt-4 md:p-6 md:pt-4">
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <AppSkeleton key={`ticket-table-${index}`} className="h-11 w-full" />
              ))}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AppSkeleton className="h-4 w-36" />
              <div className="flex gap-2">
                <AppSkeleton className="h-8 w-20" />
                <AppSkeleton className="h-8 w-20" />
              </div>
            </div>
          </AppCardBody>
        </AppCard>
      </div>
    </AppShell>
  );
}
