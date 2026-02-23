import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./change-password-form";
import { Shield, Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configurações</h1>
          <p className="text-sm text-slate-400">Gerencie sua conta e segurança.</p>
        </div>
      </div>

      {/* Security section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Segurança</h2>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            Use uma senha forte com pelo menos 6 caracteres.
          </p>
        </div>
        <div className="px-6 py-5">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
