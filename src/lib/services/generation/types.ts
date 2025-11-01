/**
 * Types for Generation Service
 */

import type { FlashcardProposalDTO } from "@/types";

/**
 * Result of AI generation
 */
export interface GenerationResult {
  flashcards_proposals: FlashcardProposalDTO[];
  model: string | null;
  duration_ms: number;
}

/**
 * AI service error
 */
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

/**
 * Generation strategy interface
 * Different implementations can provide different sources of flashcard generation
 * (e.g., OpenRouter AI, Mock data, other AI providers)
 */
export interface GenerationStrategy {
  /**
   * Generate flashcard proposals from source text
   * @param sourceText - The text to generate flashcards from
   * @param apiKey - API key for the service (may not be needed for mock)
   * @param model - Model identifier to use
   * @returns Promise that resolves to generation result
   * @throws AIServiceError if generation fails
   */
  generateFlashcards(sourceText: string, apiKey: string, model: string): Promise<GenerationResult>;
}
