import {
  AppCard,
  AppCardBody,
  AppCardHeader,
  AppSkeleton,
} from "@/app/ui";

export default function LoginLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <div className="mb-6 flex justify-center">
          <AppSkeleton className="h-12 w-12 rounded-2xl" />
        </div>
        <AppCard>
          <AppCardHeader className="p-4 pb-0 md:p-6 md:pb-0">
            <AppSkeleton className="h-6 w-44" />
            <AppSkeleton className="h-4 w-64" />
          </AppCardHeader>
          <AppCardBody className="space-y-4 p-4 pt-4 md:p-6 md:pt-4">
            <AppSkeleton className="h-11 w-full" />
            <AppSkeleton className="h-11 w-full" />
            <AppSkeleton className="h-10 w-full" />
          </AppCardBody>
        </AppCard>
      </div>
    </div>
  );
}
