"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, BellRing, CheckCheck, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  NEW_URGENT_SHIFT:  "bg-red-100 text-red-600",
  SHIFT_ASSIGNED:    "bg-emerald-100 text-emerald-600",
  SHIFT_CANCELLED:   "bg-slate-100 text-slate-500",
  PROFESSIONAL_ALERT: "bg-orange-100 text-orange-600",
};

const TYPE_DOT: Record<string, string> = {
  NEW_URGENT_SHIFT:  "bg-red-500",
  SHIFT_ASSIGNED:    "bg-emerald-500",
  SHIFT_CANCELLED:   "bg-slate-400",
  PROFESSIONAL_ALERT: "bg-orange-500",
};

interface NotificationBellProps {
  userId: string;
}

export function NotificationBell({ userId: _userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const router = useRouter();
  const isFirstFetch = useRef(true);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: Notification[] = await res.json();

      if (isFirstFetch.current) {
        isFirstFetch.current = false;
        prevIdsRef.current = new Set(data.map((n) => n.id));
        setNotifications(data);
        return;
      }

      const prevIds = prevIdsRef.current;
      const newNotifs = data.filter((n) => !prevIds.has(n.id));
      if (newNotifs.length > 0) {
        newNotifs.forEach((n) => toast(n.title, { description: n.body }));
        // Trigger ring animation
        setRinging(true);
        setTimeout(() => setRinging(false), 1100);
      }
      prevIdsRef.current = new Set(data.map((n) => n.id));
      setNotifications(data);
    } catch {
      // ignore network errors silently
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function markRead(ids: string[]) {
    if (ids.length === 0) return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    prevIdsRef.current = new Set(
      Array.from(prevIdsRef.current).filter((id) => !ids.includes(id)),
    );
  }

  async function handleItemClick(notif: Notification) {
    await markRead([notif.id]);
    setOpen(false);
    if (notif.link) router.push(notif.link);
  }

  const count = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        title="Notificações"
      >
        {count > 0 ? (
          <BellRing className={`h-4 w-4 ${ringing ? "bell-ring" : ""}`} />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold leading-none text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="dropdown-animate absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span className="text-sm font-semibold text-slate-900">Notificações</span>
              {count > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {count > 0 && (
                <button
                  onClick={() => markRead(notifications.map((n) => n.id))}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  title="Marcar tudo como lido"
                >
                  <CheckCheck className="h-3 w-3" />
                  Limpar
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Bell className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-500">Nenhuma notificação</p>
                <p className="text-xs text-slate-400">Você está em dia!</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const dotColor = TYPE_DOT[notif.type] ?? "bg-blue-500";
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className="group flex w-full gap-3 border-b border-slate-50 px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-blue-50/40"
                  >
                    {/* Dot */}
                    <div className="mt-1 shrink-0">
                      <span className={`block h-2 w-2 rounded-full ${dotColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-900">
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{notif.body}</p>
                      <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                        {formatDistanceToNow(new Date(notif.createdAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
