import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
    const { id: shiftId } = await params;

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    if (!shift) {
      return Response.json({ error: "Plantão não encontrado" }, { status: 404 });
    }

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: { contatoConfirmado: true },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
