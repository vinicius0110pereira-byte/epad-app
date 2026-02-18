import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { adminAddNote } from "@/services/shift.service";
import { addNoteSchema } from "@/lib/validators/shift";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("ADMIN");
    const { id: shiftId } = await params;

    const body = await req.json();
    const parsed = addNoteSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const shift = await adminAddNote(shiftId, parsed.data.note, user.id);
    return Response.json({ data: shift });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
