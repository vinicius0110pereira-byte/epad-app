import { Skeleton } from "@/components/ui/skeleton";

export default function ClientPatientsLoading() {
  return (
    <div>
      <Skeleton className="mb-6 h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="mb-3 h-6 w-40" />
            <Skeleton className="mb-1 h-3 w-48" />
            <Skeleton className="mb-1 h-3 w-36" />
            <Skeleton className="mb-3 h-3 w-28" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
