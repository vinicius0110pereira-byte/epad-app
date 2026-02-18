"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarX } from "lucide-react";
import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { ShiftCard } from "@/components/shifts/shift-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { CalendarShift } from "./use-calendar";
import type { ShiftStatus } from "@/types";

interface DayDrawerProps {
  date: Date | null;
  shifts: CalendarShift[];
  open: boolean;
  onClose: () => void;
}

export function DayDrawer({ date, shifts, open, onClose }: DayDrawerProps) {
  if (!date) return null;

  const dayLabel = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dateParam = format(date, "yyyy-MM-dd'T'08:00");

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={dayLabel}
      subtitle={`${shifts.length} plantão(ões)`}
    >
      {/* Action: novo plantão neste dia */}
      <div className="mb-4">
        <Link href={`/admin/shifts?newDate=${dateParam}`}>
          <Button size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Novo plantão neste dia
          </Button>
        </Link>
      </div>

      {shifts.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Nenhum plantão neste dia"
          description="Crie um novo plantão clicando no botão acima."
        />
      ) : (
        <div className="space-y-2">
          {shifts.map((s) => (
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
      )}
    </Drawer>
  );
}
