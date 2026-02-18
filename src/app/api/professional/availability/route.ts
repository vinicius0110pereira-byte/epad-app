import { NextRequest } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const availabilitySchema = z.array(
  z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  }),
);

export async function GET() {
  try {
    const user = await requireAuth();

    if (user.role !== "PROFESSIONAL" || !user.professionalProfileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const availability = await prisma.availability.findMany({
      where: { professionalId: user.professionalProfileId },
      orderBy: { dayOfWeek: "asc" },
    });

    return Response.json({ data: availability });
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
    const parsed = availabilitySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const professionalId = user.professionalProfileId;

    // If empty array, just clear availability
    if (parsed.data.length === 0) {
      await prisma.availability.deleteMany({ where: { professionalId } });
      return Response.json({ data: [] });
    }

    const availability = await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { professionalId },
      });

      const created = await Promise.all(
        parsed.data.map((entry) =>
          tx.availability.create({
            data: {
              professionalId,
              dayOfWeek: entry.dayOfWeek,
              startTime: entry.startTime,
              endTime: entry.endTime,
            },
          }),
        ),
      );

      return created;
    });

    return Response.json({ data: availability });
  } catch (error) {
    return handleAuthError(error);
  }
}
