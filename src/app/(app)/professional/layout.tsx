import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProfessionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "PROFESSIONAL") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
