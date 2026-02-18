import { NextRequest } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { updatePatientSchema } from "@/lib/validators/shift";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    if (user.role !== "CLIENT" || !user.clientProfileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const { id } = await params;

    // Verify patient belongs to this client
    const patient = await prisma.patient.findFirst({
      where: { id, clientId: user.clientProfileId },
    });

    if (!patient) {
      return Response.json({ error: "Paciente não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updatePatientSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await prisma.patient.update({
      where: { id },
      data: {
        ...(parsed.data.medicalNotes !== undefined && { medicalNotes: parsed.data.medicalNotes }),
        ...(parsed.data.medications !== undefined && { medications: parsed.data.medications }),
        ...(parsed.data.allergies !== undefined && { allergies: parsed.data.allergies }),
        ...(parsed.data.address !== undefined && { address: parsed.data.address }),
        ...(parsed.data.neighborhood !== undefined && { neighborhood: parsed.data.neighborhood }),
        ...(parsed.data.city !== undefined && { city: parsed.data.city }),
      },
    });

    return Response.json({ data: updated });
  } catch (error) {
    return handleAuthError(error);
  }
}
