import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessionalShiftsLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="mb-2 h-8 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="mb-1.5 h-3 w-72" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
