/**
 * /api/flashcards
 * Flashcard management endpoints
 *
 * GET    - List all flashcards with pagination and filtering
 * POST   - Create a single manual flashcard
 *
 * This endpoint requires authentication via Supabase JWT token.
 */

import type { APIContext } from "astro";
import { z } from "zod";
import type { ApiResponseDTO, FlashcardDTO, GetFlashcardsResponseDTO } from "../../../types.ts";
import { createErrorResponse } from "../../../lib/errors.ts";
import { FlashcardService } from "../../../lib/services/flashcard.service.ts";
import {
  CreateFlashcardSchema,
  GetFlashcardsQuerySchema,
  type ValidatedGetFlashcardsQuery,
} from "../../../lib/validation/flashcard.schemas.ts";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for listing flashcards
 */
export async function GET({ locals, url }: APIContext): Promise<Response> {
  try {
    const supabase = locals.supabase;

    // Initialize service
    const flashcard_service = new FlashcardService(supabase);

    // Get authenticated user from locals (set by middleware)
    const user = locals.user;
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
    }

    const user_id = user.id;

    // Parse and validate query parameters
    const query_params: Record<string, unknown> = {};

    // Extract query parameters
    const page_param = url.searchParams.get("page");
    const limit_param = url.searchParams.get("limit");
    const source_param = url.searchParams.get("source");
    const sort_param = url.searchParams.get("sort");
    const order_param = url.searchParams.get("order");

    // Convert string parameters to appropriate types
    if (page_param) {
      const page_num = parseInt(page_param, 10);
      if (!isNaN(page_num)) {
        query_params.page = page_num;
      }
    }

    if (limit_param) {
      const limit_num = parseInt(limit_param, 10);
      if (!isNaN(limit_num)) {
        query_params.limit = limit_num;
      }
    }

    if (source_param) {
      query_params.source = source_param;
    }

    if (sort_param) {
      query_params.sort = sort_param;
    }

    if (order_param) {
      query_params.order = order_param;
    }

    // Validate query parameters
    let validated_query: ValidatedGetFlashcardsQuery;
    try {
      validated_query = GetFlashcardsQuerySchema.parse(query_params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return createErrorResponse(400, "VALIDATION_ERROR", "Invalid query parameters", details);
      }

      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid query parameters");
    }

    // Fetch flashcards
    let result: GetFlashcardsResponseDTO;
    try {
      result = await flashcard_service.getFlashcards(user_id, validated_query);
    } catch (error) {
      console.error("Failed to fetch flashcards:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response: ApiResponseDTO<GetFlashcardsResponseDTO> = {
      success: true,
      data: result,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/flashcards:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * POST handler for creating a single manual flashcard
 */
export async function POST({ locals, request }: APIContext): Promise<Response> {
  try {
    const supabase = locals.supabase;

    // Initialize service
    const flashcard_service = new FlashcardService(supabase);

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
    let validated_data: z.infer<typeof CreateFlashcardSchema>;
    try {
      validated_data = CreateFlashcardSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return createErrorResponse(400, "VALIDATION_ERROR", "Validation failed", details);
      }

      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid request data");
    }

    // Create flashcard
    let created_flashcard: FlashcardDTO;
    try {
      created_flashcard = await flashcard_service.createFlashcard(user_id, validated_data);
    } catch (error) {
      console.error("Failed to create flashcard:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response: ApiResponseDTO<FlashcardDTO> = {
      success: true,
      data: created_flashcard,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in POST /api/flashcards:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}
