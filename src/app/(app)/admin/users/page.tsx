import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { SectionCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Users, Shield, Stethoscope, UserCircle, CheckCircle, XCircle, Search } from "lucide-react";
import { CreateUserForm } from "./create-form";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  ADMIN: { label: "Admin", color: "bg-purple-100 text-purple-700", icon: Shield },
  PROFESSIONAL: { label: "Profissional", color: "bg-blue-100 text-blue-700", icon: Stethoscope },
  CLIENT: { label: "Familiar", color: "bg-amber-100 text-amber-700", icon: UserCircle },
};

const ROLE_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "ADMIN", label: "Admin" },
  { value: "PROFESSIONAL", label: "Profissional" },
  { value: "CLIENT", label: "Familiar" },
];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const role = typeof params.role === "string" ? params.role : "";
  const { page, pageSize, skip } = parsePaginationParams(params);

  const where: Prisma.UserWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {},
      role ? { role } : {},
    ],
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        professionalProfile: { select: { id: true, professionalType: true, approved: true, avatarUrl: true } },
        clientProfile: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);
  const isFiltered = !!(q || role);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={isFiltered ? `${total} resultado(s) encontrado(s)` : `${total} usuário(s) cadastrado(s)`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Filtros */}
          <form className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome ou email..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              name="role"
              defaultValue={role}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Filtrar
            </button>
            {isFiltered && (
              <Link href="/admin/users" className="text-sm text-slate-500 hover:text-slate-700">
                Limpar
              </Link>
            )}
          </form>

          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title={isFiltered ? "Nenhum resultado encontrado" : "Nenhum usuário cadastrado"}
              description={isFiltered ? "Tente ajustar os filtros de busca." : "Crie o primeiro usuário usando o formulário ao lado."}
            />
          ) : (
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
                  {users.map((user) => {
                    const rc = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.CLIENT;
                    const RoleIcon = rc.icon;
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.professionalProfile?.avatarUrl} name={user.name} size="sm" />
                            <div>
                              <p className="font-medium text-slate-900">{user.name ?? "—"}</p>
                              <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${rc.color}`}>
                            <RoleIcon className="h-3 w-3" />
                            {rc.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-slate-500 md:table-cell">
                          {user.role === "PROFESSIONAL" && user.professionalProfile && (
                            <span>
                              {user.professionalProfile.professionalType}
                              {user.professionalProfile.approved ? " (aprovado)" : " (pendente)"}
                            </span>
                          )}
                          {user.role === "CLIENT" && user.clientProfile && (
                            <span>Perfil ativo</span>
                          )}
                          {user.role === "ADMIN" && <span>Acesso total</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                              <XCircle className="h-3.5 w-3.5" />
                              Inativo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
        </div>

        <div>
          <SectionCard title="Novo Usuário">
            <CreateUserForm />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
