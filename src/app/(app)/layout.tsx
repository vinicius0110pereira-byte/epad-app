import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Toaster } from "sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
