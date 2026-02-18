import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "ADMIN") redirect("/admin/dashboard");
  if (role === "PROFESSIONAL") redirect("/professional/dashboard");
  if (role === "CLIENT") redirect("/client/dashboard");

  redirect("/login");
}
