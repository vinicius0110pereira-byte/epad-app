import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import Link from "next/link";
import { UserCog, ChevronRight, Search, Star } from "lucide-react";
import { professionalStatusLabel, professionalStatusColor } from "@/lib/utils";
import type { ProfessionalStatus } from "@/types";
import type { Prisma } from "@prisma/client";

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  CAREGIVER: "Cuidador(a)",
  NURSE: "Enfermeiro(a)",
  TECHNICIAN: "Técnico(a)",
  OTHER: "Outro",
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminProfessionalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const { page, pageSize, skip } = parsePaginationParams(params);

  const where: Prisma.ProfessionalProfileWhereInput = {
    ...(q ? { user: { name: { contains: q } } } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(typeFilter ? { professionalType: typeFilter } : {}),
  };

  const [professionals, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
      skip,
      take: pageSize,
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);
  const isFiltered = !!(q || statusFilter || typeFilter);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/professionals${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Profissionais"
        description={isFiltered ? `${total} resultado(s) encontrado(s)` : `${total} profissional(is) cadastrado(s)`}
      />

      {/* Filtros */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="INACTIVE">Inativo</option>
          <option value="SUSPENDED">Suspenso</option>
          <option value="PENDING">Pendente</option>
        </select>
        <select
          name="type"
          defaultValue={typeFilter}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Todos os tipos</option>
          <option value="CAREGIVER">Cuidador(a)</option>
          <option value="NURSE">Enfermeiro(a)</option>
          <option value="TECHNICIAN">Técnico(a)</option>
          <option value="OTHER">Outro</option>
        </select>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          Filtrar
        </button>
        {isFiltered && (
          <Link href="/admin/professionals" className="text-sm text-slate-500 hover:text-slate-700">
            Limpar
          </Link>
        )}
      </form>

      {professionals.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title={isFiltered ? "Nenhum resultado encontrado" : "Nenhum profissional cadastrado"}
          description={isFiltered ? "Tente ajustar os filtros de busca." : "Profissionais aparecerão aqui quando cadastrados."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Profissional</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">Tipo</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-600">Status</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-slate-600 md:table-cell">Score</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-slate-600 md:table-cell">Plantões</th>
                <th className="hidden px-4 py-3 text-center font-semibold text-slate-600 lg:table-cell">Rating</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {professionals.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/professionals/${p.id}`}
                      className="flex items-center gap-3"
                    >
                      <Avatar src={p.avatarUrl} name={p.user.name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900 hover:text-blue-700">
                          {p.user.name || "Sem nome"}
                        </p>
                        <p className="text-xs text-slate-500">{p.user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                    {PROFESSIONAL_TYPE_LABELS[p.professionalType] ?? p.professionalType}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${professionalStatusColor(p.status as ProfessionalStatus)}`}>
                      {professionalStatusLabel(p.status as ProfessionalStatus)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    {p.internalScore != null ? (
                      <span className="text-sm font-medium text-slate-700">{p.internalScore}</span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-center md:table-cell">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-700">
                      {p.totalShifts}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-center lg:table-cell">
                    {p.ratingAvg != null ? (
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {p.ratingAvg.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/professionals/${p.id}`}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
    </div>
  );
}
