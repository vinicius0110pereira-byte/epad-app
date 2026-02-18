import { prisma } from "@/lib/prisma";
import type { SessionUser, ShiftStatus } from "@/types";
import type { CreateShiftInput } from "@/lib/validators/shift";
import { canTransition } from "@/lib/utils";

export async function listShifts(user: SessionUser) {
  const shiftSelect = {
    id: true,
    startDateTime: true,
    endDateTime: true,
    status: true,
    address: true,
    neighborhood: true,
    city: true,
    isUrgent: true,
    value: true,
    needs: true,
    professionalId: true,
    patientId: true,
    createdAt: true,
  } as const;

  if (user.role === "ADMIN") {
    return prisma.shift.findMany({
      select: {
        ...shiftSelect,
        patient: { select: { fullName: true } },
        professional: { include: { user: { select: { name: true } } } },
      },
      orderBy: { startDateTime: "desc" },
      take: 100,
    });
  }

  if (user.role === "PROFESSIONAL" && user.professionalProfileId) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: user.professionalProfileId },
      select: { professionalType: true },
    });
    return prisma.shift.findMany({
      where: {
        OR: [
          { professionalId: user.professionalProfileId },
          {
            status: { in: ["OPEN", "URGENT_OPEN"] },
            requiredProfessionalType: profile?.professionalType ?? "CAREGIVER",
          },
        ],
      },
      select: {
        ...shiftSelect,
        patient: { select: { fullName: true, address: true, neighborhood: true, city: true } },
      },
      orderBy: { startDateTime: "asc" },
      take: 50,
    });
  }

  if (user.role === "CLIENT" && user.clientProfileId) {
    const patients = await prisma.patient.findMany({
      where: { clientId: user.clientProfileId },
      select: { id: true },
    });
    const patientIds = patients.map((p) => p.id);
    return prisma.shift.findMany({
      where: { patientId: { in: patientIds } },
      select: {
        ...shiftSelect,
        patient: { select: { fullName: true } },
        professional: { include: { user: { select: { name: true } } } },
      },
      orderBy: { startDateTime: "desc" },
      take: 50,
    });
  }

  return [];
}

export async function getShift(id: string) {
  return prisma.shift.findUnique({
    where: { id },
    include: {
      patient: {
        select: {
          id: true,
          fullName: true,
          address: true,
          neighborhood: true,
          city: true,
          medicalNotes: true,
          allergies: true,
          medications: true,
          clientId: true,
        },
      },
      professional: { include: { user: { select: { name: true, email: true } } } },
      events: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      feedbacks: {
        include: { user: { select: { name: true } } },
      },
    },
  });
}

export async function createShift(data: CreateShiftInput, adminUserId: string) {
  return prisma.shift.create({
    data: {
      startDateTime: new Date(data.startDateTime),
      endDateTime: new Date(data.endDateTime),
      requiredProfessionalType: data.requiredProfessionalType,
      address: data.address,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      needs: data.needs ?? null,
      value: data.value ?? null,
      isUrgent: data.isUrgent ?? false,
      patientId: data.patientId,
      createdByAdminId: adminUserId,
      status: "OPEN",
    },
  });
}

/**
 * Profissional aceita um plantão OPEN.
 * Usa transação para evitar condição de corrida.
 */
export async function assignShift(
  shiftId: string,
  professionalProfileId: string,
  actorUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });

    if (!shift) throw new Error("Plantão não encontrado");

    const status = shift.status as ShiftStatus;
    if (!canTransition(status, "ACCEPTED")) {
      throw new Error(`Plantão com status "${status}" não pode ser aceito`);
    }

    // Check for schedule conflicts
    const conflict = await tx.shift.findFirst({
      where: {
        professionalId: professionalProfileId,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        id: { not: shiftId },
        startDateTime: { lt: shift.endDateTime },
        endDateTime: { gt: shift.startDateTime },
      },
      include: { patient: { select: { fullName: true } } },
    });

    if (conflict) {
      throw new Error(
        `Conflito de horário: você já tem plantão com ${conflict.patient.fullName} nesse período`,
      );
    }

    const beforeJson = JSON.stringify({ status: shift.status, professionalId: shift.professionalId });

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "ACCEPTED",
        professionalId: professionalProfileId,
        acceptedAt: new Date(),
      },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId,
        type: "ACCEPTED",
        description: "Profissional aceitou o plantão",
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ status: "ACCEPTED", professionalId: professionalProfileId }),
      },
    });

    return updated;
  });
}

/**
 * Admin atribui um profissional a um plantão OPEN/URGENT_OPEN.
 * Verifica conflitos de horário do profissional.
 */
export async function adminAssignShift(
  shiftId: string,
  professionalProfileId: string,
  adminUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error("Plantão não encontrado");

    if (shift.status !== "OPEN" && shift.status !== "URGENT_OPEN") {
      throw new Error("Apenas plantões abertos podem receber atribuição");
    }

    // Check for schedule conflicts
    const conflict = await tx.shift.findFirst({
      where: {
        professionalId: professionalProfileId,
        status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        id: { not: shiftId },
        startDateTime: { lt: shift.endDateTime },
        endDateTime: { gt: shift.startDateTime },
      },
      include: { patient: { select: { fullName: true } } },
    });

    if (conflict) {
      throw new Error(
        `Conflito de horário: profissional já tem plantão com ${conflict.patient.fullName} nesse período`,
      );
    }

    const beforeJson = JSON.stringify({ status: shift.status, professionalId: shift.professionalId });

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "ACCEPTED",
        professionalId: professionalProfileId,
        acceptedAt: new Date(),
      },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: adminUserId,
        type: "ASSIGNED",
        description: "Profissional atribuído pelo administrador",
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ status: "ACCEPTED", professionalId: professionalProfileId }),
      },
    });

    return updated;
  });
}

/**
 * Transição genérica de status do shift (start, finish, cancel, etc.)
 */
export async function transitionShift(
  shiftId: string,
  toStatus: ShiftStatus,
  actorUserId: string,
  extra?: { cancelReason?: string; description?: string },
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error("Plantão não encontrado");

    const fromStatus = shift.status as ShiftStatus;
    if (!canTransition(fromStatus, toStatus)) {
      throw new Error(
        `Transição de "${fromStatus}" para "${toStatus}" não é permitida`,
      );
    }

    const beforeJson = JSON.stringify({
      status: shift.status,
      professionalId: shift.professionalId,
      startDateTime: shift.startDateTime,
      endDateTime: shift.endDateTime,
      value: shift.value,
    });

    const updateData: Record<string, unknown> = { status: toStatus };
    let eventType = toStatus;

    if (toStatus === "IN_PROGRESS") {
      updateData.startedAt = new Date();
      eventType = "IN_PROGRESS";
    }
    if (toStatus === "COMPLETED") {
      updateData.finishedAt = new Date();
    }
    if (toStatus === "CONFIRMED") {
      updateData.confirmedAt = new Date();
    }
    if (toStatus === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = extra?.cancelReason ?? "Sem motivo informado";
    }

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: updateData,
    });

    // Map status to event type
    const statusToEvent: Record<string, string> = {
      IN_PROGRESS: "STARTED",
      COMPLETED: "FINISHED",
      CONFIRMED: "CONFIRMED",
      CANCELLED: "CANCELLED",
      VERIFIED: "VERIFIED",
      NO_SHOW: "NO_SHOW",
      OFFERED: "OFFERED",
      ASSIGNED: "ASSIGNED",
    };

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId,
        type: statusToEvent[toStatus] ?? toStatus,
        description: extra?.description ?? `Status alterado para ${toStatus}`,
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ status: toStatus }),
        reason: extra?.cancelReason,
      },
    });

    return updated;
  });
}

/**
 * Admin remove profissional de um plantão, volta para OPEN.
 */
export async function adminUnassignShift(
  shiftId: string,
  adminUserId: string,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({
      where: { id: shiftId },
      include: { professional: { include: { user: { select: { name: true } } } } },
    });
    if (!shift) throw new Error("Plantão não encontrado");

    if (!shift.professionalId) {
      throw new Error("Plantão não tem profissional atribuído");
    }

    const beforeJson = JSON.stringify({
      status: shift.status,
      professionalId: shift.professionalId,
      professionalName: shift.professional?.user?.name,
    });

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: {
        status: "OPEN",
        professionalId: null,
        acceptedAt: null,
        confirmedAt: null,
      },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: adminUserId,
        type: "UNASSIGNED",
        description: `Profissional removido do plantão. Motivo: ${reason}`,
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ status: "OPEN", professionalId: null }),
        reason,
      },
    });

    return updated;
  });
}

/**
 * Admin reagenda um plantão com novas datas.
 */
export async function adminRescheduleShift(
  shiftId: string,
  newStart: string,
  newEnd: string,
  adminUserId: string,
  reason: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error("Plantão não encontrado");

    if (shift.status === "COMPLETED" || shift.status === "VERIFIED" || shift.status === "CANCELLED") {
      throw new Error("Não é possível reagendar um plantão finalizado ou cancelado");
    }

    const startDateTime = new Date(newStart);
    const endDateTime = new Date(newEnd);

    if (endDateTime <= startDateTime) {
      throw new Error("Data de término deve ser posterior à data de início");
    }

    // Check conflicts for assigned professional
    if (shift.professionalId) {
      const conflict = await tx.shift.findFirst({
        where: {
          professionalId: shift.professionalId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
          id: { not: shiftId },
          startDateTime: { lt: endDateTime },
          endDateTime: { gt: startDateTime },
        },
        include: { patient: { select: { fullName: true } } },
      });

      if (conflict) {
        throw new Error(
          `Conflito de horário: profissional já tem plantão com ${conflict.patient.fullName} no novo período`,
        );
      }
    }

    const beforeJson = JSON.stringify({
      startDateTime: shift.startDateTime,
      endDateTime: shift.endDateTime,
    });

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: { startDateTime, endDateTime },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: adminUserId,
        type: "RESCHEDULED",
        description: `Plantão reagendado. Motivo: ${reason}`,
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ startDateTime, endDateTime }),
        reason,
      },
    });

    return updated;
  });
}

/**
 * Admin ajusta valor financeiro de um plantão.
 */
export async function adminAdjustValue(
  shiftId: string,
  adjustmentsCents: number,
  reason: string,
  adminUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error("Plantão não encontrado");

    const baseValue = shift.value ?? 0;
    const totalValueCents = baseValue + adjustmentsCents;

    const beforeJson = JSON.stringify({
      value: shift.value,
      adjustmentsCents: shift.adjustmentsCents,
      totalValueCents: shift.totalValueCents,
    });

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: {
        adjustmentsCents,
        totalValueCents,
      },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: adminUserId,
        type: "VALUE_ADJUSTED",
        description: `Ajuste financeiro de ${adjustmentsCents > 0 ? "+" : ""}${(adjustmentsCents / 100).toFixed(2)}. Motivo: ${reason}`,
        entityType: "SHIFT",
        entityId: shiftId,
        beforeJson,
        afterJson: JSON.stringify({ adjustmentsCents, totalValueCents }),
        reason,
      },
    });

    return updated;
  });
}

/**
 * Admin adiciona nota interna ao plantão.
 */
export async function adminAddNote(
  shiftId: string,
  note: string,
  adminUserId: string,
) {
  return prisma.$transaction(async (tx) => {
    const shift = await tx.shift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error("Plantão não encontrado");

    // Append note to existing notes
    const existingNotes = shift.adminNotes ?? "";
    const timestamp = new Date().toISOString();
    const newNote = existingNotes
      ? `${existingNotes}\n\n---\n[${timestamp}]\n${note}`
      : `[${timestamp}]\n${note}`;

    const updated = await tx.shift.update({
      where: { id: shiftId },
      data: { adminNotes: newNote },
    });

    await tx.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: adminUserId,
        type: "NOTE_ADDED",
        description: `Nota adicionada: ${note.substring(0, 100)}${note.length > 100 ? "..." : ""}`,
        entityType: "SHIFT",
        entityId: shiftId,
      },
    });

    return updated;
  });
}
