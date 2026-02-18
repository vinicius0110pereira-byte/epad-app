"use client";

import { toast } from "sonner";
import { Copy } from "lucide-react";

interface Props {
  phone: string;
}

export function CopyPhoneButton({ phone }: Props) {
  function handleCopy() {
    navigator.clipboard.writeText(phone);
    toast.success("Telefone copiado!");
  }

  return (
    <button
      onClick={handleCopy}
      title="Copiar telefone"
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
    >
      <Copy className="h-3 w-3" />
      Copiar
    </button>
  );
}
