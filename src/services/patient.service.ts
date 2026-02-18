import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";
import type { CreatePatientInput } from "@/lib/validators/patient";

export async function listPatients(user: SessionUser) {
  if (user.role === "ADMIN") {
    return prisma.patient.findMany({
      where: { active: true },
      include: { client: { include: { user: { select: { name: true } } } } },
      orderBy: { fullName: "asc" },
    });
  }

  if (user.role === "CLIENT" && user.clientProfileId) {
    return prisma.patient.findMany({
      where: { clientId: user.clientProfileId, active: true },
      orderBy: { fullName: "asc" },
    });
  }

  // PROFESSIONAL: retorna pacientes dos shifts atribuídos
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
      address: data.address,
      neighborhood: data.neighborhood ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zipCode: data.zipCode ?? null,
      medicalNotes: data.medicalNotes ?? null,
      medications: data.medications ?? null,
      allergies: data.allergies ?? null,
      clientId: data.clientId,
    },
  });
}
