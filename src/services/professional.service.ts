import { prisma } from "@/lib/prisma";
import type { ProfessionalStatus } from "@/types";

interface ListProfessionalsFilters {
  search?: string;
  status?: ProfessionalStatus;
  professionalType?: string;
  page: number;
  pageSize: number;
}

export async function listProfessionals(filters: ListProfessionalsFilters) {
  const { search, status, professionalType, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (search) {
    where.user = { name: { contains: search } };
  }
  if (status) {
    where.status = status;
  }
  if (professionalType) {
    where.professionalType = professionalType;
  }

  const [professionals, total] = await Promise.all([
    prisma.professionalProfile.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
      skip,
      take: pageSize,
    }),
    prisma.professionalProfile.count({ where }),
  ]);

  return { professionals, total };
}

export async function getProfessional(id: string) {
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
    },
  });

  if (!profile) return null;

  // Get events where this professional's user was the actor
  const events = await prisma.shiftEvent.findMany({
    where: { actorUserId: profile.userId },
    include: {
      shift: { select: { id: true, patient: { select: { fullName: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { ...profile, recentEvents: events };
}

export async function updateProfessionalStatus(
  id: string,
  status: ProfessionalStatus,
  adminUserId: string,
  reason: string,
) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!profile) throw new Error("Profissional não encontrado");

  const beforeStatus = profile.status;

  const updated = await prisma.professionalProfile.update({
    where: { id },
    data: {
      status,
      approved: status === "ACTIVE",
    },
  });

  // Find any shift to attach the audit event (use most recent or create a synthetic one)
  // For professional status changes, we store it as an event on the first available shift
  // or we skip if there are no shifts
  const anyShift = await prisma.shift.findFirst({
    where: { professionalId: id },
    orderBy: { createdAt: "desc" },
  });

  if (anyShift) {
    await prisma.shiftEvent.create({
      data: {
        shiftId: anyShift.id,
        actorUserId: adminUserId,
        type: "OCCURRENCE",
        description: `Status do profissional ${profile.user.name} alterado de ${beforeStatus} para ${status}. Motivo: ${reason}`,
        entityType: "PROFESSIONAL",
        entityId: id,
        beforeJson: JSON.stringify({ status: beforeStatus }),
        afterJson: JSON.stringify({ status }),
        reason,
      },
    });
  }

  return updated;
}

export async function updateProfessionalProfile(
  id: string,
  data: { internalScore?: number; internalNotes?: string; skills?: string },
  adminUserId: string,
) {
  const profile = await prisma.professionalProfile.findUnique({ where: { id } });
  if (!profile) throw new Error("Profissional não encontrado");

  const updateData: Record<string, unknown> = {};
  if (data.internalScore !== undefined) updateData.internalScore = data.internalScore;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
  if (data.skills !== undefined) updateData.skills = data.skills;

  return prisma.professionalProfile.update({
    where: { id },
    data: updateData,
  });
}

export async function recalcProfessionalCounters(profileId: string) {
  const [totalShifts, completedShifts, feedbacks] = await Promise.all([
    prisma.shift.count({ where: { professionalId: profileId } }),
    prisma.shift.count({ where: { professionalId: profileId, status: { in: ["COMPLETED", "VERIFIED"] } } }),
    prisma.feedback.findMany({
      where: {
        shift: { professionalId: profileId },
        fromRole: { not: "PROFESSIONAL" },
      },
      select: { rating: true },
    }),
  ]);

  const ratingAvg = feedbacks.length > 0
    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
    : null;

  return prisma.professionalProfile.update({
    where: { id: profileId },
    data: { totalShifts, completedShifts, ratingAvg },
  });
}
