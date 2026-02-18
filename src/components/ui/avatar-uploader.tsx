"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./avatar";

interface AvatarUploaderProps {
  professionalProfileId: string;
  currentAvatarUrl?: string | null;
  professionalName?: string | null;
}

export function AvatarUploader({
  professionalProfileId,
  currentAvatarUrl,
  professionalName,
}: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const displayUrl = preview ?? currentAvatarUrl ?? null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    upload(file);
  }

  async function upload(file: File) {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/professionals/${professionalProfileId}/avatar`, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Erro ao enviar foto");
        setPreview(null);
        return;
      }

      toast.success("Foto atualizada com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
      setPreview(null);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/professionals/${professionalProfileId}/avatar`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error || "Erro ao remover foto");
        return;
      }

      toast.success("Foto removida");
      setPreview(null);
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar src={displayUrl} name={professionalName} size="xl" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          {currentAvatarUrl ? "Trocar foto" : "Adicionar foto"}
        </button>
        {(currentAvatarUrl || preview) && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Remover
          </button>
        )}
      </div>
    </div>
  );
}
