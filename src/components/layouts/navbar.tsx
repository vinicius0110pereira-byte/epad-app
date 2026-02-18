"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Pacientes", href: "/admin/patients" },
    { label: "Plantões", href: "/admin/shifts" },
  ],
  PROFESSIONAL: [
    { label: "Dashboard", href: "/professional/dashboard" },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/client/dashboard" },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrador",
  PROFESSIONAL: "Profissional",
  CLIENT: "Familiar",
};

interface NavbarProps {
  userName: string | null;
  userRole: UserRole;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[userRole] ?? [];

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold text-blue-800">
            EPAD
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-800"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[userRole]}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-1 sm:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              pathname === item.href
                ? "bg-blue-50 text-blue-800"
                : "text-gray-600"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
