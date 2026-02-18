import { prisma } from "@/lib/prisma";
import { StatCard, SectionCard } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import Link from "next/link";
import {
  Users,
  Heart,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  ChevronRight,
  Activity,
  Inbox,
  UserCog,
} from "lucide-react";

export default async function AdminDashboard() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)

  const twentyFourHoursAgo = new Date(now);
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const [
    totalPatients,
    activeProfessionals,
    openShifts,
    inProgressShifts,
    completedThisWeek,
    todayShifts,
    weekShifts,
    urgentShifts,
    recentEvents,
    recentPatients,
    staleOpenShifts,
    pendingProfessionals,
  ] = await Promise.all([
    prisma.patient.count({ where: { active: true } }),
    prisma.professionalProfile.count({ where: { status: "ACTIVE" } }),
    prisma.shift.count({ where: { status: { in: ["OPEN", "URGENT_OPEN"] } } }),
    prisma.shift.count({ where: { status: "IN_PROGRESS" } }),
    prisma.shift.count({
      where: {
        status: { in: ["COMPLETED", "VERIFIED"] },
        finishedAt: { gte: weekStart },
      },
    }),
    prisma.shift.findMany({
      where: {
        startDateTime: { gte: todayStart, lte: todayEnd },
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        isUrgent: true,
        patient: { select: { fullName: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startDateTime: "asc" },
    }),
    prisma.shift.findMany({
      where: {
        startDateTime: { gte: todayStart, lte: weekEnd },
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
        status: true,
        patient: { select: { fullName: true } },
        professional: { select: { user: { select: { name: true } } } },
      },
      orderBy: { startDateTime: "asc" },
      take: 8,
    }),
    prisma.shift.findMany({
      where: { isUrgent: true, status: { in: ["OPEN", "URGENT_OPEN"] }, professionalId: null },
      select: {
        id: true,
        patient: { select: { fullName: true } },
      },
      orderBy: { startDateTime: "asc" },
      take: 5,
    }),
    prisma.shiftEvent.findMany({
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        actor: { select: { name: true } },
        shift: {
          select: {
            id: true,
            patient: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.patient.findMany({
      where: { active: true },
      select: {
        id: true,
        fullName: true,
        client: { select: { user: { select: { name: true } } } },
        _count: { select: { shifts: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Stale open shifts: OPEN without professional for >24h
    prisma.shift.findMany({
      where: {
        status: { in: ["OPEN", "URGENT_OPEN"] },
        professionalId: null,
        createdAt: { lt: twentyFourHoursAgo },
      },
      select: {
        id: true,
        createdAt: true,
        patient: { select: { fullName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    // Pending professionals
    prisma.professionalProfile.findMany({
      where: { status: "PENDING" },
      select: { id: true, user: { select: { name: true } } },
      take: 5,
    }),
  ]);

  const hasPendencies = staleOpenShifts.length > 0 || urgentShifts.length > 0 || pendingProfessionals.length > 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do sistema"
      />

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Pacientes ativos"
          value={totalPatients}
          icon={<Heart className="h-5 w-5" />}
        />
        <StatCard
          title="Profissionais ativos"
          value={activeProfessionals}
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          title="Plantões abertos"
          value={openShifts}
          description={urgentShifts.length > 0 ? `${urgentShifts.length} urgente(s)` : undefined}
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          title="Em andamento"
          value={inProgressShifts}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          title="Concluídos na semana"
          value={completedThisWeek}
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>

      {/* Urgent alert */}
      {urgentShifts.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {urgentShifts.length} plantão(ões) urgente(s) sem profissional
              </p>
              <p className="text-xs text-red-600">Necessitam atenção imediata</p>
            </div>
            <Link
              href="/admin/shifts?status=URGENT_OPEN"
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Ver plantões
            </Link>
          </div>
          <div className="mt-3 space-y-1.5 pl-8">
            {urgentShifts.map((s) => (
              <Link
                key={s.id}
                href={`/admin/shifts/${s.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-red-800 transition hover:bg-red-100"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {s.patient.fullName}
                <ChevronRight className="ml-auto h-3.5 w-3.5 text-red-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inbox / Pendências */}
      {hasPendencies && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="h-5 w-5 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">Pendências</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {staleOpenShifts.length > 0 && (
              <div className="rounded-lg bg-white/70 p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800">Abertos há +24h</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1.5 text-xs font-bold text-amber-900">
                    {staleOpenShifts.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {staleOpenShifts.map((s) => (
                    <Link
                      key={s.id}
                      href={`/admin/shifts/${s.id}`}
                      className="block truncate text-xs text-amber-700 hover:text-amber-900 hover:underline"
                    >
                      {s.patient.fullName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {urgentShifts.length > 0 && (
              <div className="rounded-lg bg-white/70 p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-red-700">Urgentes sem prof.</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-200 px-1.5 text-xs font-bold text-red-900">
                    {urgentShifts.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {urgentShifts.map((s) => (
                    <Link
                      key={s.id}
                      href={`/admin/shifts/${s.id}`}
                      className="block truncate text-xs text-red-700 hover:text-red-900 hover:underline"
                    >
                      {s.patient.fullName}
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {pendingProfessionals.length > 0 && (
              <div className="rounded-lg bg-white/70 p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-amber-800">Prof. pendentes</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-200 px-1.5 text-xs font-bold text-amber-900">
                    {pendingProfessionals.length}
                  </span>
                </div>
                <div className="space-y-1">
                  {pendingProfessionals.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/professionals/${p.id}`}
                      className="block truncate text-xs text-amber-700 hover:text-amber-900 hover:underline"
                    >
                      {p.user.name || "Sem nome"}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plantões de hoje */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard
            title="Plantões de hoje"
            description={`${todayShifts.length} plantão(ões)`}
            action={
              <Link
                href="/admin/calendar"
                className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Calendário
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {todayShifts.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum plantão hoje"
                description="Não há plantões agendados para hoje."
              />
            ) : (
              <div className="space-y-2">
                {todayShifts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {s.patient.fullName}
                        </p>
                        {s.isUrgent && (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(s.startDateTime)} — {formatDateTime(s.endDateTime)}
                        {s.professional ? ` | ${s.professional.user.name}` : " | Sem profissional"}
                      </p>
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Próximos 7 dias */}
          <SectionCard
            title="Próximos 7 dias"
            description={`${weekShifts.length} plantão(ões)`}
            action={
              <Link
                href="/admin/calendar"
                className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Ver todos
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            {weekShifts.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum plantão na próxima semana.</p>
            ) : (
              <div className="space-y-2">
                {weekShifts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-slate-200"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {s.patient.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(s.startDateTime)}
                        {s.professional ? ` | ${s.professional.user.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Últimos eventos */}
          <SectionCard
            title="Últimos Eventos"
            action={
              <Link
                href="/admin/audit"
                className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Ver todos
              </Link>
            }
          >
            {recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum evento recente.</p>
            ) : (
              <div className="space-y-3">
                {recentEvents.map((ev) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50">
                      <Activity className="h-3 w-3 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{ev.actor.name}</span>
                        {" · "}
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium">
                          {ev.type}
                        </span>
                      </p>
                      {ev.description && (
                        <p className="mt-0.5 text-xs text-slate-600 truncate">{ev.description}</p>
                      )}
                      <Link
                        href={`/admin/shifts/${ev.shift.id}`}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        {ev.shift.patient.fullName}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Pacientes recentes */}
          <SectionCard
            title="Pacientes"
            action={
              <Link
                href="/admin/patients"
                className="text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
              >
                Ver todos
              </Link>
            }
          >
            <div className="space-y-2">
              {recentPatients.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/patients/${p.id}`}
                  className="flex items-center justify-between rounded-lg p-2 transition-all hover:bg-slate-50"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{p.fullName}</p>
                    <p className="text-xs text-slate-500">
                      {p.client?.user?.name} · {p._count.shifts} plantões
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
