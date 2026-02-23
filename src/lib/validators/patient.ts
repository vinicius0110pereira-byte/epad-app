import { z } from "zod";

export const ZONA_VALUES = ["NORTE", "SUL", "LESTE", "OESTE", "CENTRO"] as const;
export type ZonaValue = typeof ZONA_VALUES[number];

export const createPatientSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  birthDate: z.string().optional().nullable(),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  zona: z.enum(ZONA_VALUES, "Zona é obrigatória"),
  grauComplexidade: z.enum(["1", "2", "3"], "Grau de complexidade é obrigatório"),
  medications: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
