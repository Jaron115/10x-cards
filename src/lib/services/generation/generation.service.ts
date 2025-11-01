/**
 * Generation service for AI-powered flashcard generation
 * Handles AI generation orchestration and database operations
 *
 * Uses Strategy Pattern for generation logic (Mock vs Real AI)
 */

import { OPENROUTER_USE_MOCK, OPENROUTER_TIMEOUT_MS } from "astro:env/server";
import type { SupabaseClient } from "../../../db/supabase.client";
import type { InsertGenerationData, InsertGenerationErrorLogData } from "../../../types";
import { calculateMD5 } from "../../utils/hash";
import type { GenerationStrategy, GenerationResult } from "./types";
import { AIServiceError } from "./types";
import { MockGenerationStrategy } from "./strategies/mock-generation.strategy";
import { OpenRouterGenerationStrategy } from "./strategies/openrouter-generation.strategy";

/**
 * Generation service class
 * Orchestrates AI generation and database operations
 * Uses dependency injection for generation strategy
 */
export class GenerationService {
  private readonly strategy: GenerationStrategy;

  /**
   * Create generation service
   *
   * Supports two constructor signatures for backward compatibility:
   * 1. New: `new GenerationService(supabase, strategy?)`
   * 2. Legacy: `new GenerationService(supabase)` - auto-selects strategy based on env
   *
   * @param supabase - Supabase client for database operations
   * @param strategy - Optional generation strategy (if not provided, selected based on env)
   */
  constructor(
    private readonly supabase: SupabaseClient,
    strategy?: GenerationStrategy
  ) {
    // If strategy provided, use it (DI)
    if (strategy) {
      this.strategy = strategy;
    } else {
      // Legacy behavior: auto-select strategy based on environment
      const useMock = OPENROUTER_USE_MOCK === "true";
      const timeoutMs = parseInt(OPENROUTER_TIMEOUT_MS, 10);

      this.strategy = useMock ? new MockGenerationStrategy() : new OpenRouterGenerationStrategy(timeoutMs);
    }
  }

  /**
   * Generate flashcard proposals from source text using AI
   * Delegates to the configured generation strategy
   *
   * @param sourceText - The text to generate flashcards from
   * @param apiKey - API key for the service
   * @param model - AI model to use
   * @returns Promise that resolves to generation result
   * @throws AIServiceError if generation fails
   */
  async generateFlashcards(sourceText: string, apiKey: string, model: string): Promise<GenerationResult> {
    return this.strategy.generateFlashcards(sourceText, apiKey, model);
  }

  /**
   * Save generation metadata to database
   * @param userId - User ID who requested generation
   * @param sourceText - Original source text
   * @param result - Generation result from AI
   * @returns Promise that resolves to generation ID
   * @throws Error if database operation fails
   */
  async saveGeneration(userId: string, sourceText: string, result: GenerationResult): Promise<number> {
    const sourceTextHash = calculateMD5(sourceText);

    const generationData: InsertGenerationData = {
      user_id: userId,
      duration_ms: result.duration_ms,
      model: result.model,
      generated_count: result.flashcards_proposals.length,
      accepted_unedited_count: 0,
      accepted_edited_count: 0,
      source_text_hash: sourceTextHash,
      source_text_length: sourceText.length,
    };

    const { data, error } = await this.supabase.from("generations").insert(generationData).select("id").single();

    if (error) {
      throw new Error(`Failed to save generation: ${error.message}`);
    }

    if (!data?.id) {
      throw new Error("No generation ID returned from database");
    }

    return data.id;
  }

  /**
   * Log AI service error to database
   * @param userId - User ID who requested generation
   * @param sourceText - Original source text
   * @param model - AI model that was attempted
   * @param error - The error that occurred
   * @returns Promise that resolves when error is logged (does not throw)
   */
  async logError(userId: string, sourceText: string, model: string | null, error: AIServiceError): Promise<void> {
    try {
      const sourceTextHash = calculateMD5(sourceText);

      const errorLog: InsertGenerationErrorLogData = {
        user_id: userId,
        model,
        source_text_hash: sourceTextHash,
        source_text_length: sourceText.length,
        error_code: error.code,
        error_message: error.message,
      };

      const { error: dbError } = await this.supabase.from("generation_error_logs").insert(errorLog);

      if (dbError) {
        // eslint-disable-next-line no-console
        console.error("Failed to log generation error:", dbError);
      }
    } catch (err) {
      // Don't throw - logging errors should not break the flow
      // eslint-disable-next-line no-console
      console.error("Failed to log generation error:", err);
    }
  }
}
