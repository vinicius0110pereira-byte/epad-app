import { NextRequest } from "next/server";
import { requireAuth, assertCanAccessShift, handleAuthError } from "@/lib/authorize";
import { createFeedbackSchema } from "@/lib/validators/shift";
import { createFeedback } from "@/services/feedback.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: shiftId } = await params;

    // Verificar acesso e status
    await assertCanAccessShift(user, shiftId);

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift || (shift.status !== "COMPLETED" && shift.status !== "VERIFIED")) {
      return Response.json(
        { error: "Feedback só é possível em plantões concluídos" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = createFeedbackSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const feedback = await createFeedback(
      shiftId,
      user.id,
      user.role,
      parsed.data,
    );
    return Response.json({ data: feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("já avaliou")) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    return handleAuthError(error);
  }
}
