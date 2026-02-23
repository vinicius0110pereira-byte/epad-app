"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function AdminCreatePatientForm() {
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
          sexo: form.get("sexo") || "NAO_INFORMADO",
          bairro: form.get("bairro"),
          zona: form.get("zona"),
          grauComplexidade: form.get("grauComplexidade"),
          allergies: form.get("allergies") || null,
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
      <Select
        id="sexo"
        name="sexo"
        label="Sexo"
        options={[
          { value: "NAO_INFORMADO", label: "Não informado" },
          { value: "M", label: "Masculino" },
          { value: "F", label: "Feminino" },
          { value: "OUTRO", label: "Outro" },
        ]}
      />
      <Input id="bairro" name="bairro" label="Bairro" required />
      <Select
        id="zona"
        name="zona"
        label="Zona"
        options={[
          { value: "NORTE", label: "Norte (ZN)" },
          { value: "SUL", label: "Sul (ZS)" },
          { value: "LESTE", label: "Leste (ZL)" },
          { value: "OESTE", label: "Oeste (ZO)" },
          { value: "CENTRO", label: "Centro (ZC)" },
        ]}
      />
      <Select
        id="grauComplexidade"
        name="grauComplexidade"
        label="Grau de Complexidade"
        options={[
          { value: "1", label: "1 — Baixo" },
          { value: "2", label: "2 — Médio" },
          { value: "3", label: "3 — Alto" },
        ]}
      />
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
