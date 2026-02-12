import { AppSkeleton } from "@/app/ui";

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-6">
      <div className="mx-auto w-full max-w-screen-2xl space-y-6">
        <AppSkeleton className="h-14 w-full rounded-xl" />
        <AppSkeleton className="h-7 w-44 sm:h-8 sm:w-56" />
        <AppSkeleton className="h-4 w-full max-w-[520px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <AppSkeleton key={`root-kpi-${index}`} className="h-28 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
