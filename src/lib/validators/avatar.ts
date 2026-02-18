import path from "path";

export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Retorna a extensão válida de um nome de arquivo, ou null se inválida.
 */
export function getValidExtension(fileName: string): string | null {
  const ext = path.extname(fileName).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : null;
}
