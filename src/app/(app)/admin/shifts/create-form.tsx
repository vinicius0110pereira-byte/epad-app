"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PatientOption {
  id: string;
  name: string;
  bairro: string;
  zona: string;
}

interface Props {
  patients: PatientOption[];
}

export function AdminCreateShiftForm({ patients }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Salvar referência antes do await — após yield o DOM anula e.currentTarget
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const value = form.get("value");

    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: form.get("patientId"),
          startDateTime: form.get("startDateTime"),
          endDateTime: form.get("endDateTime"),
          requiredProfessionalType: form.get("requiredProfessionalType"),
          needs: form.get("needs") || null,
          value: value ? Math.round(parseFloat(value as string) * 100) : null,
          isUrgent: form.get("isUrgent") === "on",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao criar plantão");
        return;
      }

      formElement.reset();
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="patientId" className="mb-1 block text-sm font-medium text-slate-700">
          Paciente
        </label>
        <select
          id="patientId"
          name="patientId"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <Input
        id="startDateTime"
        name="startDateTime"
        label="Início"
        type="datetime-local"
        required
      />
      <Input
        id="endDateTime"
        name="endDateTime"
        label="Término"
        type="datetime-local"
        required
      />
      <Select
        id="requiredProfessionalType"
        name="requiredProfessionalType"
        label="Tipo de profissional"
        options={[
          { value: "CAREGIVER", label: "Cuidador" },
          { value: "NURSE", label: "Enfermeiro(a)" },
          { value: "TECHNICIAN", label: "Técnico(a)" },
          { value: "OTHER", label: "Outro" },
        ]}
      />
      <Textarea id="needs" name="needs" label="Necessidades" />
      <Input
        id="value"
        name="value"
        label="Valor (R$)"
        type="number"
        step="0.01"
        min="0"
        placeholder="250.00"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isUrgent" className="rounded" />
        Urgente
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} className="w-full">
        Criar Plantão
      </Button>
    </form>
  );
}
