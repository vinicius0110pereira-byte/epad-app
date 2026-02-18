import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_MIME_TYPES,
  MAX_AVATAR_SIZE,
  getValidExtension,
} from "@/lib/validators/avatar";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

/**
 * Valida o arquivo de avatar. Retorna string de erro ou null se válido.
 */
export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.";
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return "Arquivo muito grande. Tamanho máximo: 2MB.";
  }
  const ext = getValidExtension(file.name);
  if (!ext) {
    return "Extensão de arquivo não permitida.";
  }
  return null;
}

/**
 * Salva o avatar no disco e atualiza o DB. Retorna a URL pública.
 */
export async function saveAvatar(profileId: string, file: File): Promise<string> {
  await ensureUploadDir();

  const ext = getValidExtension(file.name);
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  const avatarUrl = `/uploads/avatars/${fileName}`;

  await prisma.professionalProfile.update({
    where: { id: profileId },
    data: { avatarUrl },
  });

  return avatarUrl;
}

/**
 * Remove o avatar do disco e limpa o campo no DB.
 */
export async function removeAvatar(profileId: string): Promise<void> {
  const profile = await prisma.professionalProfile.findUnique({
    where: { id: profileId },
    select: { avatarUrl: true },
  });

  if (profile?.avatarUrl) {
    const filePath = path.join(process.cwd(), "public", profile.avatarUrl);
    try {
      await fs.unlink(filePath);
    } catch {
      // arquivo pode já ter sido removido
    }
  }

  await prisma.professionalProfile.update({
    where: { id: profileId },
    data: { avatarUrl: null },
  });
}
