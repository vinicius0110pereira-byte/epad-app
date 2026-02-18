import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ProfileForm } from "./profile-form";

const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  CAREGIVER: "Cuidador(a)",
  NURSE: "Enfermeiro(a)",
  TECHNICIAN: "Técnico(a)",
  OTHER: "Outro",
};

export default async function ProfessionalProfilePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "PROFESSIONAL") redirect("/login");

  const profileId = session.user.professionalProfileId;
  if (!profileId) redirect("/login");

  const profile = await prisma.professionalProfile.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      phone: true,
      document: true,
      skills: true,
      professionalType: true,
      avatarUrl: true,
      totalShifts: true,
      completedShifts: true,
      ratingAvg: true,
      createdAt: true,
    },
  });

  if (!profile) redirect("/login");

  let skills: string[] = [];
  try {
    if (profile.skills) skills = JSON.parse(profile.skills);
  } catch { /* ignore */ }

  return (
    <div>
      <PageHeader title="Meu Perfil" description="Gerencie suas informações pessoais" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileForm
            phone={profile.phone ?? ""}
            document={profile.document ?? ""}
            skills={skills}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-col items-center gap-3 text-center">
              <Avatar src={profile.avatarUrl} name={session.user.name} size="xl" />
              <div>
                <p className="text-lg font-semibold text-slate-900">{session.user.name}</p>
                <p className="text-sm text-slate-500">
                  {PROFESSIONAL_TYPE_LABELS[profile.professionalType] ?? profile.professionalType}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Estatísticas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total de plantões</span>
                <span className="font-medium text-slate-900">{profile.totalShifts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Concluídos</span>
                <span className="font-medium text-slate-900">{profile.completedShifts}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avaliação média</span>
                <span className="font-medium text-slate-900">
                  {profile.ratingAvg != null ? `${profile.ratingAvg.toFixed(1)} ★` : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
