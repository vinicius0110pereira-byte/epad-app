import { z } from "zod";

export const createPatientSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().optional().nullable(),
  address: z.string().min(3, "Endereço é obrigatório"),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  medicalNotes: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  clientId: z.string().uuid("ID do cliente inválido"),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
