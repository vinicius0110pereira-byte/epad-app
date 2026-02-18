import { NextRequest } from "next/server";
import { requireAuth, requireRole, assertCanAccessShift, handleAuthError } from "@/lib/authorize";
import { createEventSchema } from "@/lib/validators/shift";
import { listShiftEvents, createShiftEvent } from "@/services/event.service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: shiftId } = await params;
    await assertCanAccessShift(user, shiftId);

    const events = await listShiftEvents(shiftId);
    return Response.json({ data: events });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("PROFESSIONAL", "ADMIN");
    const { id: shiftId } = await params;
    await assertCanAccessShift(user, shiftId);

    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const event = await createShiftEvent(shiftId, user.id, parsed.data);
    return Response.json({ data: event }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
