import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, SectionCard } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDateTime, formatCurrency, shiftEventTypeLabel } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import {
  ArrowLeft,
  Clock,
  MapPin,
  User,
  Heart,
  AlertTriangle,
  DollarSign,
  Star,
  StickyNote,
} from "lucide-react";
import { AdminShiftActions } from "./shift-actions";
import { AssignProfessionalPanel } from "./assign-professional";

const STATUS_TIMELINE: { status: string; label: string }[] = [
  { status: "OPEN", label: "Criado" },
  { status: "ACCEPTED", label: "Aceito" },
  { status: "CONFIRMED", label: "Confirmado" },
  { status: "IN_PROGRESS", label: "Iniciado" },
  { status: "COMPLETED", label: "Concluído" },
  { status: "VERIFIED", label: "Verificado" },
];

const STATUS_ORDER: Record<string, number> = {
  OPEN: 0,
  OFFERED: 0,
  ASSIGNED: 0,
  URGENT_OPEN: 0,
  ACCEPTED: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  VERIFIED: 5,
  CANCELLED: -1,
  NO_SHOW: -1,
};

export default async function AdminShiftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id?.trim()) notFound();

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          bairro: true,
          zona: true,
          grauComplexidade: true,
          allergies: true,
        },
      },
      professional: {
        select: {
          avatarUrl: true,
          professionalType: true,
          user: { select: { name: true, email: true } },
        },
      },
      createdByAdmin: { select: { name: true } },
      events: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      feedbacks: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!shift) notFound();

  const currentStep = STATUS_ORDER[shift.status] ?? -1;
  const isCancelled = shift.status === "CANCELLED" || shift.status === "NO_SHOW";
  const canAssign =
    !shift.professionalId &&
    (shift.status === "OPEN" || shift.status === "URGENT_OPEN");

  // Load professionals for assignment panel
  let availableProfessionals: {
    id: string;
    name: string;
    type: string;
    hasConflict: boolean;
  }[] = [];

  if (canAssign) {
    const profs = await prisma.professionalProfile.findMany({
      where: { approved: true, status: "ACTIVE" },
      include: {
        user: { select: { name: true } },
        shifts: {
          where: {
            status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
            startDateTime: { lt: shift.endDateTime },
            endDateTime: { gt: shift.startDateTime },
          },
          select: { id: true },
        },
      },
      orderBy: { user: { name: "asc" } },
    });

    availableProfessionals = profs.map((p) => ({
      id: p.id,
      name: p.user.name || "Sem nome",
      type: p.professionalType,
      hasConflict: p.shifts.length > 0,
    }));
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/shifts"
          className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos plantões
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">
                Plantão — {shift.patient.fullName}
              </h1>
              <StatusBadge status={shift.status as ShiftStatus} />
              {shift.isUrgent && (
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  Urgente
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Criado por {shift.createdByAdmin.name} em{" "}
              {formatDateTime(shift.createdAt)}
            </p>
          </div>
          <AdminShiftActions
            shiftId={shift.id}
            status={shift.status as ShiftStatus}
            hasProfessional={!!shift.professionalId}
            startDateTime={shift.startDateTime.toISOString()}
            endDateTime={shift.endDateTime.toISOString()}
            duplicateData={{
              patientId: shift.patient.id,
              requiredProfessionalType: shift.requiredProfessionalType,
              needs: shift.needs,
              value: shift.value,
              isUrgent: shift.isUrgent,
            }}
          />
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && (
        <Card className="mb-6 p-5">
          <div className="flex items-center justify-between">
            {STATUS_TIMELINE.map((step, idx) => {
              const done = currentStep >= idx;
              const active = currentStep === idx;
              return (
                <div key={step.status} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-blue-700 text-white"
                          : "border-2 border-slate-300 text-slate-400"
                      } ${active ? "ring-4 ring-blue-100" : ""}`}
                    >
                      {idx + 1}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        done ? "text-blue-800" : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STATUS_TIMELINE.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        currentStep > idx ? "bg-blue-700" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isCancelled && shift.cancelReason && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50">
          <p className="text-sm font-medium text-red-800">
            Cancelado: {shift.cancelReason}
          </p>
          {shift.cancelledAt && (
            <p className="mt-1 text-xs text-red-600">
              Em {formatDateTime(shift.cancelledAt)}
            </p>
          )}
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Shift info */}
          <Card className="p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Horário
                  </p>
                  <p className="text-sm text-slate-900">
                    {formatDateTime(shift.startDateTime)} —{" "}
                    {formatDateTime(shift.endDateTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Local
                  </p>
                  <p className="text-sm text-slate-900">
                    {shift.patient.bairro} — Zona {shift.patient.zona}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">
                    Profissional
                  </p>
                  {shift.professional ? (
                    <div className="mt-1 flex items-center gap-2">
                      <Avatar
                        src={shift.professional.avatarUrl}
                        name={shift.professional.user.name}
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {shift.professional.user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {shift.professional.user.email}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-amber-600 font-medium">
                      Não atribuído
                    </p>
                  )}
                </div>
              </div>
              {shift.value != null && shift.value > 0 && (
                <div className="flex items-start gap-3">
                  <DollarSign className="mt-0.5 h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">
                      Valor
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(shift.value)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {shift.needs && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Necessidades
                </p>
                <p className="mt-1 text-sm text-slate-700">{shift.needs}</p>
              </div>
            )}
          </Card>

          {/* Financial block */}
          <SectionCard title="Financeiro" description="Detalhamento de valores">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Valor base</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {shift.value != null ? formatCurrency(shift.value) : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Ajustamentos</p>
                <p className={`mt-1 text-lg font-semibold ${
                  shift.adjustmentsCents != null && shift.adjustmentsCents !== 0
                    ? shift.adjustmentsCents > 0 ? "text-green-700" : "text-red-700"
                    : "text-slate-400"
                }`}>
                  {shift.adjustmentsCents != null && shift.adjustmentsCents !== 0
                    ? `${shift.adjustmentsCents > 0 ? "+" : ""}${formatCurrency(shift.adjustmentsCents)}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3">
                <p className="text-xs font-medium uppercase text-blue-600">Total final</p>
                <p className="mt-1 text-lg font-bold text-blue-900">
                  {shift.totalValueCents != null
                    ? formatCurrency(shift.totalValueCents)
                    : shift.value != null
                      ? formatCurrency(shift.value)
                      : "—"}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Admin notes */}
          <SectionCard
            title="Notas do Admin"
            description={shift.adminNotes ? "Notas internas" : "Sem notas"}
          >
            {shift.adminNotes ? (
              <div className="whitespace-pre-wrap rounded-lg bg-amber-50 p-3 text-sm text-slate-700 border border-amber-100">
                <StickyNote className="mb-2 h-4 w-4 text-amber-500" />
                {shift.adminNotes}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Nenhuma nota interna. Use os botões de ação para adicionar.
              </p>
            )}
          </SectionCard>

          {/* Events timeline */}
          <SectionCard
            title="Timeline de Eventos"
            description={`${shift.events.length} eventos registrados`}
          >
            {shift.events.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum evento registrado.
              </p>
            ) : (
              <div className="relative space-y-4 pl-6">
                <div className="absolute left-2 top-1 bottom-1 w-px bg-slate-200" />
                {shift.events.map((event) => (
                  <div key={event.id} className="relative flex gap-3">
                    <div className="absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-blue-500 bg-white" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {shiftEventTypeLabel(event.type)}
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
                      <p className="mt-0.5 text-xs text-slate-400">
                        por {event.actor.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assign professional panel */}
          {canAssign && (
            <SectionCard
              title="Atribuir Profissional"
              description={`${availableProfessionals.length} disponíveis`}
            >
              <AssignProfessionalPanel
                shiftId={shift.id}
                professionals={availableProfessionals}
              />
            </SectionCard>
          )}

          {/* Patient info */}
          <SectionCard
            title="Paciente"
            action={
              <Link
                href={`/admin/patients/${shift.patient.id}`}
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
              >
                Ver ficha
              </Link>
            }
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-900">
                  {shift.patient.fullName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {shift.patient.bairro} — Zona {shift.patient.zona}
                {" · "}Complexidade {shift.patient.grauComplexidade}
              </p>
              {shift.patient.allergies && (
                <p className="rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                  Alergias: {shift.patient.allergies}
                </p>
              )}
            </div>
          </SectionCard>

          {/* Feedbacks */}
          <SectionCard
            title="Avaliações"
            description={`${shift.feedbacks.length} avaliação(ões)`}
          >
            {shift.feedbacks.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhuma avaliação ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {shift.feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg border border-slate-100 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {fb.user.name}
                      </span>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {fb.fromRole}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= fb.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    {fb.notes && (
                      <p className="mt-2 text-sm text-slate-600">{fb.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Timestamps */}
          <SectionCard title="Datas">
            <div className="space-y-2 text-xs">
              {shift.acceptedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Aceito em</span>
                  <span className="text-slate-700">
                    {formatDateTime(shift.acceptedAt)}
                  </span>
                </div>
              )}
              {shift.confirmedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Confirmado em</span>
                  <span className="text-slate-700">
                    {formatDateTime(shift.confirmedAt)}
                  </span>
                </div>
              )}
              {shift.startedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Iniciado em</span>
                  <span className="text-slate-700">
                    {formatDateTime(shift.startedAt)}
                  </span>
                </div>
              )}
              {shift.finishedAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Finalizado em</span>
                  <span className="text-slate-700">
                    {formatDateTime(shift.finishedAt)}
                  </span>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
