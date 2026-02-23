import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { CreatePatientInput } from "@/lib/validators/patient";

export async function listPatients(user: SessionUser) {
  if (user.role === "ADMIN") {
    return prisma.patient.findMany({
      where: { active: true },
      orderBy: { fullName: "asc" },
    });
  }

  if (user.role === "PROFESSIONAL" && user.professionalProfileId) {
    const shifts = await prisma.shift.findMany({
      where: { professionalId: user.professionalProfileId },
      select: { patientId: true },
      distinct: ["patientId"],
    });
    const patientIds = shifts.map((s) => s.patientId);
    return prisma.patient.findMany({
      where: { id: { in: patientIds }, active: true },
      orderBy: { fullName: "asc" },
    });
  }

  return [];
}

export async function getPatient(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}

export async function createPatient(data: CreatePatientInput) {
  return prisma.patient.create({
    data: {
      fullName: data.fullName,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      bairro: data.bairro,
      zona: data.zona,
      grauComplexidade: data.grauComplexidade,
      medications: data.medications ?? null,
      allergies: data.allergies ?? null,
    },
  });
}
