"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { AvatarUploader } from "@/components/ui/avatar-uploader";
import { toast } from "sonner";

export function CreateUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("CLIENT");
  const [createdProfile, setCreatedProfile] = useState<{ id: string; name: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const name = form.get("name") as string;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: form.get("email"),
          password: form.get("password"),
          role: form.get("role"),
          professionalType: form.get("professionalType") || undefined,
          phone: form.get("phone") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar usuário");
        return;
      }

      const { data } = await res.json();
      toast.success("Usuário criado com sucesso");

      if (data.professionalProfileId) {
        setCreatedProfile({ id: data.professionalProfileId, name });
      } else {
        formElement.reset();
        setRole("CLIENT");
        router.refresh();
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  function handleSkip() {
    setCreatedProfile(null);
    setRole("CLIENT");
    router.refresh();
  }

  if (createdProfile) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Profissional criado! Deseja adicionar uma foto?
        </p>
        <AvatarUploader
          professionalProfileId={createdProfile.id}
          professionalName={createdProfile.name}
        />
        <Button type="button" variant="secondary" onClick={handleSkip} className="w-full">
          Pular / Criar outro
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input id="name" name="name" label="Nome completo" required />
      <Input id="email" name="email" label="Email" type="email" required />
      <Input id="password" name="password" label="Senha" type="password" required minLength={6} />
      <Select
        id="role"
        name="role"
        label="Tipo"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        options={[
          { value: "CLIENT", label: "Familiar" },
          { value: "PROFESSIONAL", label: "Profissional" },
          { value: "ADMIN", label: "Administrador" },
        ]}
      />

      {role === "PROFESSIONAL" && (
        <>
          <Select
            id="professionalType"
            name="professionalType"
            label="Tipo de profissional"
            options={[
              { value: "CAREGIVER", label: "Cuidador(a)" },
              { value: "NURSE", label: "Enfermeiro(a)" },
              { value: "TECHNICIAN", label: "Técnico(a)" },
              { value: "OTHER", label: "Outro" },
            ]}
          />
          <Input id="phone" name="phone" label="Telefone" placeholder="(11) 99999-0000" />
        </>
      )}

      {role === "CLIENT" && (
        <Input id="phone" name="phone" label="Telefone" placeholder="(11) 99999-0000" />
      )}

      <Button type="submit" loading={loading} className="w-full">
        Criar Usuário
      </Button>
    </form>
  );
}
