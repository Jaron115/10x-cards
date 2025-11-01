/**
 * Zod validation schemas for flashcard forms (frontend)
 * Used with react-hook-form for client-side validation
 */

import { z } from "zod";

/**
 * Schema for flashcard create/edit form
 * Validates front and back fields
 */
export const flashcardFormSchema = z.object({
  front: z
    .string({ required_error: "Przód fiszki jest wymagany" })
    .trim()
    .min(1, "Przód fiszki jest wymagany")
    .max(200, "Przód fiszki może mieć maksymalnie 200 znaków"),
  back: z
    .string({ required_error: "Tył fiszki jest wymagany" })
    .trim()
    .min(1, "Tył fiszki jest wymagany")
    .max(500, "Tył fiszki może mieć maksymalnie 500 znaków"),
});

/**
 * Type export for form data
 */
export type FlashcardFormData = z.infer<typeof flashcardFormSchema>;

/**
 * Constants for flashcard validation
 */
export const FLASHCARD_FRONT_MAX_LENGTH = 200;
export const FLASHCARD_BACK_MAX_LENGTH = 500;
