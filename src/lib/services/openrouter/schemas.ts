/**
 * Zod validation schemas and auto-generated JSON schemas for OpenRouter service
 */

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Zod schema for a single flashcard proposal
 */
const FlashcardProposalSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
});

/**
 * Zod schema for array of flashcard proposals (5-8 items)
 */
export const FlashcardProposalsSchema = z
  .array(FlashcardProposalSchema)
  .min(5, "AI must generate at least 5 flashcards")
  .max(8, "AI must not generate more than 8 flashcards");

/**
 * Type for validated flashcard proposals
 */
export type ValidatedFlashcardProposals = z.infer<typeof FlashcardProposalsSchema>;

/**
 * Wrapper schema for OpenRouter response format
 */
const FlashcardProposalsWrapperSchema = z.object({
  flashcards: FlashcardProposalsSchema,
});

/**
 * Auto-generated JSON Schema from Zod schema
 * Used in response_format to enforce structured output from AI models
 *
 * This eliminates duplication - we define validation rules once in Zod,
 * and automatically generate the JSON Schema for OpenRouter API
 */
export const FLASHCARD_PROPOSALS_JSON_SCHEMA = zodToJsonSchema(FlashcardProposalsWrapperSchema, {
  $refStrategy: "none",
  target: "openApi3",
});
