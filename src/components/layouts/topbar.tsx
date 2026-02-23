"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import type { UserRole } from "@/types";
import { NotificationBell } from "@/components/ui/notification-bell";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
};

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  PROFESSIONAL: "bg-blue-100 text-blue-700",
};

const AVATAR_COLORS: Record<UserRole, string> = {
  ADMIN: "from-purple-600 to-purple-800",
  PROFESSIONAL: "from-blue-600 to-blue-800",
};

interface TopbarProps {
  userName: string | null;
  userRole: UserRole;
  userId?: string;
}

export function Topbar({ userName, userRole, userId }: TopbarProps) {
  const initial = userName ? userName.charAt(0).toUpperCase() : "?";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:px-6">
      {/* Mobile logo */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-b from-blue-700 to-blue-900 shadow-sm">
          <span className="text-sm font-bold text-white">E</span>
        </div>
        <span className="text-base font-bold text-slate-900">EPAD</span>
      </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell (professionals and admins) */}
        {(userRole === "PROFESSIONAL" || userRole === "ADMIN") && userId && (
          <NotificationBell userId={userId} />
        )}

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-200" />

        {/* Settings */}
        <Link
          href="/settings"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Configurações"
        >
          <Settings className="h-4 w-4" />
        </Link>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-slate-200" />

        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {userName}
            </p>
            <span
              className={`inline-block rounded-full px-2 py-px text-[10px] font-semibold ${ROLE_COLORS[userRole]}`}
            >
              {ROLE_LABELS[userRole]}
            </span>
          </div>
          {/* Avatar */}
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-b ${AVATAR_COLORS[userRole]} shadow-sm`}
          >
            <span className="text-sm font-bold text-white">{initial}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
