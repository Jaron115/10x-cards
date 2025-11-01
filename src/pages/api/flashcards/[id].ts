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
import { GetFlashcardHandler } from "@/lib/api-handlers/flashcards/GetFlashcardHandler";
import { UpdateFlashcardHandler } from "@/lib/api-handlers/flashcards/UpdateFlashcardHandler";
import { DeleteFlashcardHandler } from "@/lib/api-handlers/flashcards/DeleteFlashcardHandler";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for retrieving a single flashcard
 */
export async function GET(context: APIContext): Promise<Response> {
  return new GetFlashcardHandler().handle(context);
}

/**
 * PATCH handler for updating a flashcard
 */
export async function PATCH(context: APIContext): Promise<Response> {
  return new UpdateFlashcardHandler().handle(context);
}

/**
 * DELETE handler for deleting a flashcard
 */
export async function DELETE(context: APIContext): Promise<Response> {
  return new DeleteFlashcardHandler().handle(context);
}
