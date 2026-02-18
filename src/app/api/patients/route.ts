import { NextRequest } from "next/server";
import { requireAuth, requireRole, handleAuthError } from "@/lib/authorize";
import { createPatientSchema } from "@/lib/validators/patient";
import { listPatients, createPatient } from "@/services/patient.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const patients = await listPatients(user);
    return Response.json({ data: patients });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("ADMIN");
    const body = await req.json();
    const parsed = createPatientSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Dados inválidos", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const patient = await createPatient(parsed.data);
    return Response.json({ data: patient }, { status: 201 });
  } catch (error) {
    return handleAuthError(error);
  }
}
