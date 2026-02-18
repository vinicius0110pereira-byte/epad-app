import { prisma } from "@/lib/prisma";
import type { CreateFeedbackInput } from "@/lib/validators/shift";

export async function createFeedback(
  shiftId: string,
  userId: string,
  fromRole: string,
  data: CreateFeedbackInput,
) {
  // Verificar se já existe feedback deste user neste shift
  const existing = await prisma.feedback.findUnique({
    where: { shiftId_userId: { shiftId, userId } },
  });
  if (existing) {
    throw new Error("Você já avaliou este plantão");
  }

  return prisma.feedback.create({
    data: {
      shiftId,
      userId,
      fromRole,
      rating: data.rating,
      ratingPunctuality: data.ratingPunctuality ?? null,
      ratingCare: data.ratingCare ?? null,
      ratingCommunication: data.ratingCommunication ?? null,
      notes: data.notes ?? null,
    },
  });
}
