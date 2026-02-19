import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { formatDateTime, shiftEventTypeLabel } from "@/lib/utils";
import type { ShiftStatus } from "@/types";
import { FeedbackForm } from "./feedback-form";
import Link from "next/link";

export default async function ClientShiftDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  const { id } = await params;
  if (!id?.trim()) notFound();

  const shift = await prisma.shift.findUnique({
    where: { id },
    include: {
      patient: { select: { fullName: true, clientId: true } },
      professional: { include: { user: { select: { name: true } } } },
      events: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      feedbacks: { where: { userId: session.user.id } },
    },
  });

  if (!shift) notFound();

  // Verificar que o paciente pertence ao client
  if (shift.patient.clientId !== session.user.clientProfileId) {
    redirect("/client/dashboard");
  }

  const canFeedback =
    (shift.status === "COMPLETED" || shift.status === "VERIFIED") &&
    shift.feedbacks.length === 0;

  return (
    <div>
      <Link
        href="/client/dashboard"
        className="mb-4 inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
      >
        &larr; Voltar
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Atendimento - {shift.patient.fullName}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDateTime(shift.startDateTime)} — {formatDateTime(shift.endDateTime)}
                </p>
                {shift.professional && (
                  <p className="mt-2 text-sm text-slate-700">
                    Profissional: <span className="font-medium">{shift.professional.user.name}</span>
                  </p>
                )}
              </div>
              <StatusBadge status={shift.status as ShiftStatus} />
            </div>
          </Card>

          {/* Timeline de eventos (read-only) */}
          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Acompanhamento
            </h2>
            {shift.events.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum evento registrado ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {shift.events.map((event) => (
                  <div
                    key={event.id}
                    className="flex gap-3 border-l-2 border-blue-200 pl-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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

        {/* Sidebar: feedback */}
        <div>
          {canFeedback && (
            <Card>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Avaliar Atendimento
              </h2>
              <FeedbackForm shiftId={shift.id} />
            </Card>
          )}
          {shift.feedbacks.length > 0 && (
            <Card>
              <h2 className="mb-3 text-lg font-semibold text-slate-900">
                Sua Avaliação
              </h2>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-xl ${
                      star <= shift.feedbacks[0].rating
                        ? "text-yellow-400"
                        : "text-slate-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              {shift.feedbacks[0].notes && (
                <p className="mt-2 text-sm text-slate-700">
                  {shift.feedbacks[0].notes}
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
