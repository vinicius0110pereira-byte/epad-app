import { Skeleton } from "@/components/ui/skeleton";

export default function ClientDashboardLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-56" />

      {/* Patients */}
      <div className="mb-8">
        <Skeleton className="mb-3 h-6 w-40" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <Skeleton className="mb-2 h-5 w-36" />
              <Skeleton className="mb-1 h-3 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming shifts */}
        <div>
          <Skeleton className="mb-3 h-6 w-40" />
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
              </div>
            ))}
          </div>
        </div>

        {/* Recent */}
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
                    <Skeleton className="mb-1 h-3 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
