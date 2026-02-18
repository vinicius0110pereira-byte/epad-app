import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Heart, MapPin, AlertTriangle, Edit, ChevronRight } from "lucide-react";

export default async function ClientPatientsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "CLIENT") redirect("/login");

  const profileId = session.user.clientProfileId;
  if (!profileId) redirect("/login");

  const patients = await prisma.patient.findMany({
    where: { clientId: profileId, active: true },
    orderBy: { fullName: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Meus Pacientes"
        description={`${patients.length} paciente(s) cadastrado(s)`}
      />

      {patients.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Nenhum paciente cadastrado"
          description="Seus pacientes aparecerão aqui quando forem cadastrados pelo administrador."
        />
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <Link
              key={p.id}
              href={`/client/patients/${p.id}`}
              className="group block rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-blue-500 shrink-0" />
                    <p className="font-semibold text-slate-900 truncate">
                      {p.fullName}
                    </p>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {p.address}
                      {p.neighborhood ? `, ${p.neighborhood}` : ""}
                      {p.city ? ` - ${p.city}` : ""}
                    </span>
                  </div>

                  {p.allergies && (
                    <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">
                      <AlertTriangle className="h-3 w-3" />
                      Alergias: {p.allergies}
                    </p>
                  )}

                  {p.medications && (
                    <p className="mt-1 text-xs text-slate-500">
                      Medicações: {p.medications}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-blue-700 opacity-0 transition-opacity group-hover:opacity-100">
                    <Edit className="h-3 w-3" />
                    Editar
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
