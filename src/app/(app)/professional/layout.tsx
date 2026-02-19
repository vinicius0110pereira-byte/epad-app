import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar, MobileNav } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { unstable_cache } from "next/cache";

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

export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "PROFESSIONAL") {
    redirect("/dashboard");
  }

  const profileId = session.user.professionalProfileId;
  let badges: Record<string, number> = {};

  if (profileId) {
    const profile = await prisma.professionalProfile.findUnique({
      where: { id: profileId },
      select: { professionalType: true },
    });
    if (profile) {
      badges = await getProfessionalBadges(profileId, profile.professionalType);
    }
  }

  return (
    <>
      <Sidebar userRole="PROFESSIONAL" badges={badges} />
      <MobileNav userRole="PROFESSIONAL" badges={badges} />
      <div className="lg:pl-60">
        <Topbar userName={session.user.name} userRole="PROFESSIONAL" />
        <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </>
  );
}
