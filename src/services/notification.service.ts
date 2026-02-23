import { prisma } from "@/lib/prisma";

/**
 * Cria notificações para todos os profissionais ACTIVE com o tipo exigido
 * quando um plantão urgente é criado.
 */
export async function createNotificationsForUrgentShift(
  shiftId: string,
  patientName: string,
  startDateTime: Date,
  requiredType: string,
) {
  const profiles = await prisma.professionalProfile.findMany({
    where: {
      status: "ACTIVE",
      professionalType: requiredType,
    },
    select: { userId: true },
  });

  if (profiles.length === 0) return;

  const startDate = new Date(startDateTime).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  await prisma.notification.createMany({
    data: profiles.map((p) => ({
      userId: p.userId,
      type: "NEW_URGENT_SHIFT",
      title: "Plantão urgente disponível",
      body: `Paciente: ${patientName} — ${startDate}`,
      link: `/professional/shifts/${shiftId}`,
    })),
  });
}

/**
 * Cria uma notificação para um profissional específico via seu profileId.
 */
export async function createNotificationForProfessional(
  professionalProfileId: string,
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: professionalProfileId },
    select: { userId: true },
  });

  if (!profile) return;

  await prisma.notification.create({
    data: {
      userId: profile.userId,
      type,
      title,
      body,
      link: link ?? null,
    },
  });
}

/**
 * Retorna as notificações não lidas de um usuário (máximo 20, mais recentes primeiro).
 */
export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId, read: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

/**
 * Cria notificações para todos os usuários com role ADMIN.
 */
export async function createNotificationsForAllAdmins(
  type: string,
  title: string,
  body: string,
  link?: string,
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map((a) => ({
      userId: a.id,
      type,
      title,
      body,
      link: link ?? null,
    })),
  });
}

/**
 * Marca notificações como lidas. Garante que apenas o próprio usuário pode marcar.
 */
export async function markNotificationsRead(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  return prisma.notification.updateMany({
    where: {
      id: { in: ids },
      userId,
    },
    data: { read: true },
  });
}
