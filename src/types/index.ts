// ==============================================
// EPAD - Tipos centrais do sistema
// ==============================================

// Enums como union types (SQLite não suporta enum nativo)
export type UserRole = "ADMIN" | "PROFESSIONAL" | "CLIENT";

export type ProfessionalType = "CAREGIVER" | "NURSE" | "TECHNICIAN" | "OTHER";

export type ShiftStatus =
  | "OPEN"
  | "OFFERED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "CANCELLED"
  | "NO_SHOW"
  | "URGENT_OPEN";

export type EventType =
  | "CREATED"
  | "ACCEPTED"
  | "CONFIRMED"
  | "STARTED"
  | "FINISHED"
  | "CANCELLED"
  | "LATE"
  | "OCCURRENCE"
  | "MED_REQUEST"
  | "RESOLVED"
  | "OFFERED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "VERIFIED"
  | "NO_SHOW"
  | "RESCHEDULED"
  | "VALUE_ADJUSTED"
  | "NOTE_ADDED";

export type FeedbackRole = "PROFESSIONAL" | "CLIENT" | "ADMIN";

export type ProfessionalStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

// DTOs para API responses
export interface PatientDTO {
  id: string;
  fullName: string;
  birthDate: string | null;
  address: string;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  medicalNotes?: string | null; // Omitido para CLIENT
  medications?: string | null; // Omitido para CLIENT
  allergies?: string | null;
  active: boolean;
  clientId: string;
}

export interface ShiftDTO {
  id: string;
  startDateTime: string;
  endDateTime: string;
  requiredProfessionalType: ProfessionalType;
  address: string;
  neighborhood: string | null;
  city: string | null;
  needs: string | null;
  value?: number | null; // Omitido para CLIENT e PROFESSIONAL
  status: ShiftStatus;
  isUrgent: boolean;
  patientId: string;
  professionalId: string | null;
  createdByAdminId: string;
  acceptedAt: string | null;
  confirmedAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  patient?: { fullName: string };
  professional?: { user: { name: string | null } } | null;
}

export interface ShiftEventDTO {
  id: string;
  type: EventType;
  metadata: string | null;
  description: string | null;
  createdAt: string;
  actorUserId: string;
  actor?: { name: string | null };
}

export interface FeedbackDTO {
  id: string;
  fromRole: FeedbackRole;
  rating: number;
  notes: string | null;
  createdAt: string;
  userId: string;
  shiftId: string;
}

// API response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

// Session user type
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  professionalProfileId?: string | null;
  clientProfileId?: string | null;
}
