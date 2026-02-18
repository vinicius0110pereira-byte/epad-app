import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { parsePaginationParams, getPaginationMeta } from "@/lib/pagination";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import {
  ClipboardList,
  Clock,
  MapPin,
  User,
  Phone,
  ChevronRight,
  Search,
} from "lucide-react";

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "active", label: "Ativos" },
  { value: "COMPLETED", label: "Concluídos" },
  { value: "CANCELLED", label: "Cancelados" },
];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProfessionalShiftsPage({
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL")
    redirect("/login");

  const profileId = session.user.professionalProfileId;
  if (!profileId) redirect("/login");

  const params = await searchParams;
  const tab = typeof params.tab === "string" ? params.tab : "";
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const { page, pageSize, skip } = parsePaginationParams(params);

  // Build where clause
  const conditions: Prisma.ShiftWhereInput[] = [
    { professionalId: profileId },
  ];

  if (tab === "active") {
    conditions.push({ status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] } });
  } else if (tab === "COMPLETED") {
    conditions.push({ status: { in: ["COMPLETED", "VERIFIED"] } });
  } else if (tab === "CANCELLED") {
    conditions.push({ status: "CANCELLED" });
  }

  if (q) {
    conditions.push({ patient: { fullName: { contains: q } } });
  }

  const where: Prisma.ShiftWhereInput = { AND: conditions };

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where,
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        patient: {
          select: {
            fullName: true,
            address: true,
            neighborhood: true,
            city: true,
            client: { select: { phone: true, user: { select: { name: true } } } },
          },
        },
      },
      orderBy: { startDateTime: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.shift.count({ where }),
  ]);

  const { totalPages } = getPaginationMeta(total, page, pageSize);

  function buildUrl(p: number) {
    const u = new URLSearchParams();
    if (tab) u.set("tab", tab);
    if (q) u.set("q", q);
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return `/professional/shifts${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Meus Plantões"
        description={`${total} plantão(ões)`}
      />

      {/* Search */}
      <form className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por paciente..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {tab && <input type="hidden" name="tab" value={tab} />}
        </div>
      </form>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {STATUS_TABS.map((t) => {
          const active = tab === t.value;
          const href = t.value
            ? `/professional/shifts?tab=${t.value}${q ? `&q=${q}` : ""}`
            : `/professional/shifts${q ? `?q=${q}` : ""}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-blue-800 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum plantão encontrado"
          description={q ? "Tente ajustar a busca." : "Você não tem plantões nesta categoria."}
        />
      ) : (
        <div className="space-y-3">
          {shifts.map((s) => (
            <Link
              key={s.id}
              href={`/professional/shifts/${s.id}`}
              className="group block rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 truncate">
                    {s.patient.fullName}
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDateTime(s.startDateTime)} —{" "}
                      {formatDateTime(s.endDateTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {s.patient.address}
                      {s.patient.neighborhood
                        ? `, ${s.patient.neighborhood}`
                        : ""}
                    </span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-xs text-slate-600">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      Familiar: {s.patient.client.user.name}
                    </span>
                    {s.patient.client.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {s.patient.client.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={s.status as ShiftStatus} />
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildUrl={buildUrl}
      />
    </div>
  );
}
