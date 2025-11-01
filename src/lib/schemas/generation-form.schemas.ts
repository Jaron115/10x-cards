/**
 * Zod validation schemas for generation form (frontend)
 * Used with react-hook-form for client-side validation
 */

import { z } from "zod";

/**
 * Schema for generation form
 * Validates source text with character count constraints
 */
export const generationFormSchema = z.object({
  sourceText: z
    .string({ required_error: "Tekst źródłowy jest wymagany" })
    .trim()
    .min(1000, "Tekst musi mieć minimum 1000 znaków")
    .max(10000, "Tekst może mieć maksymalnie 10000 znaków"),
});

/**
 * Type export for form data
 */
export type GenerationFormData = z.infer<typeof generationFormSchema>;

/**
 * Constants for generation validation
 */
export const GENERATION_MIN_CHARS = 1000;
export const GENERATION_MAX_CHARS = 10000;
