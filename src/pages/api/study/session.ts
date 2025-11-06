/**
 * /api/study/session
 * Study session endpoint
 *
 * GET - Retrieve flashcards for study session with optional filtering and shuffling
 *
 * This endpoint requires authentication via Supabase JWT token.
 */

import type { APIContext } from "astro";
import { GetStudySessionHandler } from "@/lib/api-handlers/study/GetStudySessionHandler";

// Disable prerendering for this API route
export const prerender = false;

/**
 * GET handler for retrieving study session flashcards
 */
export async function GET(context: APIContext): Promise<Response> {
  return new GetStudySessionHandler().handle(context);
}
