import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime, shiftEventTypeLabel } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import Link from "next/link";
import { Clock, MapPin, AlertTriangle } from "lucide-react";
import { ProfessionalShiftActions } from "./shift-actions";

export default async function ProfessionalShiftDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL") redirect("/login");

  const { id } = await params;
  if (!id?.trim()) notFound();

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          fullName: true,
          bairro: true,
          zona: true,
          grauComplexidade: true,
          allergies: true,
          medications: true,
        },
      },
      events: {
        select: {
          id: true,
          type: true,
          description: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!shift) notFound();

  // Verificar que o profissional tem acesso
  if (
    shift.professionalId !== session.user.professionalProfileId &&
    shift.status !== "OPEN" &&
    shift.status !== "URGENT_OPEN"
  ) {
    redirect("/professional/dashboard");
  }

  return (
    <div>
      <Link
        href="/professional/shifts"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        ← Voltar aos plantões
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {shift.patient.fullName}
          </h1>
          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <Clock className="h-4 w-4" />
            {formatDateTime(shift.startDateTime)} — {formatDateTime(shift.endDateTime)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={shift.status as ShiftStatus} />
          {shift.professionalId === session.user.professionalProfileId && (
            <ProfessionalShiftActions
              shiftId={shift.id}
              status={shift.status as ShiftStatus}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Info do plantão */}
          <Card className="p-6">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Localização</p>
                  <p className="text-slate-900">{shift.patient.bairro} — Zona {shift.patient.zona}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Em caso de dúvidas, entre em contato com a equipe EPAD.
                  </p>
                </div>
              </div>
            </div>

            {shift.needs && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase text-slate-500">Necessidades</p>
                <p className="mt-1 text-sm text-slate-700">{shift.needs}</p>
              </div>
            )}
          </Card>

          {/* Timeline */}
          <Card className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">
              Acompanhamento
            </h2>
            {shift.events.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum evento registrado.</p>
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar: info do paciente */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Dados do Paciente</h2>
            <div className="space-y-3 text-sm">
              {shift.patient.allergies && (
                <div className="rounded-lg bg-red-50 p-3 border border-red-100">
                  <div className="flex items-center gap-1.5 text-red-700 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Alergias
                  </div>
                  <p className="mt-1 text-red-700">{shift.patient.allergies}</p>
                </div>
              )}
              {shift.patient.medications && (
                <div>
                  <p className="text-xs font-medium uppercase text-slate-500">Medicações</p>
                  <p className="mt-0.5 text-slate-700">{shift.patient.medications}</p>
                </div>
              )}
              {!shift.patient.allergies && !shift.patient.medications && (
                <p className="text-slate-500">Nenhuma informação médica registrada.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
