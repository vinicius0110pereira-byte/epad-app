import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar, MobileNav } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { Toaster } from "sonner";
import { unstable_cache } from "next/cache";
import type { UserRole } from "@/types";

const getAdminBadges = unstable_cache(
  async (): Promise<Record<string, number>> => {
    const [openShifts, pendingProfessionals] = await Promise.all([
      prisma.shift.count({
        where: {
          status: { in: ["OPEN", "URGENT_OPEN"] },
          professionalId: null,
        },
      }),
      prisma.professionalProfile.count({
        where: { status: "PENDING" },
      }),
    ]);

    const badges: Record<string, number> = {};
    if (openShifts > 0) badges["/admin/shifts"] = openShifts;
    if (pendingProfessionals > 0) badges["/admin/professionals"] = pendingProfessionals;
    return badges;
  },
  ["admin-badges"],
  { revalidate: 30 },
);

const getProfessionalBadges = unstable_cache(
  async (
    profileId: string,
    professionalType: string,
  ): Promise<Record<string, number>> => {
    const [available, active] = await Promise.all([
      prisma.shift.count({
        where: {
          status: { in: ["OPEN", "URGENT_OPEN"] },
          requiredProfessionalType: professionalType,
        },
      }),
      prisma.shift.count({
        where: {
          professionalId: profileId,
          status: { in: ["ACCEPTED", "CONFIRMED", "IN_PROGRESS"] },
        },
      }),
    ]);

    const badges: Record<string, number> = {};
    if (available > 0) badges["/professional/dashboard"] = available;
    if (active > 0) badges["/professional/shifts"] = active;
    return badges;
  },
  ["professional-badges"],
  { revalidate: 30 },
);

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role as UserRole;

  let badges: Record<string, number> = {};
  if (role === "ADMIN") {
    badges = await getAdminBadges();
  } else if (role === "PROFESSIONAL" && session.user.professionalProfileId) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: session.user.professionalProfileId },
      select: { professionalType: true },
    });
    if (profile) {
      badges = await getProfessionalBadges(
        session.user.professionalProfileId,
        profile.professionalType,
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userRole={role} badges={badges} />
      <MobileNav userRole={role} badges={badges} />

      <div className="lg:pl-60">
        <Topbar userName={session.user.name} userRole={role} />
        <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
