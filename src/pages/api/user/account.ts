/**
 * /api/user/account
 * User account management endpoint
 *
 * DELETE - Delete user account and all associated data
 *
 * This endpoint requires authentication via Supabase JWT token.
 * Deletes the user account from Supabase Auth and all associated data
 * (flashcards, generations) via CASCADE.
 */

import type { APIContext } from "astro";
import { DeleteAccountHandler } from "../../../lib/api-handlers/user/DeleteAccountHandler";

// Disable prerendering for this API route
export const prerender = false;

/**
 * DELETE handler for deleting user account
 * This operation is irreversible and will delete:
 * - All flashcards
 * - All generations
 * - All generation error logs
 * - User account from Supabase Auth
 * - Session cookies
 */
export const DELETE = (context: APIContext) => new DeleteAccountHandler().handle(context);
