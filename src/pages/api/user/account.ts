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
import type { DeleteAccountResponseDTO } from "../../../types.ts";
import { createErrorResponse } from "../../../lib/errors.ts";
import { supabaseAdmin } from "../../../db/supabase.admin.ts";

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
export async function DELETE({ locals, cookies }: APIContext): Promise<Response> {
  try {
    const supabase = locals.supabase;

    // Get authenticated user from locals (set by middleware)
    const user = locals.user;
    if (!user) {
      return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
    }

    const user_id = user.id;

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

    // 4. Delete user from Supabase Auth using admin API
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);

    if (authError) {
      console.error("[API] Failed to delete user from Supabase Auth:", authError);
      return createErrorResponse(500, "INTERNAL_ERROR", "Failed to delete user account", authError.message);
    }

    // 5. Clear session cookies (important - otherwise user appears still logged in)
    cookies.delete("sb-access-token", { path: "/" });
    cookies.delete("sb-refresh-token", { path: "/" });

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
  } catch (error) {
    console.error("[API] Delete account error:", error);
    return createErrorResponse(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again later.");
  }
}
