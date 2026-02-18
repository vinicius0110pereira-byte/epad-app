import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, StatCard, SectionCard } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime, professionalStatusLabel, professionalStatusColor } from "@/lib/utils";
import type { ProfessionalStatus, ShiftStatus } from "@/types";
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle,
  Star,
  Award,
  Activity,
} from "lucide-react";
import { ProfessionalActions } from "./professional-actions";

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  CAREGIVER: "Cuidador(a)",
  NURSE: "Enfermeiro(a)",
  TECHNICIAN: "Técnico(a)",
  OTHER: "Outro",
};

export default async function AdminProfessionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id?.trim()) notFound();

  const profile = await prisma.professionalProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      shifts: {
        include: {
          patient: { select: { fullName: true } },
        },
        orderBy: { startDateTime: "desc" },
        take: 10,
      },
      availabilities: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!profile) notFound();

  // Get events where this professional was the actor
  const events = await prisma.shiftEvent.findMany({
    where: { actorUserId: profile.userId },
    include: {
      shift: { select: { id: true, patient: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const status = profile.status as ProfessionalStatus;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/professionals"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos profissionais
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatarUrl} name={profile.user.name} size="xl" />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {profile.user.name || "Sem nome"}
                </h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${professionalStatusColor(status)}`}>
                  {professionalStatusLabel(status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {profile.user.email} &middot; {PROFESSIONAL_TYPE_LABELS[profile.professionalType] ?? profile.professionalType}
              </p>
              {profile.phone && (
                <p className="text-sm text-slate-500">{profile.phone}</p>
              )}
            </div>
          </div>
          <ProfessionalActions
            professionalId={profile.id}
            currentStatus={status}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de plantões"
          value={profile.totalShifts}
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title="Concluídos"
          value={profile.completedShifts}
          icon={<CheckCircle className="h-5 w-5" />}
        />
        <StatCard
          title="Rating médio"
          value={profile.ratingAvg != null ? profile.ratingAvg.toFixed(1) : "—"}
          icon={<Star className="h-5 w-5" />}
        />
        <StatCard
          title="Score interno"
          value={profile.internalScore ?? "—"}
          icon={<Award className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Últimos plantões */}
          <SectionCard
            title="Últimos plantões"
            description={`${profile.shifts.length} plantão(ões) recente(s)`}
          >
            {profile.shifts.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum plantão registrado.
              </p>
            ) : (
              <div className="space-y-2">
                {profile.shifts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {s.patient.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(s.startDateTime)} — {formatDateTime(s.endDateTime)}
                      </p>
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Timeline de eventos */}
          <SectionCard
            title="Timeline de atividades"
            description={`${events.length} eventos recentes`}
          >
            {events.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum evento registrado.
              </p>
            ) : (
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
                {events.map((event) => (
                  <div key={event.id} className="relative flex gap-3">
                    <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500 bg-white" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {event.type}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatDateTime(event.createdAt)}
                        </span>
                      </div>
                      {event.description && (
                        <p className="mt-1 text-sm text-slate-700">
                          {event.description}
                        </p>
                      )}
                      <Link
                        href={`/admin/shifts/${event.shift.id}`}
                        className="text-xs text-blue-700 hover:underline"
                      >
                        {event.shift.patient.fullName}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notas internas */}
          <SectionCard title="Notas internas">
            {profile.internalNotes ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700">
                {profile.internalNotes}
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Nenhuma nota interna.
              </p>
            )}
          </SectionCard>

          {/* Skills */}
          <SectionCard title="Habilidades">
            {profile.skills ? (
              <div className="flex flex-wrap gap-2">
                {(JSON.parse(profile.skills) as string[]).map((skill, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Nenhuma habilidade registrada.
              </p>
            )}
          </SectionCard>

          {/* Disponibilidade */}
          <SectionCard title="Disponibilidade">
            {profile.availabilities.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma disponibilidade cadastrada.
              </p>
            ) : (
              <div className="space-y-1.5">
                {profile.availabilities.map((a) => {
                  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-slate-700">{dayNames[a.dayOfWeek]}</span>
                      <span className="text-slate-500">{a.startTime} — {a.endTime}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Info */}
          <SectionCard title="Informações">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Aprovado</span>
                <span className="text-slate-700">{profile.approved ? "Sim" : "Não"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cadastrado em</span>
                <span className="text-slate-700">
                  {formatDateTime(profile.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Atualizado em</span>
                <span className="text-slate-700">
                  {formatDateTime(profile.updatedAt)}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
