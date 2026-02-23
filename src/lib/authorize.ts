import { auth } from "./auth";
import { prisma } from "./prisma";
import type { SessionUser, UserRole } from "@/types";

class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Obtém o usuário da sessão. Lança erro se não autenticado.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    throw new AuthError("Não autenticado", 401);
  }
  return session.user as SessionUser;
}

/**
 * Requer um ou mais roles. Lança erro se não autorizado.
 */
export async function requireRole(
  ...roles: UserRole[]
): Promise<SessionUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) {
    throw new AuthError("Acesso negado", 403);
  }
  return user;
}

/**
 * Verifica se o usuário pode acessar um paciente.
 * ADMIN: sempre pode.
 * PROFESSIONAL: apenas se tem shift atribuído para o paciente.
 */
export async function assertCanAccessPatient(
  user: SessionUser,
  patientId: string,
): Promise<void> {
  if (user.role === "ADMIN") return;

  if (user.role === "PROFESSIONAL") {
    if (!user.professionalProfileId) {
      throw new AuthError("Perfil profissional não encontrado", 403);
    }
    const shift = await prisma.shift.findFirst({
      where: {
        patientId,
        professionalId: user.professionalProfileId,
      },
    });
    if (!shift) {
      throw new AuthError("Paciente não encontrado", 404);
    }
    return;
  }

  throw new AuthError("Acesso negado", 403);
}

/**
 * Verifica se o usuário pode acessar um shift.
 * ADMIN: sempre pode.
 * PROFESSIONAL: se assignado ao shift OU shift OPEN/URGENT_OPEN do seu tipo.
 */
export async function assertCanAccessShift(
  user: SessionUser,
  shiftId: string,
): Promise<void> {
  if (user.role === "ADMIN") return;

  const shift = await prisma.shift.findUnique({
    where: { id: shiftId },
    include: {
      professional: { select: { userId: true } },
    },
  });

  if (!shift) {
    throw new AuthError("Plantão não encontrado", 404);
  }

  if (user.role === "PROFESSIONAL") {
    if (!user.professionalProfileId) {
      throw new AuthError("Perfil profissional não encontrado", 403);
    }
    // Pode ver se atribuído a ele
    if (shift.professionalId === user.professionalProfileId) return;
    // Pode ver se OPEN ou URGENT_OPEN (para aceitar)
    if (shift.status === "OPEN" || shift.status === "URGENT_OPEN") return;
    throw new AuthError("Plantão não encontrado", 404);
  }

  throw new AuthError("Acesso negado", 403);
}

/**
 * Wrapper para handlers de API que captura AuthError e retorna JSON.
 */
export function handleAuthError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("Unexpected error:", error);
  return Response.json({ error: "Erro interno" }, { status: 500 });
}
