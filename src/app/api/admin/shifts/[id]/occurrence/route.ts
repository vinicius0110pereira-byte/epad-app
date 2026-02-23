import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole("ADMIN");
    const { id: shiftId } = await params;

    const body = await req.json();
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (!description) {
      return Response.json({ error: "Descrição obrigatória" }, { status: 400 });
    }

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      select: { id: true },
    });

    if (!shift) {
      return Response.json({ error: "Plantão não encontrado" }, { status: 404 });
    }

    const event = await prisma.shiftEvent.create({
      data: {
        shiftId,
        actorUserId: user.id,
        type: "OCCURRENCE",
        description,
        entityType: "SHIFT",
        entityId: shiftId,
      },
    });

    return Response.json({ data: event });
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    return handleAuthError(error);
  }
}
