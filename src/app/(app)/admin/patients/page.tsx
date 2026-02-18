import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { SectionCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { AdminCreatePatientForm } from "./create-form";
import { Heart, ChevronRight, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminPatientsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { page, pageSize, skip } = parsePaginationParams(params);

  const where: Prisma.PatientWhereInput = {
    active: true,
    ...(q ? { fullName: { contains: q } } : {}),
  };

  const [patients, total, clientProfiles] = await Promise.all([
    prisma.patient.findMany({
      where,
      include: {
        client: { include: { user: { select: { name: true } } } },
        _count: { select: { shifts: true } },
      },
      orderBy: { fullName: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
    prisma.clientProfile.findMany({
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);
  const isFiltered = !!q;

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/patients${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description={isFiltered ? `${total} resultado(s) encontrado(s)` : `${total} paciente(s) ativo(s)`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Filtrar
            </button>
            {isFiltered && (
              <Link href="/admin/patients" className="text-sm text-slate-500 hover:text-slate-700">
                Limpar
              </Link>
            )}
          </form>

          {patients.length === 0 ? (
            <EmptyState
              icon={Heart}
              title={isFiltered ? "Nenhum resultado encontrado" : "Nenhum paciente cadastrado"}
              description={isFiltered ? "Tente ajustar os filtros de busca." : "Crie o primeiro paciente usando o formulário ao lado."}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Nome</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell">Endereço</th>
                    <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell">Responsável</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">Plantões</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="font-medium text-slate-900 hover:text-blue-700"
                        >
                          {p.fullName}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
                        {p.address}
                        {p.neighborhood ? `, ${p.neighborhood}` : ""}
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                        {p.client?.user?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-medium text-slate-700">
                          {p._count.shifts}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/patients/${p.id}`}
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

        <div>
          <SectionCard title="Novo Paciente">
            <AdminCreatePatientForm
              clients={clientProfiles.map((c) => ({
                id: c.id,
                name: c.user.name ?? c.user.email,
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
