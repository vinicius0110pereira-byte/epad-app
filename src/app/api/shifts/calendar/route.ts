import { NextRequest } from "next/server";
import { requireRole, handleAuthError } from "@/lib/authorize";
import { getCalendarShifts } from "@/services/calendar.service";

/**
 * GET /api/shifts/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&patientId=xxx[&status=&professionalId=]
 * Returns shifts in date range for a specific patient. ADMIN only.
 */
export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const url = req.nextUrl;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const patientId = url.searchParams.get("patientId");

    if (!from || !to || !patientId) {
      return Response.json(
        { error: "Parâmetros 'from', 'to' e 'patientId' são obrigatórios" },
        { status: 400 },
      );
    }

    const shifts = await getCalendarShifts({
      from,
      to,
      patientId,
      status: url.searchParams.get("status") || undefined,
      professionalId: url.searchParams.get("professionalId") || undefined,
    });

    return Response.json({ data: shifts });
  } catch (error) {
    return handleAuthError(error);
  }
}
