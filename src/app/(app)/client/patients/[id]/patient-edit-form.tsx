"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  patientId: string;
  address: string;
  neighborhood: string;
  city: string;
  medicalNotes: string;
  medications: string;
  allergies: string;
}

export function PatientEditForm({
  patientId,
  address: initAddr,
  neighborhood: initNeigh,
  city: initCity,
  medicalNotes: initNotes,
  medications: initMeds,
  allergies: initAllergies,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(initAddr);
  const [neighborhood, setNeighborhood] = useState(initNeigh);
  const [city, setCity] = useState(initCity);
  const [medicalNotes, setMedicalNotes] = useState(initNotes);
  const [medications, setMedications] = useState(initMeds);
  const [allergies, setAllergies] = useState(initAllergies);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/client/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          neighborhood: neighborhood || null,
          city: city || null,
          medicalNotes: medicalNotes || null,
          medications: medications || null,
          allergies: allergies || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
        return;
      }

      toast.success("Paciente atualizado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Dados do Paciente</h2>

      <Input
        id="address"
        label="Endereço"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="neighborhood"
          label="Bairro"
          value={neighborhood}
          onChange={(e) => setNeighborhood(e.target.value)}
        />
        <Input
          id="city"
          label="Cidade"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>

      <Textarea
        id="allergies"
        name="allergies"
        label="Alergias"
        placeholder="Ex: Dipirona, Látex..."
        value={allergies}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAllergies(e.target.value)}
      />

      <Textarea
        id="medications"
        name="medications"
        label="Medicações"
        placeholder="Liste as medicações em uso..."
        value={medications}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMedications(e.target.value)}
      />

      <Textarea
        id="medicalNotes"
        name="medicalNotes"
        label="Notas Médicas"
        placeholder="Informações relevantes para o cuidador..."
        value={medicalNotes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMedicalNotes(e.target.value)}
      />

      <Button type="submit" loading={loading} className="w-full">
        Salvar Alterações
      </Button>
    </form>
  );
}
