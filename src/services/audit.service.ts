import { prisma } from "@/lib/prisma";

interface ListAuditEventsFilters {
  type?: string;
  actorUserId?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
  pageSize: number;
}

export async function listAuditEvents(filters: ListAuditEventsFilters) {
  const { type, actorUserId, entityType, dateFrom, dateTo, page, pageSize } = filters;
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (type) {
    where.type = type;
  }
  if (actorUserId) {
    where.actorUserId = actorUserId;
  }
  if (entityType) {
    where.entityType = entityType;
  }
  if (dateFrom || dateTo) {
    const createdAt: Record<string, Date> = {};
    if (dateFrom) createdAt.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [events, total] = await Promise.all([
    prisma.shiftEvent.findMany({
      where,
      include: {
        actor: { select: { name: true } },
        shift: {
          select: {
            id: true,
            patient: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.shiftEvent.count({ where }),
  ]);

  return { events, total };
}

export async function getAuditStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [last7Days, last30Days] = await Promise.all([
    prisma.shiftEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { type: true },
    }),
    prisma.shiftEvent.groupBy({
      by: ["type"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: { type: true },
    }),
  ]);

  return {
    last7Days: last7Days.map((g) => ({ type: g.type, count: g._count.type })),
    last30Days: last30Days.map((g) => ({ type: g.type, count: g._count.type })),
  };
}
