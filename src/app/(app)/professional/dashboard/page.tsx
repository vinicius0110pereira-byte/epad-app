import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { formatDateTime } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import { ShiftActions } from "./shift-actions";
import { AvailabilityForm } from "./availability-form";
import Link from "next/link";
import {
  User,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Clock,
} from "lucide-react";

export default async function ProfessionalDashboard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL")
    redirect("/login");

  const profileId = session.user.professionalProfileId;
  if (!profileId) redirect("/login");

  const profile = await prisma.professionalProfile.findUnique({
    where: { id: profileId },
    select: { professionalType: true, avatarUrl: true },
  });

  const patientSelect = {
    fullName: true,
    address: true,
    neighborhood: true,
    city: true,
    client: { select: { user: { select: { name: true } } } },
  } as const;

  const shiftSelect = {
    id: true,
    startDateTime: true,
    endDateTime: true,
    status: true,
    isUrgent: true,
    needs: true,
  } as const;

  const [available, myShifts, totalMyShifts, availabilities] = await Promise.all([
    prisma.shift.findMany({
      where: {
        status: { in: ["OPEN", "URGENT_OPEN"] },
        requiredProfessionalType: profile?.professionalType ?? "CAREGIVER",
      },
      select: { ...shiftSelect, patient: { select: patientSelect } },
      orderBy: { startDateTime: "asc" },
      take: 20,
    }),
    prisma.shift.findMany({
      where: {
        professionalId: profileId,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
      },
      select: { ...shiftSelect, patient: { select: patientSelect } },
      orderBy: { startDateTime: "asc" },
      take: 10,
    }),
    prisma.shift.count({ where: { professionalId: profileId } }),
    prisma.availability.findMany({
      where: { professionalId: profileId },
      orderBy: { dayOfWeek: "asc" },
    }),
  ]);

  const PROFESSIONAL_TYPE_LABEL: Record<string, string> = {
    CAREGIVER: "Cuidador(a)",
    NURSE: "Enfermeiro(a)",
    TECHNICIAN: "Técnico(a)",
    OTHER: "Outro",
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-5">
        <Avatar
          src={profile?.avatarUrl}
          name={session.user.name}
          size="xl"
        />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {session.user.name}
          </h1>
          {profile?.professionalType && (
            <p className="text-sm text-slate-500">
              {PROFESSIONAL_TYPE_LABEL[profile.professionalType] ??
                profile.professionalType}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6">
        <AvatarUploader
          professionalProfileId={profileId}
          currentAvatarUrl={profile?.avatarUrl}
          professionalName={session.user.name}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Plantões disponíveis */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Plantões Disponíveis ({available.length})
          </h2>
          {available.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              Nenhum plantão disponível no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {available.map((s) => (
                <div
                  key={s.id}
                  className={`rounded-xl border bg-white p-4 transition-all hover:shadow-md ${
                    s.isUrgent
                      ? "border-l-4 border-l-red-500 border-t-slate-200 border-r-slate-200 border-b-slate-200"
                      : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
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
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(s.startDateTime)} —{" "}
                        {formatDateTime(s.endDateTime)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {s.patient.address}
                        {s.patient.neighborhood
                          ? `, ${s.patient.neighborhood}`
                          : ""}
                        {s.patient.city ? ` - ${s.patient.city}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Familiar: {s.patient.client.user.name}
                        </span>
                      </div>
                      {s.needs && (
                        <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                          {s.needs}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ShiftActions
                      shiftId={s.id}
                      status={s.status as ShiftStatus}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meus plantões ativos */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Meus Plantões Ativos ({myShifts.length})
            </h2>
            <Link
              href="/professional/shifts"
              className="flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 transition-colors"
            >
              Ver todos ({totalMyShifts})
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {myShifts.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
              <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              Você não tem plantões ativos no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {myShifts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">
                        {s.patient.fullName}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(s.startDateTime)} —{" "}
                        {formatDateTime(s.endDateTime)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {s.patient.address}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          Familiar: {s.patient.client.user.name}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ShiftActions
                      shiftId={s.id}
                      status={s.status as ShiftStatus}
                      isMyShift
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Disponibilidade semanal */}
      <div className="mt-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Minha Disponibilidade
        </h2>
        <AvailabilityForm
          initialData={availabilities.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      </div>
    </div>
  );
}
