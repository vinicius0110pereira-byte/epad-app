import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import Link from "next/link";
import { Heart, Edit, Clock, User } from "lucide-react";

export default async function ClientDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  const profileId = session.user.clientProfileId;
  if (!profileId) redirect("/login");

  const patients = await prisma.patient.findMany({
    where: { clientId: profileId, active: true },
    orderBy: { fullName: "asc" },
  });

  const patientIds = patients.map((p) => p.id);

  const [upcomingShifts, recentCompleted] = await Promise.all([
    prisma.shift.findMany({
      where: {
        patientId: { in: patientIds },
        status: { in: ["OPEN", "ACCEPTED", "CONFIRMED", "IN_PROGRESS", "URGENT_OPEN"] },
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
      take: 10,
    }),
    prisma.shift.findMany({
      where: {
        patientId: { in: patientIds },
        status: { in: ["COMPLETED", "VERIFIED"] },
      },
      select: {
        id: true,
        startDateTime: true,
        status: true,
        patient: { select: { fullName: true } },
        professional: { select: { user: { select: { name: true } } } },
        feedbacks: { where: { userId: session.user.id }, select: { id: true } },
      },
      orderBy: { finishedAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div>
      <PageHeader
        title={`Olá, ${session.user.name}`}
        description="Acompanhe os plantões e pacientes da sua família"
      />

      {/* Patients */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Meus Pacientes ({patients.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {patients.map((p) => (
            <div
              key={p.id}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-slate-400" />
                  <p className="font-medium text-slate-900">{p.fullName}</p>
                </div>
                <Link
                  href={`/client/patients/${p.id}`}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 opacity-0 transition-opacity hover:bg-blue-50 group-hover:opacity-100"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Link>
              </div>
              <p className="mt-1 text-sm text-slate-500">{p.address}</p>
              {p.allergies && (
                <p className="mt-1 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                  Alergias: {p.allergies}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming shifts */}
        <SectionCard
          title="Próximos Plantões"
          description={`${upcomingShifts.length} agendado(s)`}
        >
          {upcomingShifts.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum plantão agendado.</p>
          ) : (
            <div className="space-y-2">
              {upcomingShifts.map((s) => (
                <Link
                  key={s.id}
                  href={`/client/shifts/${s.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{s.patient.fullName}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(s.startDateTime)} — {formatDateTime(s.endDateTime)}
                    </p>
                    {s.professional ? (
                      <p className="flex items-center gap-1 text-xs text-slate-600">
                        <User className="h-3 w-3" />
                        {s.professional.user.name}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600">Aguardando profissional</p>
                    )}
                  </div>
                  <StatusBadge status={s.status as ShiftStatus} />
                </Link>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent completed */}
        <SectionCard
          title="Atendimentos Recentes"
          description="Avalie os atendimentos concluídos"
        >
          {recentCompleted.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum atendimento concluído.</p>
          ) : (
            <div className="space-y-2">
              {recentCompleted.map((s) => {
                const hasMyFeedback = s.feedbacks.length > 0;
                return (
                  <Link
                    key={s.id}
                    href={`/client/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{s.patient.fullName}</p>
                      <p className="text-xs text-slate-500">{formatDateTime(s.startDateTime)}</p>
                      {s.professional && (
                        <p className="text-xs text-slate-600">{s.professional.user.name}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={s.status as ShiftStatus} />
                      {hasMyFeedback ? (
                        <span className="text-xs text-emerald-600">Avaliado</span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Avaliar
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
