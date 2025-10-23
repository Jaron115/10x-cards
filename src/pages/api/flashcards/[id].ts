/**
 * /api/flashcards/:id
 * Single flashcard management endpoints
 *
 * GET    - Get a single flashcard by ID
 * PATCH  - Update an existing flashcard
 * DELETE - Delete a flashcard
 *
 * This endpoint requires authentication via Supabase JWT token.
 */

import type { APIContext } from "astro";
import { z } from "zod";
import type { ApiResponseDTO, FlashcardDTO, DeleteResourceResponseDTO } from "../../../types.ts";
import { createErrorResponse, NotFoundError } from "../../../lib/errors.ts";
import { FlashcardService } from "../../../lib/services/flashcard.service.ts";
import { FlashcardIdSchema, UpdateFlashcardSchema } from "../../../lib/validation/flashcard.schemas.ts";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for retrieving a single flashcard
 */
export async function GET({ locals, params }: APIContext): Promise<Response> {
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

    // Parse and validate ID parameter
    const id_param = params.id;
    let flashcard_id: number;

    try {
      const parsed_id = parseInt(id_param || "", 10);
      flashcard_id = FlashcardIdSchema.parse(parsed_id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
      }
      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
    }

    // Fetch flashcard
    let flashcard: FlashcardDTO;
    try {
      flashcard = await flashcard_service.getFlashcardById(flashcard_id, user_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return createErrorResponse(404, "NOT_FOUND", "Flashcard not found");
      }

      console.error("Failed to fetch flashcard:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response: ApiResponseDTO<FlashcardDTO> = {
      success: true,
      data: flashcard,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/flashcards/:id:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * PATCH handler for updating a flashcard
 */
export async function PATCH({ locals, params, request }: APIContext): Promise<Response> {
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

    // Parse and validate ID parameter
    const id_param = params.id;
    let flashcard_id: number;

    try {
      const parsed_id = parseInt(id_param || "", 10);
      flashcard_id = FlashcardIdSchema.parse(parsed_id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
      }
      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON in request body");
    }

    // Validate request body
    let validated_data: z.infer<typeof UpdateFlashcardSchema>;
    try {
      validated_data = UpdateFlashcardSchema.parse(body);
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

    // Update flashcard
    let updated_flashcard: FlashcardDTO;
    try {
      updated_flashcard = await flashcard_service.updateFlashcard(flashcard_id, user_id, validated_data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return createErrorResponse(404, "NOT_FOUND", "Flashcard not found");
      }

      console.error("Failed to update flashcard:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response: ApiResponseDTO<FlashcardDTO> = {
      success: true,
      data: updated_flashcard,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in PATCH /api/flashcards/:id:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * DELETE handler for deleting a flashcard
 */
export async function DELETE({ locals, params }: APIContext): Promise<Response> {
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

    // Parse and validate ID parameter
    const id_param = params.id;
    let flashcard_id: number;

    try {
      const parsed_id = parseInt(id_param || "", 10);
      flashcard_id = FlashcardIdSchema.parse(parsed_id);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
      }
      return createErrorResponse(400, "VALIDATION_ERROR", "Invalid flashcard ID");
    }

    // Delete flashcard
    try {
      await flashcard_service.deleteFlashcard(flashcard_id, user_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        return createErrorResponse(404, "NOT_FOUND", "Flashcard not found");
      }

      console.error("Failed to delete flashcard:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
    }

    // Build successful response
    const response: ApiResponseDTO<DeleteResourceResponseDTO> = {
      success: true,
      data: {
        success: true,
        message: "Flashcard deleted successfully",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Unexpected error in DELETE /api/flashcards/:id:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}
