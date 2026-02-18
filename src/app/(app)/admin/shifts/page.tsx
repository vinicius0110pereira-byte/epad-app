import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { SectionCard } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { AdminCreateShiftForm } from "./create-form";
import {
  ClipboardList,
  Search,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Eye,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import type { Prisma } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "OPEN", label: "Aberto" },
  { value: "OFFERED", label: "Oferecido" },
  { value: "ASSIGNED", label: "Atribuído" },
  { value: "ACCEPTED", label: "Aceito" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "IN_PROGRESS", label: "Em Andamento" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "VERIFIED", label: "Verificado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "NO_SHOW", label: "Ausência" },
  { value: "URGENT_OPEN", label: "Urgente" },
];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminShiftsPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const status = typeof params.status === "string" ? params.status : "";
  const from = typeof params.from === "string" ? params.from : "";
  const to = typeof params.to === "string" ? params.to : "";
  const profId = typeof params.prof === "string" ? params.prof : "";
  const noProfessional = params.noprof === "1";
  const urgentOnly = params.urgent === "1";
  const { page, pageSize, skip } = parsePaginationParams(params);

  // Build dynamic where clause
  const conditions: Prisma.ShiftWhereInput[] = [];

  if (q) {
    conditions.push({
      OR: [
        { patient: { fullName: { contains: q } } },
        { professional: { user: { name: { contains: q } } } },
      ],
    });
  }
  if (status) conditions.push({ status });
  if (from) conditions.push({ startDateTime: { gte: new Date(from) } });
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push({ endDateTime: { lte: toDate } });
  }
  if (profId) conditions.push({ professionalId: profId });
  if (noProfessional) conditions.push({ professionalId: null });
  if (urgentOnly) conditions.push({ isUrgent: true });

  const where: Prisma.ShiftWhereInput = conditions.length > 0 ? { AND: conditions } : {};

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        address: true,
        neighborhood: true,
        isUrgent: true,
        value: true,
        professionalId: true,
        patient: { select: { fullName: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startDateTime: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.shift.count({ where }),
  ]);

  // Load form data separately - only needed for rendering the form
  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({
      where: { active: true },
      select: { id: true, fullName: true, address: true, neighborhood: true, city: true },
      orderBy: { fullName: "asc" },
      take: 500,
    }),
    prisma.professionalProfile.findMany({
      where: { approved: true },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
      take: 200,
    }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);
  const isFiltered = !!(q || status || from || to || profId || noProfessional || urgentOnly);

  function buildUrl(p: number) {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (from) u.set("from", from);
    if (to) u.set("to", to);
    if (profId) u.set("prof", profId);
    if (noProfessional) u.set("noprof", "1");
    if (urgentOnly) u.set("urgent", "1");
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return `/admin/shifts${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Plantões"
        description={
          isFiltered
            ? `${total} resultado(s) encontrado(s)`
            : `${total} plantão(ões) no total`
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Filters */}
          <form className="mb-5 rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {/* Search */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Busca
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder="Paciente ou profissional..."
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={status}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period from */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  De
                </label>
                <input
                  name="from"
                  type="date"
                  defaultValue={from}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Period to */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Até
                </label>
                <input
                  name="to"
                  type="date"
                  defaultValue={to}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Professional */}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">
                  Profissional
                </label>
                <select
                  name="prof"
                  defaultValue={profId}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {professionals.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkboxes */}
              <div className="flex items-end gap-4 sm:col-span-2 lg:col-span-1">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="noprof"
                    value="1"
                    defaultChecked={noProfessional}
                    className="rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  Sem profissional
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="urgent"
                    value="1"
                    defaultChecked={urgentOnly}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  Urgente
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Search className="h-4 w-4" />
                Filtrar
              </button>
              {isFiltered && (
                <Link
                  href="/admin/shifts"
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" />
                  Limpar filtros
                </Link>
              )}
              <span className="ml-auto text-xs text-slate-400">
                {total} resultado(s)
              </span>
            </div>
          </form>

          {/* Results */}
          {shifts.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={
                isFiltered
                  ? "Nenhum resultado encontrado"
                  : "Nenhum plantão cadastrado"
              }
              description={
                isFiltered
                  ? "Tente ajustar os filtros de busca."
                  : "Crie o primeiro plantão usando o formulário ao lado."
              }
            />
          ) : (
            <div className="space-y-2">
              {shifts.map((s) => {
                const canAssign =
                  !s.professionalId &&
                  (s.status === "OPEN" || s.status === "URGENT_OPEN");

                return (
                  <div
                    key={s.id}
                    className={`group rounded-xl border bg-white transition-all hover:shadow-md ${
                      s.isUrgent
                        ? "border-l-4 border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
                        : "border-slate-200 hover:border-blue-200"
                    } p-4`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900 truncate">
                            {s.patient.fullName}
                          </p>
                          {s.isUrgent && (
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              Urgente
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDateTime(s.startDateTime)} —{" "}
                            {formatDateTime(s.endDateTime)}
                          </span>
                          {s.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {s.address}
                              {s.neighborhood ? `, ${s.neighborhood}` : ""}
                            </span>
                          )}
                        </div>

                        {s.professional ? (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                            <User className="h-3.5 w-3.5" />
                            {s.professional.user.name}
                          </p>
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                            <User className="h-3.5 w-3.5" />
                            Sem profissional atribuído
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={s.status as ShiftStatus} />
                        {s.value != null && s.value > 0 && (
                          <span className="text-xs font-medium text-slate-600">
                            {formatCurrency(s.value)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row actions */}
                    <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <Link
                        href={`/admin/shifts/${s.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalhes
                      </Link>
                      {canAssign && (
                        <Link
                          href={`/admin/shifts/${s.id}#assign`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Atribuir profissional
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildUrl={buildUrl}
          />
        </div>

        <div>
          <SectionCard title="Novo Plantão">
            <AdminCreateShiftForm
              patients={patients.map((p) => ({
                id: p.id,
                name: p.fullName,
                address: p.address,
                neighborhood: p.neighborhood ?? "",
                city: p.city ?? "",
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
