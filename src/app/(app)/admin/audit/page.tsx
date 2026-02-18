import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { FileText, Search, ChevronDown, ChevronUp } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { AuditDiffViewer } from "./audit-diff-viewer";

const EVENT_TYPE_COLORS: Record<string, string> = {
  CREATED: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-purple-100 text-purple-800",
  STARTED: "bg-green-100 text-green-800",
  FINISHED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  OFFERED: "bg-indigo-100 text-indigo-800",
  ASSIGNED: "bg-cyan-100 text-cyan-800",
  UNASSIGNED: "bg-orange-100 text-orange-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
  RESCHEDULED: "bg-amber-100 text-amber-800",
  VALUE_ADJUSTED: "bg-teal-100 text-teal-800",
  NOTE_ADDED: "bg-slate-100 text-slate-800",
  LATE: "bg-orange-100 text-orange-800",
  OCCURRENCE: "bg-yellow-100 text-yellow-800",
  MED_REQUEST: "bg-pink-100 text-pink-800",
  RESOLVED: "bg-green-100 text-green-800",
};

const EVENT_TYPES = [
  "CREATED", "ACCEPTED", "CONFIRMED", "STARTED", "FINISHED", "CANCELLED",
  "OFFERED", "ASSIGNED", "UNASSIGNED", "VERIFIED", "NO_SHOW",
  "RESCHEDULED", "VALUE_ADJUSTED", "NOTE_ADDED",
  "LATE", "OCCURRENCE", "MED_REQUEST", "RESOLVED",
];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AdminAuditPage({ searchParams }: Props) {
  const params = await searchParams;
  const typeFilter = typeof params.type === "string" ? params.type : "";
  const actorFilter = typeof params.actor === "string" ? params.actor : "";
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";
  const { page, pageSize, skip } = parsePaginationParams(params);

  const where: Record<string, unknown> = {};
  if (typeFilter) where.type = typeFilter;
  if (actorFilter) where.actorUserId = actorFilter;
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [events, total, admins] = await Promise.all([
    prisma.shiftEvent.findMany({
      where,
      include: {
        actor: { select: { name: true } },
        shift: {
          select: {
            id: true,
            patient: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.shiftEvent.count({ where }),
    prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);
  const isFiltered = !!(typeFilter || actorFilter || dateFrom || dateTo);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    if (actorFilter) params.set("actor", actorFilter);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/admin/audit${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Auditoria"
        description={isFiltered ? `${total} evento(s) encontrado(s)` : `${total} evento(s) registrado(s)`}
      />

      {/* Filtros */}
      <form className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Tipo</label>
          <select
            name="type"
            defaultValue={typeFilter}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Ator</label>
          <select
            name="actor"
            defaultValue={actorFilter}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Todos</option>
            {admins.map((a) => (
              <option key={a.id} value={a.id}>{a.name || a.id}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">De</label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={dateFrom}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Até</label>
          <input
            type="date"
            name="dateTo"
            defaultValue={dateTo}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <Link href="/admin/audit" className="text-sm text-slate-500 hover:text-slate-700">
            Limpar
          </Link>
        )}
      </form>

      {events.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={isFiltered ? "Nenhum resultado encontrado" : "Nenhum evento registrado"}
          description={isFiltered ? "Tente ajustar os filtros." : "Eventos de auditoria aparecerão aqui."}
        />
      ) : (
        <div className="space-y-3">
          {events.map((event) => {
            const hasDiff = !!(event.beforeJson || event.afterJson);
            return (
              <div
                key={event.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${EVENT_TYPE_COLORS[event.type] ?? "bg-gray-100 text-gray-800"}`}>
                      {event.type}
                    </span>
                    {event.entityType && event.entityType !== "SHIFT" && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {event.entityType}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    por {event.actor.name || "Sistema"}
                  </span>
                </div>

                {event.description && (
                  <p className="mt-2 text-sm text-slate-700">{event.description}</p>
                )}

                {event.reason && (
                  <p className="mt-1 text-xs text-slate-500">
                    Motivo: {event.reason}
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <Link
                    href={`/admin/shifts/${event.shift.id}`}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    {event.shift.patient.fullName}
                  </Link>
                  {hasDiff && (
                    <AuditDiffViewer
                      beforeJson={event.beforeJson}
                      afterJson={event.afterJson}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination currentPage={page} totalPages={totalPages} buildUrl={buildUrl} />
    </div>
  );
}
