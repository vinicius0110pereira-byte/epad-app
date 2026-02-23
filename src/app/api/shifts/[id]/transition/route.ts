import { NextRequest } from "next/server";
import { requireAuth, assertCanAccessShift, handleAuthError } from "@/lib/authorize";
import { transitionShift } from "@/services/shift.service";
import type { ShiftStatus } from "@/types";
import { z } from "zod";

const transitionSchema = z.object({
  toStatus: z.enum([
    "OPEN",
    "OFFERED",
    "ASSIGNED",
    "ACCEPTED",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "VERIFIED",
    "CANCELLED",
    "NO_SHOW",
    "URGENT_OPEN",
  ]),
  cancelReason: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: shiftId } = await params;
    await assertCanAccessShift(user, shiftId);

    const body = await req.json();
    const parsed = transitionSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const shift = await transitionShift(
      shiftId,
      parsed.data.toStatus as ShiftStatus,
      user.id,
      {
        cancelReason: parsed.data.cancelReason,
        description: parsed.data.description,
      },
    );
    return Response.json({ data: shift });
  } catch (error) {
    if (error instanceof Error && error.message.includes("não é permitida")) {
      return Response.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("confirmar o contato")) {
      return Response.json({ error: error.message }, { status: 422 });
    }
    return handleAuthError(error);
  }
}
