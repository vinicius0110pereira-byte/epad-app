import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";

export default function ShiftDetailLoading() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Skeleton className="mb-3 h-4 w-32" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="mb-2 h-7 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              {i < 4 && <Skeleton className="mx-2 h-0.5 flex-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Info card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="mt-0.5 h-5 w-5 rounded" />
                  <div className="flex-1">
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Events */}
          <CardSkeleton />
        </div>

        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}
