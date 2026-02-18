import { NextRequest } from "next/server";
import { requireAuth, assertCanAccessShift, handleAuthError } from "@/lib/authorize";
import { assignShift, adminAssignShift } from "@/services/shift.service";
import { z } from "zod";

const adminAssignSchema = z.object({
  professionalProfileId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: shiftId } = await params;

    await assertCanAccessShift(user, shiftId);

    // Admin assigns a professional
    if (user.role === "ADMIN") {
      const body = await req.json();
      const parsed = adminAssignSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: "ID do profissional é obrigatório" },
          { status: 400 },
        );
      }

      const shift = await adminAssignShift(
        shiftId,
        parsed.data.professionalProfileId,
        user.id,
      );
      return Response.json({ data: shift });
    }

    // Professional self-assigns
    if (user.role === "PROFESSIONAL") {
      if (!user.professionalProfileId) {
        return Response.json(
          { error: "Perfil profissional não encontrado" },
          { status: 403 },
        );
      }

      const shift = await assignShift(
        shiftId,
        user.professionalProfileId,
        user.id,
      );
      return Response.json({ data: shift });
    }

    return Response.json({ error: "Acesso negado" }, { status: 403 });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("não pode ser aceito") ||
        error.message.includes("Conflito de horário") ||
        error.message.includes("Apenas plantões abertos")
      ) {
        return Response.json({ error: error.message }, { status: 409 });
      }
    }
    return handleAuthError(error);
  }
}
