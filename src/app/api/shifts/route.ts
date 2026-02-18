import { NextRequest } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/authorize";
import { createShiftSchema } from "@/lib/validators/shift";
import { listShifts, createShift } from "@/services/shift.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const shifts = await listShifts(user);
    return Response.json({ data: shifts });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const body = await req.json();
    const parsed = createShiftSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const shift = await createShift(parsed.data, user.id);
    return Response.json({ data: shift }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
