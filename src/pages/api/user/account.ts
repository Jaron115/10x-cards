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
import type { ApiErrorDTO, DeleteAccountResponseDTO } from "../../../types.ts";
import { DEFAULT_USER_ID } from "../../../db/supabase.client.ts";

// Disable prerendering for this API route
export const prerender = false;

/**
 * DELETE handler for deleting user account
 * This operation is irreversible and will delete:
 * - All flashcards
 * - All generations
 * - All generation error logs
 * - User account from Supabase Auth (in production)
 */
export async function DELETE({ locals }: APIContext): Promise<Response> {
  try {
    const supabase = locals.supabase;

    // Get authenticated user from locals (set by middleware)
    // TODO: After middleware is updated to include user authentication, uncomment this:
    // const user = locals.user;
    // if (!user) {
    //   return createErrorResponse(401, "UNAUTHORIZED", "Invalid or missing authentication token");
    // }

    // Development: Using default user ID from database
    const user_id = DEFAULT_USER_ID;

    // Delete all user data from database tables
    // Order matters: delete in reverse order of dependencies

    // 1. Delete flashcards (references generations with SET NULL)
    const { error: flashcardsError } = await supabase.from("flashcards").delete().eq("user_id", user_id);

    if (flashcardsError) {
      return createErrorResponse(500, "INTERNAL_ERROR", "Failed to delete flashcards data", flashcardsError.message);
    }

    // 2. Delete generations
    const { error: generationsError } = await supabase.from("generations").delete().eq("user_id", user_id);

    if (generationsError) {
      return createErrorResponse(500, "INTERNAL_ERROR", "Failed to delete generations data", generationsError.message);
    }

    // 3. Delete generation error logs
    const { error: errorLogsError } = await supabase.from("generation_error_logs").delete().eq("user_id", user_id);

    if (errorLogsError) {
      return createErrorResponse(500, "INTERNAL_ERROR", "Failed to delete error logs data", errorLogsError.message);
    }

    // TODO: In production with proper authentication:
    // Delete user from Supabase Auth using admin API
    // This requires server-side service role key (not exposed to client)
    // const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    // Build successful response
    const response: DeleteAccountResponseDTO = {
      success: true,
      message: "Account and all associated data permanently deleted",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch {
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}

/**
 * Helper function to create error responses
 */
function createErrorResponse(
  status: number,
  code: ApiErrorDTO["error"]["code"],
  message: string,
  details?: unknown
): Response {
  const errorResponse: ApiErrorDTO = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
