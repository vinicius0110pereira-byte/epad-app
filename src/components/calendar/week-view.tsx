"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ShiftCard } from "@/components/shifts/shift-card";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarX } from "lucide-react";
import type { CalendarShift } from "./use-calendar";
import type { ShiftStatus } from "@/types";

interface WeekViewProps {
  days: Date[];
  getShiftsForDay: (date: Date) => CalendarShift[];
  isToday: (date: Date) => boolean;
}

export function WeekView({ days, getShiftsForDay, isToday }: WeekViewProps) {
  const daysWithShifts = days.filter((d) => getShiftsForDay(d).length > 0);
  const allEmpty = daysWithShifts.length === 0;

  if (allEmpty) {
    return (
      <EmptyState
        icon={CalendarX}
        title="Nenhum plantão neste período"
        description="Não há plantões agendados para esta semana."
      />
    );
  }

  return (
    <div className="space-y-4">
      {days.map((day) => {
        const dayShifts = getShiftsForDay(day);
        if (dayShifts.length === 0) return null;
        const today = isToday(day);

        return (
          <div key={day.toISOString()}>
            <div className="mb-2 flex items-center gap-2">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                  today
                    ? "bg-blue-800 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {format(day, "dd")}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {format(day, "EEEE", { locale: ptBR })}
                </p>
                <p className="text-xs text-slate-500">
                  {format(day, "dd 'de' MMMM", { locale: ptBR })} — {dayShifts.length} plantão(ões)
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-12">
              {dayShifts.map((s) => (
                <ShiftCard
                  key={s.id}
                  id={s.id}
                  patientName={s.patient.fullName}
                  startDateTime={s.startDateTime}
                  endDateTime={s.endDateTime}
                  status={s.status as ShiftStatus}
                  professionalName={s.professional?.user?.name}
                  isUrgent={s.isUrgent}
                  compact
                  href={`/admin/shifts/${s.id}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
