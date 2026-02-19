import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "CLIENT") {
    redirect("/dashboard");
  }

  return (
    <>
      <Sidebar userRole="CLIENT" />
      <MobileNav userRole="CLIENT" />
      <div className="lg:pl-60">
        <Topbar userName={session.user.name} userRole="CLIENT" />
        <main className="p-4 pb-20 lg:p-6 lg:pb-6">{children}</main>
      </div>
    </>
  );
}
