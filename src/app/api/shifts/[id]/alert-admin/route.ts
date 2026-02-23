import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotificationsForAllAdmins } from "@/services/notification.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id: shiftId } = await params;
  const body = await req.json();
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 });
  }

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    select: {
      id: true,
      status: true,
      professionalId: true,
      patient: { select: { fullName: true } },
    },
  });

  if (!shift) {
    return NextResponse.json({ error: "Plantão não encontrado" }, { status: 404 });
  }

  if (shift.professionalId !== session.user.professionalProfileId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  if (shift.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Só é possível avisar o admin durante um plantão em andamento" }, { status: 400 });
  }

  // Registra o aviso como evento no plantão (visível na timeline)
  await prisma.shiftEvent.create({
    data: {
      shiftId,
      actorUserId: session.user.id,
      type: "OCCURRENCE",
      description: message,
      entityType: "SHIFT",
      entityId: shiftId,
    },
  });

  // Notifica todos os admins
  await createNotificationsForAllAdmins(
    "PROFESSIONAL_ALERT",
    `Aviso do profissional — ${shift.patient.fullName}`,
    message,
    `/admin/shifts/${shiftId}`,
  );

  return NextResponse.json({ ok: true });
}
