"use client";

import { format } from "date-fns";
import type { CalendarShift } from "./use-calendar";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface MonthGridProps {
  days: Date[];
  getShiftsForDay: (date: Date) => CalendarShift[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  isCurrentMonth: (date: Date) => boolean;
  isToday: (date: Date) => boolean;
}

function statusDot(status: string) {
  switch (status) {
    case "OPEN":
    case "URGENT_OPEN":
      return "bg-blue-500";
    case "ACCEPTED":
      return "bg-yellow-500";
    case "CONFIRMED":
      return "bg-purple-500";
    case "IN_PROGRESS":
      return "bg-emerald-500";
    case "COMPLETED":
      return "bg-slate-400";
    case "CANCELLED":
      return "bg-red-400";
    default:
      return "bg-slate-400";
  }
}

export function MonthGrid({
  days,
  getShiftsForDay,
  selectedDate,
  onSelectDate,
  isCurrentMonth,
  isToday,
}: MonthGridProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Header */}
      <div className="calendar-grid border-b border-slate-200 bg-slate-50">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="calendar-grid">
        {days.map((day, idx) => {
          const dayShifts = getShiftsForDay(day);
          const inMonth = isCurrentMonth(day);
          const today = isToday(day);
          const selected =
            selectedDate && format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const urgentCount = dayShifts.filter((s) => s.isUrgent).length;

          return (
            <button
              key={idx}
              onClick={() => onSelectDate(day)}
              className={`relative min-h-[5.5rem] border-b border-r border-slate-100 p-1.5 text-left transition-colors hover:bg-blue-50/50 ${
                !inMonth ? "bg-slate-50/60" : ""
              } ${selected ? "ring-2 ring-inset ring-blue-500" : ""}`}
            >
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  today
                    ? "bg-blue-800 text-white"
                    : inMonth
                      ? "text-slate-900"
                      : "text-slate-400"
                }`}
              >
                {format(day, "d")}
              </span>

              {dayShifts.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayShifts.slice(0, 3).map((s) => {
                    const time = new Date(s.startDateTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-1 rounded px-1 py-0.5 text-xs"
                        title={`${time} — ${s.status}`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot(s.status)}`} />
                        <span className="truncate text-slate-700">{time}</span>
                      </div>
                    );
                  })}
                  {dayShifts.length > 3 && (
                    <p className="px-1 text-xs font-medium text-slate-500">
                      +{dayShifts.length - 3} mais
                    </p>
                  )}
                </div>
              )}

              {urgentCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
