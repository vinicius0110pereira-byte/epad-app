import { type ShiftStatus, type ProfessionalStatus } from "@/types";

/**
 * Transições válidas da máquina de estados do Shift
 */
export const SHIFT_TRANSITIONS: Record<ShiftStatus, ShiftStatus[]> = {
  OPEN: ["OFFERED", "ASSIGNED", "ACCEPTED", "CANCELLED", "URGENT_OPEN"],
  OFFERED: ["ACCEPTED", "OPEN", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "OPEN", "CANCELLED"],
  ACCEPTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: ["VERIFIED"],
  VERIFIED: [],
  CANCELLED: [],
  NO_SHOW: ["OPEN", "CANCELLED"],
  URGENT_OPEN: ["OFFERED", "ASSIGNED", "ACCEPTED", "CANCELLED"],
};

export function canTransition(
  from: ShiftStatus,
  to: ShiftStatus,
): boolean {
  return SHIFT_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Formata valor de centavos para BRL
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata data para exibição
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

/**
 * Label legível para status do shift
 */
export function shiftStatusLabel(status: ShiftStatus): string {
  const map: Record<ShiftStatus, string> = {
    OPEN: "Aberto",
    OFFERED: "Oferecido",
    ASSIGNED: "Atribuído",
    ACCEPTED: "Aceito",
    CONFIRMED: "Confirmado",
    IN_PROGRESS: "Em Andamento",
    COMPLETED: "Concluído",
    VERIFIED: "Verificado",
    CANCELLED: "Cancelado",
    NO_SHOW: "Ausente",
    URGENT_OPEN: "Urgente",
  };
  return map[status] ?? status;
}

/**
 * Label legível para tipo de evento do shift
 */
export function shiftEventTypeLabel(type: string): string {
  const map: Record<string, string> = {
    CREATED: "Criado",
    ACCEPTED: "Aceito",
    CONFIRMED: "Confirmado",
    STARTED: "Iniciado",
    FINISHED: "Finalizado",
    CANCELLED: "Cancelado",
    LATE: "Atraso",
    OCCURRENCE: "Ocorrência",
    MED_REQUEST: "Requisição de Medicamento",
    RESOLVED: "Resolvido",
    OFFERED: "Oferecido",
    ASSIGNED: "Atribuído",
    UNASSIGNED: "Desatribuído",
    VERIFIED: "Verificado",
    NO_SHOW: "Ausência",
    RESCHEDULED: "Reagendado",
    VALUE_ADJUSTED: "Ajuste de Valor",
    NOTE_ADDED: "Nota Adicionada",
    PATIENT_FALL: "Queda do Paciente",
    MEDICATION_GIVEN: "Medicamento Administrado",
    VITAL_SIGNS: "Sinais Vitais",
    MEAL: "Refeição",
    HYGIENE: "Higiene",
    EMERGENCY: "Emergência",
  };
  return map[type] ?? type;
}

/**
 * Cor CSS do badge de status
 */
export function shiftStatusColor(status: ShiftStatus): string {
  const map: Record<ShiftStatus, string> = {
    OPEN: "bg-blue-100 text-blue-800",
    OFFERED: "bg-indigo-100 text-indigo-800",
    ASSIGNED: "bg-cyan-100 text-cyan-800",
    ACCEPTED: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-purple-100 text-purple-800",
    IN_PROGRESS: "bg-green-100 text-green-800",
    COMPLETED: "bg-gray-100 text-gray-800",
    VERIFIED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
    NO_SHOW: "bg-orange-100 text-orange-800",
    URGENT_OPEN: "bg-red-100 text-red-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

/**
 * Label legível para status do profissional
 */
export function professionalStatusLabel(status: ProfessionalStatus): string {
  const map: Record<ProfessionalStatus, string> = {
    ACTIVE: "Ativo",
    INACTIVE: "Inativo",
    SUSPENDED: "Suspenso",
    PENDING: "Pendente",
  };
  return map[status] ?? status;
}

/**
 * Cor CSS do badge de status do profissional
 */
export function professionalStatusColor(status: ProfessionalStatus): string {
  const map: Record<ProfessionalStatus, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    SUSPENDED: "bg-red-100 text-red-800",
    PENDING: "bg-yellow-100 text-yellow-800",
  };
  return map[status] ?? "bg-gray-100 text-gray-800";
}

export const ZONA_LABELS: Record<string, string> = {
  NORTE: "ZN",
  SUL: "ZS",
  LESTE: "ZL",
  OESTE: "ZO",
  CENTRO: "ZC",
};

/**
 * Máscara de nome para exibição em listas (para PROFESSIONAL).
 * Ex: "Maria Silva Santos" → "Maria S. – ZS"
 */
export function maskPatientName(fullName: string, zona: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1].charAt(0).toUpperCase()}.` : "";
  const zonaLabel = ZONA_LABELS[zona] ?? zona;
  return lastInitial ? `${first} ${lastInitial} – ${zonaLabel}` : `${first} – ${zonaLabel}`;
}
