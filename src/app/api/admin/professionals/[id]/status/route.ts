import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { updateProfessionalStatus } from "@/services/professional.service";
import type { ProfessionalStatus } from "@/types";
import { z } from "zod";

const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]),
  reason: z.string().min(1, "Motivo é obrigatório"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("ADMIN");
    const { id } = await params;

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const profile = await updateProfessionalStatus(
      id,
      parsed.data.status as ProfessionalStatus,
      user.id,
      parsed.data.reason,
    );
    return Response.json({ data: profile });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
