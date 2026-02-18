"use client";

import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, RefreshCw } from "lucide-react";
import { useCalendar, type ViewMode } from "./use-calendar";
import { MonthGrid } from "./month-grid";
import { WeekView } from "./week-view";
import { DayDrawer } from "./day-drawer";
import { FiltersBar } from "./filters-bar";
import { CalendarSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface FilterOption {
  id: string;
  label: string;
}

interface CalendarViewProps {
  patients: FilterOption[];
  professionals: FilterOption[];
}

const VIEW_LABELS: Record<ViewMode, string> = {
  month: "Mês",
  week: "Semana",
};

const STATUS_LEGEND = [
  { color: "bg-blue-500", label: "Aberto" },
  { color: "bg-yellow-500", label: "Aceito" },
  { color: "bg-purple-500", label: "Confirmado" },
  { color: "bg-emerald-500", label: "Em Andamento" },
  { color: "bg-slate-400", label: "Concluído" },
  { color: "bg-red-400", label: "Cancelado" },
];

export function CalendarView({ patients, professionals }: CalendarViewProps) {
  const cal = useCalendar();

  const drawerShifts = cal.selectedDate
    ? cal.getShiftsForDay(cal.selectedDate)
    : [];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <FiltersBar
        filters={cal.filters}
        onChange={cal.setFilters}
        patients={patients}
        professionals={professionals}
      />

      {/* Empty state when no patient selected */}
      {!cal.hasPatient ? (
        <EmptyState
          icon={CalendarDays}
          title="Selecione um paciente"
          description="Selecione um paciente para visualizar os plantões no calendário."
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => cal.navigate("prev")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => cal.navigate("today")}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Hoje
              </button>
              <button
                onClick={() => cal.navigate("next")}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <h2 className="ml-2 text-lg font-semibold capitalize text-slate-900">
                {cal.title}
              </h2>
            </div>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
              {(["month", "week"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => cal.setViewMode(v)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    cal.viewMode === v
                      ? "bg-blue-800 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {VIEW_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar content */}
          {cal.error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 p-8">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-800">{cal.error}</p>
              <button
                onClick={cal.refetch}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar novamente
              </button>
            </div>
          ) : cal.loading ? (
            <CalendarSkeleton />
          ) : cal.viewMode === "month" ? (
            <MonthGrid
              days={cal.days}
              getShiftsForDay={cal.getShiftsForDay}
              selectedDate={cal.selectedDate}
              onSelectDate={cal.setSelectedDate}
              isCurrentMonth={cal.isSameMonth}
              isToday={cal.isToday}
            />
          ) : (
            <WeekView
              days={cal.days}
              getShiftsForDay={cal.getShiftsForDay}
              isToday={cal.isToday}
            />
          )}

          {/* Footer: count + status legend */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              {cal.shifts.length} plantão(ões) no período
            </p>

            {/* Status legend */}
            <div className="flex flex-wrap items-center gap-3">
              {STATUS_LEGEND.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  <span className="text-xs text-slate-500">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day drawer */}
          <DayDrawer
            date={cal.selectedDate}
            shifts={drawerShifts}
            open={cal.selectedDate !== null}
            onClose={() => cal.setSelectedDate(null)}
          />
        </>
      )}
    </div>
  );
}
