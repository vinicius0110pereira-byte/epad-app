import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function PatientDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="mb-2 h-7 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Info card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1 h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>

          <CardSkeleton />
          <CardSkeleton />
        </div>

        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
