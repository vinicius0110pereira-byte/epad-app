"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  shiftId: string;
}

const EVENT_TYPES = [
  { value: "OCCURRENCE", label: "Ocorrência geral" },
  { value: "MED_REQUEST", label: "Solicitação de medicamento" },
  { value: "MEDICATION_GIVEN", label: "Medicação administrada" },
  { value: "VITAL_SIGNS", label: "Sinais vitais" },
  { value: "MEAL", label: "Alimentação" },
  { value: "HYGIENE", label: "Higiene" },
  { value: "PATIENT_FALL", label: "Queda do paciente" },
  { value: "EMERGENCY", label: "Emergência" },
  { value: "LATE", label: "Atraso" },
  { value: "RESOLVED", label: "Situação resolvida" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "Sem severidade" },
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "CRITICAL", label: "Crítica" },
];

const SEVERITY_COLORS: Record<string, string> = {
  LOW: "bg-green-100 text-green-800",
  MEDIUM: "bg-yellow-100 text-yellow-800",
  HIGH: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export function AddEventForm({ shiftId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const severity = form.get("severity") as string;

    try {
      const res = await fetch(`/api/shifts/${shiftId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.get("type"),
          description: form.get("description") || null,
          severity: severity || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao registrar evento");
        return;
      }

      setSuccess(true);
      formElement.reset();
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select
        id="type"
        name="type"
        label="Tipo de evento"
        options={EVENT_TYPES}
      />
      <div>
        <label htmlFor="severity" className="mb-1 block text-sm font-medium text-slate-700">
          Severidade
        </label>
        <select
          id="severity"
          name="severity"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <Textarea
        id="description"
        name="description"
        label="Descrição"
        placeholder="Descreva o evento..."
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-sm text-emerald-600">Evento registrado!</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Registrar
      </Button>
    </form>
  );
}
