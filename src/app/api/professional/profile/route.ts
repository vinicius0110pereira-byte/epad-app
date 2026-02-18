import { NextRequest } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { updateProfessionalProfileSchema } from "@/lib/validators/shift";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "PROFESSIONAL" || !user.professionalProfileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const profile = await prisma.professionalProfile.findUnique({
      where: { id: user.professionalProfileId },
      select: {
        id: true,
        phone: true,
        document: true,
        skills: true,
        professionalType: true,
        avatarUrl: true,
      },
    });

    return Response.json({ data: profile });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "PROFESSIONAL" || !user.professionalProfileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateProfessionalProfileSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const profile = await prisma.professionalProfile.update({
      where: { id: user.professionalProfileId },
      data: {
        phone: parsed.data.phone,
        document: parsed.data.document,
        skills: parsed.data.skills,
      },
    });

    return Response.json({ data: profile });
  } catch (error) {
    return handleAuthError(error);
  }
}
