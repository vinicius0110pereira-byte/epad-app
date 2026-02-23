import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, SectionCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatDate, ZONA_LABELS } from "@/lib/utils";
import { SEXO_LABELS } from "@/lib/validators/patient";
import type { ShiftStatus } from "@/types";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Pill,
  AlertTriangle,
  Star,
  Plus,
  UserCircle,
} from "lucide-react";

export default async function AdminPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id?.trim()) notFound();

  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) notFound();

  const [upcomingShifts, pastShifts, feedbacks, totalShifts] =
    await Promise.all([
      prisma.shift.findMany({
        where: {
          patientId: id,
          startDateTime: { gte: new Date() },
          status: { not: "CANCELLED" },
        },
        include: {
          professional: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startDateTime: "asc" },
        take: 10,
      }),
      prisma.shift.findMany({
        where: {
          patientId: id,
          OR: [
            { startDateTime: { lt: new Date() } },
            { status: { in: ["COMPLETED", "CANCELLED"] } },
          ],
        },
        include: {
          professional: { include: { user: { select: { name: true } } } },
        },
        orderBy: { startDateTime: "desc" },
        take: 10,
      }),
      prisma.feedback.findMany({
        where: { shift: { patientId: id } },
        include: {
          user: { select: { name: true } },
          shift: { select: { startDateTime: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.shift.count({ where: { patientId: id } }),
    ]);

  let medications: { name: string; dose: string; frequency: string }[] = [];
  if (patient.medications) {
    try {
      medications = JSON.parse(patient.medications);
    } catch {
      // invalid json
    }
  }

  const zonaLabel = ZONA_LABELS[patient.zona] ?? patient.zona;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/patients"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos pacientes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {patient.fullName}
            </h1>
            {patient.birthDate && (
              <p className="mt-1 text-sm text-slate-500">
                Nascimento: {formatDate(patient.birthDate)}
              </p>
            )}
          </div>
          <Link
            href={`/admin/shifts?q=${encodeURIComponent(patient.fullName)}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-800 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Criar plantão
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Patient info */}
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Localização
                  </p>
                  <p className="text-sm text-slate-900">
                    {patient.bairro} — {zonaLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Grau de Complexidade
                  </p>
                  <p className="text-sm text-slate-900">
                    {patient.grauComplexidade === "1"
                      ? "1 — Baixo"
                      : patient.grauComplexidade === "2"
                      ? "2 — Médio"
                      : "3 — Alto"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UserCircle className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Sexo
                  </p>
                  <p className="text-sm text-slate-900">
                    {SEXO_LABELS[(patient.sexo ?? "NAO_INFORMADO") as keyof typeof SEXO_LABELS] ?? "Não informado"}
                  </p>
                </div>
              </div>
            </div>

            {/* Medical info */}
            <div className="mt-4 space-y-3">
              {patient.allergies && (
                <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs font-medium uppercase text-red-700">
                      Alergias
                    </p>
                    <p className="text-sm font-medium text-red-800">
                      {patient.allergies}
                    </p>
                  </div>
                </div>
              )}
              {medications.length > 0 && (
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <Pill className="mt-0.5 h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs font-medium uppercase text-blue-700">
                      Medicações
                    </p>
                    <div className="mt-1 space-y-1">
                      {medications.map((med, i) => (
                        <p key={i} className="text-sm text-blue-900">
                          <span className="font-medium">{med.name}</span> —{" "}
                          {med.dose} a cada {med.frequency}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Upcoming shifts */}
          <SectionCard
            title="Próximos Plantões"
            description={`${upcomingShifts.length} agendados`}
          >
            {upcomingShifts.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Nenhum plantão agendado"
                description="Este paciente não tem plantões futuros."
              />
            ) : (
              <div className="space-y-2">
                {upcomingShifts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDateTime(s.startDateTime)} —{" "}
                        {formatDateTime(s.endDateTime)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.professional
                          ? s.professional.user.name
                          : "Sem profissional"}
                      </p>
                    </div>
                    <StatusBadge status={s.status as ShiftStatus} />
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Past shifts */}
          <SectionCard
            title="Histórico de Plantões"
            description={`${pastShifts.length} de ${totalShifts} registros`}
          >
            {pastShifts.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum plantão anterior.
              </p>
            ) : (
              <div className="space-y-2">
                {pastShifts.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/shifts/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition hover:border-slate-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatDateTime(s.startDateTime)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {s.professional ? s.professional.user.name : "—"}
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
          {/* Quick stats */}
          <SectionCard title="Resumo">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total de plantões</span>
                <span className="font-medium text-slate-900">
                  {totalShifts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Agendados</span>
                <span className="font-medium text-slate-900">
                  {upcomingShifts.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avaliações</span>
                <span className="font-medium text-slate-900">
                  {feedbacks.length}
                </span>
              </div>
              {feedbacks.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Média</span>
                  <span className="font-medium text-slate-900">
                    {(
                      feedbacks.reduce((sum, fb) => sum + fb.rating, 0) /
                      feedbacks.length
                    ).toFixed(1)}{" "}
                    / 5
                  </span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Feedbacks */}
          <SectionCard
            title="Avaliações"
            description={`${feedbacks.length} avaliação(ões)`}
          >
            {feedbacks.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma avaliação recebida.
              </p>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {fb.user.name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${
                              star <= fb.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {fb.notes && (
                      <p className="mt-1 text-sm text-slate-600">{fb.notes}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(fb.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
