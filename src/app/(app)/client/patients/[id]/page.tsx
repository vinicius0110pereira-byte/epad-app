import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { PatientEditForm } from "./patient-edit-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ClientPatientEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  const { id } = await params;
  if (!id?.trim()) notFound();

  const patient = await prisma.patient.findFirst({
    where: { id, clientId: session.user.clientProfileId ?? "" },
  });

  if (!patient) notFound();

  return (
    <div>
      <Link
        href="/client/patients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <PageHeader
        title={patient.fullName}
        description="Editar informações do paciente"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PatientEditForm
            patientId={patient.id}
            address={patient.address}
            neighborhood={patient.neighborhood ?? ""}
            city={patient.city ?? ""}
            medicalNotes={patient.medicalNotes ?? ""}
            medications={patient.medications ?? ""}
            allergies={patient.allergies ?? ""}
          />
        </div>

        <div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Informações Básicas</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500">Nome:</span>
                <p className="font-medium text-slate-900">{patient.fullName}</p>
              </div>
              {patient.birthDate && (
                <div>
                  <span className="text-slate-500">Nascimento:</span>
                  <p className="text-slate-900">
                    {new Intl.DateTimeFormat("pt-BR").format(patient.birthDate)}
                  </p>
                </div>
              )}
              <div>
                <span className="text-slate-500">Endereço:</span>
                <p className="text-slate-900">{patient.address}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
