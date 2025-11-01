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
import { ListFlashcardsHandler } from "@/lib/api-handlers/flashcards/ListFlashcardsHandler";
import { CreateFlashcardHandler } from "@/lib/api-handlers/flashcards/CreateFlashcardHandler";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for listing flashcards
 */
export async function GET(context: APIContext): Promise<Response> {
  return new ListFlashcardsHandler().handle(context);
}

/**
 * POST handler for creating a single manual flashcard
 */
export async function POST(context: APIContext): Promise<Response> {
  return new CreateFlashcardHandler().handle(context);
}
