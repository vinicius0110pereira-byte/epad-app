import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CreateFeedbackInput } from "@/lib/validators/shift";

export async function createFeedback(
  shiftId: string,
  userId: string,
  fromRole: string,
  data: CreateFeedbackInput,
) {
  try {
    return await prisma.feedback.create({
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Você já avaliou este plantão");
    }
    throw err;
  }
}
