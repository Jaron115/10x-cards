/**
 * Zod validation schemas for generation endpoint
 * Used to validate incoming requests to POST /api/generations
 */

import { z } from "zod";

/**
 * Schema for GenerateFlashcardsCommand
 * Validates the source_text parameter for flashcard generation
 */
export const GenerateFlashcardsSchema = z.object({
  source_text: z
    .string({
      required_error: "Source text is required",
      invalid_type_error: "Source text must be a string",
    })
    .trim()
    .min(1000, {
      message: "Source text must be at least 1000 characters long",
    })
    .max(10000, {
      message: "Source text must not exceed 10000 characters",
    })
    .refine((text) => text.length > 0, {
      message: "Source text cannot be empty or contain only whitespace",
    }),
});

/**
 * Type for validated GenerateFlashcardsCommand
 */
export type ValidatedGenerateFlashcardsCommand = z.infer<typeof GenerateFlashcardsSchema>;

/**
 * Helper function to create validation error response details
 * @param field - The field that failed validation
 * @param currentLength - Current length of the field
 * @param minLength - Minimum required length
 * @param maxLength - Maximum allowed length
 * @returns Validation error details object
 */
export function createValidationErrorDetails(
  field: string,
  currentLength: number,
  minLength: number,
  maxLength: number
) {
  return {
    field,
    current_length: currentLength,
    min_length: minLength,
    max_length: maxLength,
  };
}
