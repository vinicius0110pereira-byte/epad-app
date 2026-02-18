"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Search, UserPlus, AlertTriangle } from "lucide-react";

interface Professional {
  id: string;
  name: string;
  type: string;
  hasConflict: boolean;
}

interface Props {
  shiftId: string;
  professionals: Professional[];
}

const TYPE_LABELS: Record<string, string> = {
  CAREGIVER: "Cuidador(a)",
  NURSE: "Enfermeiro(a)",
  TECHNICIAN: "Técnico(a)",
  OTHER: "Outro",
};

export function AssignProfessionalPanel({ shiftId, professionals }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = professionals.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleAssign() {
    if (!selectedId) return;

    const prof = professionals.find((p) => p.id === selectedId);
    if (prof?.hasConflict) {
      const ok = confirm(
        "Este profissional tem conflito de horário. Deseja continuar mesmo assim?",
      );
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/shifts/${shiftId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalProfileId: selectedId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao atribuir profissional");
        return;
      }

      toast.success("Profissional atribuído com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="assign">
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar profissional..."
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-64 space-y-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Nenhum profissional encontrado.
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
              className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                p.id === selectedId
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                  : "border-slate-200 hover:border-blue-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {TYPE_LABELS[p.type] || p.type}
                  </p>
                </div>
                {p.hasConflict && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <AlertTriangle className="h-3 w-3" />
                    Conflito
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <Button
        onClick={handleAssign}
        disabled={!selectedId}
        loading={loading}
        className="mt-3 w-full"
        size="sm"
      >
        <UserPlus className="mr-1.5 h-4 w-4" />
        Atribuir Profissional
      </Button>
    </div>
  );
}
