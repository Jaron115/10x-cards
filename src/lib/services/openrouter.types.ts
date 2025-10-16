/**
 * Types and schemas for OpenRouter service
 * Contains all interfaces, types, and validation schemas
 */

import { z } from "zod";

// ============================================================================
// API Types and Interfaces
// ============================================================================

/**
 * Chat message structure for OpenRouter API
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * JSON Schema configuration for structured responses
 */
export interface ResponseFormatJsonSchema {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: {
      properties: {
        flashcards: {
          type: "array";
          items: {
            type: "object";
            properties: {
              front: { type: "string" };
              back: { type: "string" };
            };
            required: ["front", "back"];
          };
        };
      };
      required: ["flashcards"];
    };
  };
}

/**
 * Response format type (can be extended in the future)
 */
export type ResponseFormat = ResponseFormatJsonSchema;

/**
 * Options for chat completion request
 */
export interface ChatCompletionOptions {
  model: string;
  response_format?: ResponseFormat;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  seed?: number;
  extraHeaders?: Record<string, string>;
}

/**
 * Chat completion response structure
 */
export interface ChatCompletionResponse {
  raw: unknown;
  parsed?: unknown;
}

/**
 * OpenRouter API error response
 */
export interface OpenRouterErrorResponse {
  error?: {
    message: string;
    code?: string;
  };
}

// ============================================================================
// Validation Schemas
// ============================================================================

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

// ============================================================================
// JSON Schema for OpenRouter response_format
// ============================================================================

/**
 * JSON Schema definition for flashcard proposals
 * Used in response_format to enforce structured output from AI models
 */
export const FLASHCARD_PROPOSALS_JSON_SCHEMA = {
  type: "object",
  properties: {
    flashcards: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          front: { type: "string", minLength: 1, maxLength: 200 },
          back: { type: "string", minLength: 1, maxLength: 500 },
        },
        required: ["front", "back"],
      },
    },
  },
  required: ["flashcards"],
  additionalProperties: false,
};

// ============================================================================
// System Prompt
// ============================================================================

/**
 * System prompt for flashcard generation
 */
export const FLASHCARD_GENERATION_SYSTEM_PROMPT = `You are a flashcard generation expert. Generate 5-8 high-quality flashcards from the provided text.
Each flashcard should:
- Have a clear, concise question on the front
- Have a comprehensive answer on the back
- Cover important concepts from the text
- Be useful for learning and retention`;
