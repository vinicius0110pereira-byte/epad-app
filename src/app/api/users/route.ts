import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { createUserSchema } from "@/lib/validators/user";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        professionalProfile: { select: { id: true, professionalType: true, approved: true, avatarUrl: true } },
        clientProfile: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ data: users });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, email, password, role, professionalType, phone } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        active: true,
      },
    });

    // Create profile based on role
    let professionalProfileId: string | undefined;

    if (role === "PROFESSIONAL") {
      const profile = await prisma.professionalProfile.create({
        data: {
          userId: user.id,
          professionalType: professionalType ?? "CAREGIVER",
          approved: true,
          phone: phone ?? null,
        },
      });
      professionalProfileId = profile.id;
    }

    if (role === "CLIENT") {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
          phone: phone ?? null,
        },
      });
    }

    return Response.json(
      { data: { id: user.id, email: user.email, role: user.role, professionalProfileId } },
      { status: 201 },
    );
  } catch (error) {
    return handleAuthError(error);
  }
}
