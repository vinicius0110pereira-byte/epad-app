"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@/types";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardList,
  Heart,
  UserCog,
  FileText,
  BarChart3,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Calendário", href: "/admin/calendar", icon: CalendarDays },
    { label: "Plantões", href: "/admin/shifts", icon: ClipboardList },
    { label: "Pacientes", href: "/admin/patients", icon: Heart },
    { label: "Profissionais", href: "/admin/professionals", icon: UserCog },
    { label: "Relatórios", href: "/admin/reports", icon: BarChart3 },
    { label: "Auditoria", href: "/admin/audit", icon: FileText },
    { label: "Usuários", href: "/admin/users", icon: Users },
  ],
  PROFESSIONAL: [
    { label: "Dashboard", href: "/professional/dashboard", icon: LayoutDashboard },
    { label: "Meus Plantões", href: "/professional/shifts", icon: ClipboardList },
    { label: "Meus Ganhos", href: "/professional/earnings", icon: Wallet },
    { label: "Meu Perfil", href: "/professional/profile", icon: User },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "Meus Pacientes", href: "/client/patients", icon: Heart },
  ],
};

interface SidebarProps {
  userRole: UserRole;
  badges?: Record<string, number>;
}

export function Sidebar({ userRole, badges }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[userRole] ?? [];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-sidebar lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <span className="text-base font-bold text-white">E</span>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-white">EPAD</span>
          <p className="text-[10px] leading-tight text-blue-200/60">Gestão de Plantões</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const badgeCount = badges?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-blue-100/70 hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badgeCount != null && badgeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <p className="text-xs text-blue-200/40">EPAD v0.1.0</p>
      </div>
    </aside>
  );
}

/**
 * Mobile sidebar (bottom tab bar)
 */
export function MobileNav({ userRole, badges }: SidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[userRole] ?? [];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white lg:hidden">
      <div className="flex items-center justify-around py-2">
        {items.slice(0, 5).map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const badgeCount = badges?.[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors ${
                isActive
                  ? "text-blue-800 font-medium"
                  : "text-slate-400"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {badgeCount != null && badgeCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
