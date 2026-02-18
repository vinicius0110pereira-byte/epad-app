"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AvailabilitySlot {
  dayOfWeek: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado
  startTime: string; // "08:00"
  endTime: string;   // "18:00"
}

interface Props {
  initialData: AvailabilitySlot[];
}

const DAY_NAMES = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const DAY_OF_WEEK_MAP = [1, 2, 3, 4, 5, 6, 0]; // index in DAY_NAMES -> dayOfWeek value

interface DayState {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

function buildInitialState(initialData: AvailabilitySlot[]): DayState[] {
  const slotMap = new Map<number, AvailabilitySlot>();
  for (const slot of initialData) {
    slotMap.set(slot.dayOfWeek, slot);
  }

  return DAY_OF_WEEK_MAP.map((dow) => {
    const slot = slotMap.get(dow);
    return {
      enabled: !!slot,
      startTime: slot?.startTime ?? "08:00",
      endTime: slot?.endTime ?? "18:00",
    };
  });
}

export function AvailabilityForm({ initialData }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState<DayState[]>(() => buildInitialState(initialData));

  function updateDay(index: number, patch: Partial<DayState>) {
    setDays((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  }

  async function handleSave() {
    setLoading(true);

    const slots: AvailabilitySlot[] = days
      .map((d, i) => ({
        dayOfWeek: DAY_OF_WEEK_MAP[i],
        startTime: d.startTime,
        endTime: d.endTime,
        enabled: d.enabled,
      }))
      .filter((s) => s.enabled)
      .map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }));

    try {
      const res = await fetch("/api/professional/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slots),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar disponibilidade");
        return;
      }

      toast.success("Disponibilidade salva com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">
        Disponibilidade Semanal
      </h3>

      <div className="space-y-2">
        {DAY_NAMES.map((name, index) => {
          const day = days[index];
          return (
            <div
              key={name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                day.enabled
                  ? "border-slate-200 bg-white"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <label className="flex min-w-[120px] cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(index, { enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-500"
                />
                <span
                  className={`text-sm font-medium ${
                    day.enabled ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {name}
                </span>
              </label>

              <div className="ml-auto flex items-center gap-2">
                <input
                  type="time"
                  value={day.startTime}
                  onChange={(e) => updateDay(index, { startTime: e.target.value })}
                  disabled={!day.enabled}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className={`text-xs ${day.enabled ? "text-slate-500" : "text-slate-300"}`}>
                  até
                </span>
                <input
                  type="time"
                  value={day.endTime}
                  onChange={(e) => updateDay(index, { endTime: e.target.value })}
                  disabled={!day.enabled}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <Button onClick={handleSave} loading={loading} className="w-full">
          Salvar
        </Button>
      </div>
    </div>
  );
}
