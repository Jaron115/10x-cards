/**
 * POST /api/generations
 * Generate flashcard proposals from source text using AI
 *
 * This endpoint requires authentication via Supabase JWT token.
 * Rate limit: 10 generations per user per day.
 */

import type { APIContext } from "astro";
import { z } from "zod";
import type { ApiResponseDTO, GenerateFlashcardsResponseDTO, RateLimitErrorDTO } from "../../types.ts";
import { createErrorResponse } from "../../lib/errors.ts";
import { RateLimitService } from "../../lib/services/rateLimit.service.ts";
import { GenerationService, AIServiceError } from "../../lib/services/generation.service.ts";
import { GenerateFlashcardsSchema } from "../../lib/validation/generation.schemas.ts";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for flashcard generation
 */
export async function POST({ locals, request }: APIContext): Promise<Response> {
  try {
    const supabase = locals.supabase;

    // Initialize services
    const rate_limit_service = new RateLimitService(supabase);
    const generation_service = new GenerationService(supabase);

    // Get authenticated user from locals (set by middleware)
    const user = locals.user;
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
    }

    const user_id = user.id;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON in request body");
    }

    // Validate request body
    let validatedData: z.infer<typeof GenerateFlashcardsSchema>;
    try {
      validatedData = GenerateFlashcardsSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        const bodyData = body as { source_text?: string };
        const currentLength = bodyData.source_text?.length || 0;

        return createErrorResponse(400, "VALIDATION_ERROR", firstError.message, {
          field: firstError.path[0],
          current_length: currentLength,
          min_length: 1000,
          max_length: 10000,
        });
      }

      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid request data");
    }

    const { source_text } = validatedData;

    // Get environment variables
    const api_key = import.meta.env.OPENROUTER_API_KEY || "";
    const model = import.meta.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const use_mock = import.meta.env.OPENROUTER_USE_MOCK === "true";
    const skip_rate_limit = import.meta.env.OPENROUTER_USE_MOCK === "true"; // Skip rate limit in mock mode

    // Check rate limit (skip in development/mock mode)
    if (!skip_rate_limit) {
      let rate_limit_result;
      try {
        rate_limit_result = await rate_limit_service.checkRateLimit(user_id);
      } catch (error) {
        console.error("Rate limit check failed:", error);
        return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
      }

      if (rate_limit_result.exceeded && rate_limit_result.retryAfter) {
        return createRateLimitErrorResponse(rate_limit_result.retryAfter);
      }
    }

    // Only check for API key if we're not using mock data
    if (!use_mock && !api_key) {
      console.error("OPENROUTER_API_KEY is not configured");
      return createErrorResponse(500, "INTERNAL_ERROR", "Service is not properly configured. Please contact support.");
    }

    // Generate flashcards with AI
    let generation_result;
    try {
      generation_result = await generation_service.generateFlashcards(source_text, api_key, model);
    } catch (error) {
      if (error instanceof AIServiceError) {
        // Log error to database (fire and forget)
        generation_service
          .logError(user_id, source_text, model, error)
          .catch((err) => console.error("Failed to log generation error:", err));

        return createErrorResponse(
          503,
          "AI_SERVICE_ERROR",
          "Unable to generate flashcards at this time. Please try again later.",
          error.details
        );
      }

      console.error("Unexpected error during generation:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Save generation metadata to database
    let generation_id: number;
    try {
      generation_id = await generation_service.saveGeneration(user_id, source_text, generation_result);
    } catch (error) {
      console.error("Failed to save generation:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response_data: GenerateFlashcardsResponseDTO = {
      generation_id,
      model: generation_result.model,
      duration_ms: generation_result.duration_ms,
      generated_count: generation_result.flashcards_proposals.length,
      flashcards_proposals: generation_result.flashcards_proposals,
    };

    const response: ApiResponseDTO<GenerateFlashcardsResponseDTO> = {
      success: true,
      data: response_data,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/generations:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * Helper function to create rate limit error response
 */
function createRateLimitErrorResponse(retryAfter: string): Response {
  const errorResponse: RateLimitErrorDTO = {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "You have reached your daily generation limit. Please try again tomorrow.",
      retry_after: retryAfter,
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": retryAfter,
    },
  });
}
