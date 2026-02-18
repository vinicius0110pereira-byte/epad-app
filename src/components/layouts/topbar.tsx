"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, UserCircle, Settings } from "lucide-react";
import type { UserRole } from "@/types";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
  CLIENT: "Familiar",
};

interface TopbarProps {
  userName: string | null;
  userRole: UserRole;
}

export function Topbar({ userName, userRole }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-3 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800">
          <span className="text-sm font-bold text-white">E</span>
        </div>
        <span className="text-lg font-bold text-slate-900">EPAD</span>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[userRole]}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
          <UserCircle className="h-5 w-5 text-blue-700" />
        </div>
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          title="Configurações"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
