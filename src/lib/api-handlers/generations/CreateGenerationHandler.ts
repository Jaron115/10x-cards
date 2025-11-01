/**
 * Create Generation Handler
 *
 * Handles POST /api/generations - Generate flashcard proposals from source text using AI
 *
 * Features:
 * - Authentication required
 * - Rate limiting (10 generations per day)
 * - Request validation (source text 1000-10000 chars)
 * - AI generation via GenerationService
 * - Mock mode support for development
 * - Error logging to database
 *
 * @example
 * ```ts
 * export const POST = (context: APIContext) => new CreateGenerationHandler().handle(context);
 * ```
 */

import { OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_USE_MOCK } from "astro:env/server";
import type { GenerateFlashcardsResponseDTO } from "@/types";
import { AuthenticatedHandler } from "../base/AuthenticatedHandler";
import type { AuthenticatedContext } from "../types";
import { validateBody } from "../middleware/validation";
import { GenerateFlashcardsSchema } from "@/lib/validation/generation.schemas";
import { GenerationService } from "@/lib/services/generation/generation.service";
import { AIServiceError } from "@/lib/services/generation/types";
import { RateLimitService } from "@/lib/services/rateLimit.service";
import { ApiResponseBuilder } from "../utils/responseBuilder";

/**
 * Handler for creating AI-generated flashcard proposals
 * Orchestrates: rate limiting, validation, AI generation, and database persistence
 */
export class CreateGenerationHandler extends AuthenticatedHandler {
  /**
   * Main execution logic with authentication
   */
  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    // 1. Validate request body
    const validationResult = await validateBody(context.request, GenerateFlashcardsSchema);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { source_text } = validationResult.data;
    const userId = this.getUserId();
    const supabase = this.getSupabase();

    // 2. Initialize services
    const rateLimitService = new RateLimitService(supabase);
    const generationService = new GenerationService(supabase);

    // 3. Check feature flags
    const useMock = OPENROUTER_USE_MOCK === "true";
    const skipRateLimit = useMock; // Skip rate limit in mock mode

    // 4. Check rate limit (unless in mock mode)
    if (!skipRateLimit) {
      const rateLimitResult = await this.checkRateLimit(rateLimitService, userId);
      if (rateLimitResult) {
        return rateLimitResult; // Return rate limit error response
      }
    }

    // 5. Validate API configuration (unless using mock)
    const apiKey = OPENROUTER_API_KEY || "";
    const model = OPENROUTER_MODEL;

    if (!useMock && !apiKey) {
      // eslint-disable-next-line no-console
      console.error("OPENROUTER_API_KEY is not configured");
      return ApiResponseBuilder.internalError("Service is not properly configured. Please contact support.");
    }

    // 6. Generate flashcards with AI
    const generationResult = await this.generateFlashcards(generationService, userId, source_text, apiKey, model);

    if (!generationResult.success) {
      return generationResult.error;
    }

    const result = generationResult.data;

    // 7. Save generation metadata to database
    let generationId: number;
    try {
      generationId = await generationService.saveGeneration(userId, source_text, result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to save generation:", error);
      return ApiResponseBuilder.internalError();
    }

    // 8. Build successful response
    const responseData: GenerateFlashcardsResponseDTO = {
      generation_id: generationId,
      model: result.model,
      duration_ms: result.duration_ms,
      generated_count: result.flashcards_proposals.length,
      flashcards_proposals: result.flashcards_proposals,
    };

    return this.createdResponse(responseData);
  }

  /**
   * Check rate limit for user
   * Returns error response if limit exceeded, null otherwise
   */
  private async checkRateLimit(rateLimitService: RateLimitService, userId: string): Promise<Response | null> {
    try {
      const rateLimitResult = await rateLimitService.checkRateLimit(userId);

      if (rateLimitResult.exceeded && rateLimitResult.retryAfter) {
        return ApiResponseBuilder.rateLimitExceeded(
          "You have reached your daily generation limit. Please try again tomorrow.",
          rateLimitResult.retryAfter
        );
      }

      return null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Rate limit check failed:", error);
      return ApiResponseBuilder.internalError();
    }
  }

  /**
   * Generate flashcards using AI service
   * Returns result or error response
   */
  private async generateFlashcards(
    generationService: GenerationService,
    userId: string,
    sourceText: string,
    apiKey: string,
    model: string
  ): Promise<
    | { success: true; data: Awaited<ReturnType<GenerationService["generateFlashcards"]>> }
    | { success: false; error: Response }
  > {
    try {
      const result = await generationService.generateFlashcards(sourceText, apiKey, model);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof AIServiceError) {
        // Log error to database (fire and forget)
        generationService
          .logError(userId, sourceText, model, error)
          // eslint-disable-next-line no-console
          .catch((err) => console.error("Failed to log generation error:", err));

        return {
          success: false,
          error: ApiResponseBuilder.serviceUnavailable(
            "Unable to generate flashcards at this time. Please try again later.",
            error.details
          ),
        };
      }

      // eslint-disable-next-line no-console
      console.error("Unexpected error during generation:", error);
      return {
        success: false,
        error: ApiResponseBuilder.internalError(),
      };
    }
  }
}
