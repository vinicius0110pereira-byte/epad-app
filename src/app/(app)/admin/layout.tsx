import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar, MobileNav } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { unstable_cache } from "next/cache";

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

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const badges = await getAdminBadges();

  return (
    <>
      <Sidebar userRole="ADMIN" badges={badges} />
      <MobileNav userRole="ADMIN" badges={badges} />
      <div className="lg:pl-60">
        <Topbar userName={session.user.name} userRole="ADMIN" userId={session.user.id} />
        <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </>
  );
}
