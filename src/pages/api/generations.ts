/**
 * POST /api/generations
 * Generate flashcard proposals from source text using AI
 *
 * This endpoint requires authentication via Supabase JWT token.
 * Rate limit: 10 generations per user per day.
 */

import type { APIContext } from "astro";
import { CreateGenerationHandler } from "../../lib/api-handlers/generations/CreateGenerationHandler";

// Disable prerendering for this API route
export const prerender = false;

/**
 * POST handler for flashcard generation
 */
export const POST = (context: APIContext) => new CreateGenerationHandler().handle(context);
