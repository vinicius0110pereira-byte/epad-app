"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

export type ViewMode = "month" | "week";

interface CalendarShift {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  isUrgent: boolean;
  patient: { fullName: string };
  professional: { user: { name: string | null } } | null;
}

interface Filters {
  patientId: string;
  status: string;
  professionalId: string;
}

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shifts, setShifts] = useState<CalendarShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    patientId: "",
    status: "",
    professionalId: "",
  });

  const dateRange = useMemo(() => {
    if (viewMode === "month") {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      return { from: calStart, to: calEnd };
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return { from: weekStart, to: weekEnd };
  }, [currentDate, viewMode]);

  const days = useMemo(
    () => eachDayOfInterval({ start: dateRange.from, end: dateRange.to }),
    [dateRange],
  );

  const hasPatient = !!filters.patientId;

  const fetchShifts = useCallback(async () => {
    if (!filters.patientId) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
        patientId: filters.patientId,
      });
      if (filters.status) params.set("status", filters.status);
      if (filters.professionalId) params.set("professionalId", filters.professionalId);

      const res = await fetch(`/api/shifts/calendar?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setShifts(json.data ?? []);
      } else {
        setError("Erro ao carregar plantões. Tente novamente.");
        setShifts([]);
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet.");
      setShifts([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, filters]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  function getShiftsForDay(date: Date) {
    return shifts.filter((s) => isSameDay(new Date(s.startDateTime), date));
  }

  function navigate(direction: "prev" | "next" | "today") {
    if (direction === "today") {
      setCurrentDate(new Date());
      return;
    }
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  }

  const title = useMemo(() => {
    if (viewMode === "month") {
      return format(currentDate, "MMMM yyyy", { locale: ptBR });
    }
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return `${format(weekStart, "dd MMM", { locale: ptBR })} — ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`;
  }, [currentDate, viewMode]);

  return {
    currentDate,
    viewMode,
    setViewMode,
    selectedDate,
    setSelectedDate,
    shifts,
    loading,
    error,
    filters,
    setFilters,
    days,
    dateRange,
    getShiftsForDay,
    navigate,
    title,
    hasPatient,
    refetch: fetchShifts,
    isSameMonth: (d: Date) => isSameMonth(d, currentDate),
    isToday,
  };
}

export type { CalendarShift, Filters };
