import { prisma } from "@/lib/prisma";

interface CalendarQuery {
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  patientId: string; // required for calendar mode
  status?: string;
  professionalId?: string;
}

export async function getCalendarShifts(query: CalendarQuery) {
  const where: Record<string, unknown> = {
    startDateTime: {
      gte: new Date(query.from + "T00:00:00"),
      lte: new Date(query.to + "T23:59:59"),
    },
    patientId: query.patientId,
  };

  if (query.status) {
    where.status = query.status;
  }
  if (query.professionalId) {
    where.professionalId = query.professionalId;
  }

  return prisma.shift.findMany({
    where,
    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      status: true,
      isUrgent: true,
      patient: { select: { fullName: true } },
      professional: {
        select: { user: { select: { name: true } } },
      },
    },
    orderBy: { startDateTime: "asc" },
  });
}

export async function getCalendarFiltersData() {
  const [patients, professionals] = await Promise.all([
    prisma.patient.findMany({
      where: { active: true },
      select: { id: true, fullName: true },
      orderBy: { fullName: "asc" },
    }),
    prisma.professionalProfile.findMany({
      where: { approved: true },
      include: { user: { select: { name: true } } },
    }),
  ]);

  return { patients, professionals };
}
