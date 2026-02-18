import { prisma } from "@/lib/prisma";
import type { CreateEventInput } from "@/lib/validators/shift";

export async function listShiftEvents(shiftId: string) {
  return prisma.shiftEvent.findMany({
    where: { shiftId },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function createShiftEvent(
  shiftId: string,
  actorUserId: string,
  data: CreateEventInput,
) {
  return prisma.shiftEvent.create({
    data: {
      shiftId,
      actorUserId,
      type: data.type,
      description: data.description ?? null,
      metadata: data.metadata ?? null,
      severity: data.severity ?? null,
    },
  });
}
