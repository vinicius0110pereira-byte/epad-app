"use client";

import { X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import type { Filters } from "./use-calendar";

interface FilterOption {
  id: string;
  label: string;
}

interface FiltersBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  patients: FilterOption[];
  professionals: FilterOption[];
}

const STATUS_OPTIONS = [
  { id: "OPEN", label: "Aberto" },
  { id: "ACCEPTED", label: "Aceito" },
  { id: "CONFIRMED", label: "Confirmado" },
  { id: "IN_PROGRESS", label: "Em Andamento" },
  { id: "COMPLETED", label: "Concluído" },
  { id: "CANCELLED", label: "Cancelado" },
  { id: "URGENT_OPEN", label: "Urgente" },
];

export function FiltersBar({ filters, onChange, patients, professionals }: FiltersBarProps) {
  const hasSecondaryFilters = filters.status || filters.professionalId;

  function update(key: keyof Filters, value: string) {
    onChange({ ...filters, [key]: value });
  }

  function clearSecondary() {
    onChange({ ...filters, status: "", professionalId: "" });
  }

  return (
    <div className="space-y-3">
      {/* Patient selector - required, prominent */}
      <div className="max-w-sm">
        <Combobox
          options={patients}
          value={filters.patientId}
          onChange={(v) => update("patientId", v)}
          placeholder="Selecione um paciente..."
          label="Paciente"
          required
          emptyText="Nenhum paciente encontrado"
        />
      </div>

      {/* Secondary filters - only visible when patient is selected */}
      {filters.patientId && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={filters.status}
            onChange={(e) => update("status", e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Todos status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Professional */}
          <div className="w-56">
            <Combobox
              options={professionals}
              value={filters.professionalId}
              onChange={(v) => update("professionalId", v)}
              placeholder="Todos profissionais"
              emptyText="Nenhum profissional encontrado"
            />
          </div>

          {/* Clear secondary */}
          {hasSecondaryFilters && (
            <button
              onClick={clearSecondary}
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:bg-slate-50"
            >
              <X className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
