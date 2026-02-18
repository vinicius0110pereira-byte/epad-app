import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessionalDashboardLoading() {
  return (
    <div>
      {/* Profile header */}
      <div className="mb-6 flex items-center gap-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div>
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      <Skeleton className="mb-6 h-10 w-40 rounded-lg" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Available shifts */}
        <div>
          <Skeleton className="mb-3 h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-5 w-40" />
                    <Skeleton className="mb-1 h-3 w-56" />
                    <Skeleton className="mb-1 h-3 w-48" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-8 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* My shifts */}
        <div>
          <Skeleton className="mb-3 h-6 w-36" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="mb-2 h-5 w-40" />
                    <Skeleton className="mb-1 h-3 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="mt-3 h-8 w-28 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
