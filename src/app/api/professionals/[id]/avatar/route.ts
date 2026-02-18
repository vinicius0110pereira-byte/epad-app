import { NextRequest } from "next/server";
import { requireAuth, handleAuthError } from "@/lib/authorize";
import { validateAvatarFile, saveAvatar, removeAvatar } from "@/services/avatar.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: profileId } = await params;

    // ADMIN pode qualquer. PROFESSIONAL só o próprio perfil.
    if (user.role === "PROFESSIONAL" && user.professionalProfileId !== profileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (user.role !== "ADMIN" && user.role !== "PROFESSIONAL") {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Arquivo não enviado" }, { status: 400 });
    }

    const validationError = validateAvatarFile(file);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    // Remove avatar antigo antes de salvar o novo
    await removeAvatar(profileId);
    const avatarUrl = await saveAvatar(profileId, file);

    return Response.json({ data: { avatarUrl } });
  } catch (error) {
    return handleAuthError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id: profileId } = await params;

    if (user.role === "PROFESSIONAL" && user.professionalProfileId !== profileId) {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }
    if (user.role !== "ADMIN" && user.role !== "PROFESSIONAL") {
      return Response.json({ error: "Acesso negado" }, { status: 403 });
    }

    await removeAvatar(profileId);

    return Response.json({ data: { avatarUrl: null } });
  } catch (error) {
    return handleAuthError(error);
  }
}
