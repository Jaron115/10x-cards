/**
 * Zod validation schemas for flashcard endpoints
 * Used to validate incoming requests to flashcard API routes
 */

import { z } from "zod";

/**
 * Schema for CreateFlashcardCommand
 * Validates single flashcard creation (POST /api/flashcards)
 */
export const CreateFlashcardSchema = z.object({
  front: z
    .string({
      required_error: "Front text is required",
      invalid_type_error: "Front text must be a string",
    })
    .trim()
    .min(1, "Front text is required")
    .max(200, "Front text must not exceed 200 characters"),
  back: z
    .string({
      required_error: "Back text is required",
      invalid_type_error: "Back text must be a string",
    })
    .trim()
    .min(1, "Back text is required")
    .max(500, "Back text must not exceed 500 characters"),
});

/**
 * Schema for UpdateFlashcardCommand
 * Validates flashcard updates (PATCH /api/flashcards/:id)
 * At least one field must be provided
 */
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string()
      .trim()
      .min(1, "Front text cannot be empty")
      .max(200, "Front text must not exceed 200 characters")
      .optional(),
    back: z
      .string()
      .trim()
      .min(1, "Back text cannot be empty")
      .max(500, "Back text must not exceed 500 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

/**
 * Schema for single flashcard item in bulk creation
 * Used within CreateFlashcardsBulkSchema
 */
export const FlashcardBulkItemSchema = z.object({
  front: z
    .string({
      required_error: "Front text is required",
      invalid_type_error: "Front text must be a string",
    })
    .trim()
    .min(1, "Front text is required")
    .max(200, "Front text must not exceed 200 characters"),
  back: z
    .string({
      required_error: "Back text is required",
      invalid_type_error: "Back text must be a string",
    })
    .trim()
    .min(1, "Back text is required")
    .max(500, "Back text must not exceed 500 characters"),
  source: z.enum(["ai-full", "ai-edited"], {
    errorMap: () => ({ message: "Source must be 'ai-full' or 'ai-edited'" }),
  }),
});

/**
 * Schema for CreateFlashcardsBulkCommand
 * Validates bulk flashcard creation (POST /api/flashcards/bulk)
 */
export const CreateFlashcardsBulkSchema = z.object({
  generation_id: z
    .number({
      required_error: "Generation ID is required",
      invalid_type_error: "Generation ID must be a number",
    })
    .int("Generation ID must be an integer")
    .positive("Generation ID must be positive"),
  flashcards: z
    .array(FlashcardBulkItemSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
});

/**
 * Schema for query parameters in GET /api/flashcards
 * Includes pagination, filtering, and sorting options
 */
export const GetFlashcardsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().min(1).max(100).default(50),
  source: z.enum(["manual", "ai-full", "ai-edited"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * Schema for flashcard ID parameter
 * Used in GET, PATCH, DELETE /api/flashcards/:id
 */
export const FlashcardIdSchema = z
  .number({
    required_error: "Flashcard ID is required",
    invalid_type_error: "Flashcard ID must be a number",
  })
  .int("Flashcard ID must be an integer")
  .positive("Flashcard ID must be positive");

/**
 * Type exports for validated data
 */
export type ValidatedCreateFlashcardCommand = z.infer<typeof CreateFlashcardSchema>;
export type ValidatedUpdateFlashcardCommand = z.infer<typeof UpdateFlashcardSchema>;
export type ValidatedFlashcardBulkItem = z.infer<typeof FlashcardBulkItemSchema>;
export type ValidatedCreateFlashcardsBulkCommand = z.infer<typeof CreateFlashcardsBulkSchema>;
export type ValidatedGetFlashcardsQuery = z.infer<typeof GetFlashcardsQuerySchema>;
export type ValidatedFlashcardId = z.infer<typeof FlashcardIdSchema>;
