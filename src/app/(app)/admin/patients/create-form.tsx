"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  clients: { id: string; name: string }[];
}

export function AdminCreatePatientForm({ clients }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          address: form.get("address"),
          neighborhood: form.get("neighborhood") || null,
          city: form.get("city") || null,
          medicalNotes: form.get("medicalNotes") || null,
          allergies: form.get("allergies") || null,
          clientId: form.get("clientId"),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar paciente");
        return;
      }

      e.currentTarget.reset();
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input id="fullName" name="fullName" label="Nome completo" required />
      <Input id="address" name="address" label="Endereço" required />
      <Input id="neighborhood" name="neighborhood" label="Bairro" />
      <Input id="city" name="city" label="Cidade" />
      <Select
        id="clientId"
        name="clientId"
        label="Responsável (Cliente)"
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
      />
      <Textarea id="medicalNotes" name="medicalNotes" label="Notas médicas" />
      <Input id="allergies" name="allergies" label="Alergias" />

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Criar Paciente
      </Button>
    </form>
  );
}
