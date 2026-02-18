import { z } from "zod";

export const createShiftSchema = z.object({
  startDateTime: z.string().min(1, "Data de início obrigatória"),
  endDateTime: z.string().min(1, "Data de término obrigatória"),
  requiredProfessionalType: z.enum(["CAREGIVER", "NURSE", "TECHNICIAN", "OTHER"]),
  address: z.string().min(3, "Endereço é obrigatório"),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  needs: z.string().optional().nullable(),
  value: z.number().int().min(0).optional().nullable(),
  patientId: z.string().uuid("ID do paciente inválido"),
  isUrgent: z.boolean().optional().default(false),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;

export const createEventSchema = z.object({
  type: z.enum([
    "CREATED",
    "ACCEPTED",
    "CONFIRMED",
    "STARTED",
    "FINISHED",
    "CANCELLED",
    "LATE",
    "OCCURRENCE",
    "MED_REQUEST",
    "RESOLVED",
    "OFFERED",
    "ASSIGNED",
    "UNASSIGNED",
    "VERIFIED",
    "NO_SHOW",
    "RESCHEDULED",
    "VALUE_ADJUSTED",
    "NOTE_ADDED",
    "PATIENT_FALL",
    "MEDICATION_GIVEN",
    "VITAL_SIGNS",
    "MEAL",
    "HYGIENE",
    "EMERGENCY",
  ]),
  description: z.string().optional().nullable(),
  metadata: z.string().optional().nullable(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const createFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  ratingPunctuality: z.number().int().min(1).max(5).optional().nullable(),
  ratingCare: z.number().int().min(1).max(5).optional().nullable(),
  ratingCommunication: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;

// Admin action schemas
export const rescheduleShiftSchema = z.object({
  startDateTime: z.string().min(1, "Data de início obrigatória"),
  endDateTime: z.string().min(1, "Data de término obrigatória"),
  reason: z.string().min(1, "Motivo é obrigatório"),
});

export type RescheduleShiftInput = z.infer<typeof rescheduleShiftSchema>;

export const adjustValueSchema = z.object({
  adjustmentsCents: z.number().int(),
  reason: z.string().min(1, "Motivo é obrigatório"),
});

export type AdjustValueInput = z.infer<typeof adjustValueSchema>;

export const addNoteSchema = z.object({
  note: z.string().min(1, "Nota é obrigatória"),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const unassignSchema = z.object({
  reason: z.string().min(1, "Motivo é obrigatório"),
});

export type UnassignInput = z.infer<typeof unassignSchema>;

// Client shift request schema
export const createShiftRequestSchema = z.object({
  patientId: z.string().uuid("ID do paciente inválido"),
  preferredStartDateTime: z.string().min(1, "Data de início obrigatória"),
  preferredEndDateTime: z.string().min(1, "Data de término obrigatória"),
  requiredProfessionalType: z.enum(["CAREGIVER", "NURSE", "TECHNICIAN", "OTHER"]),
  needs: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  isUrgent: z.boolean().optional().default(false),
});

export type CreateShiftRequestInput = z.infer<typeof createShiftRequestSchema>;

// Client cancel shift schema
export const clientCancelShiftSchema = z.object({
  reason: z.string().min(1, "Motivo é obrigatório"),
});

// Client update patient schema
export const updatePatientSchema = z.object({
  medicalNotes: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  address: z.string().min(3, "Endereço é obrigatório").optional(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
});

export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;

// Professional profile update schema
export const updateProfessionalProfileSchema = z.object({
  phone: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  skills: z.string().optional().nullable(),
});

export type UpdateProfessionalProfileInput = z.infer<typeof updateProfessionalProfileSchema>;
