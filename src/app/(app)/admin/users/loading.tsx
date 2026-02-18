import { TableRowSkeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div>
      <div className="mb-6">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Usuário</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">Role</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">Detalhes</th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={4} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
