/**
 * Account Deletion Service
 *
 * Handles complete user account deletion including:
 * - All flashcards
 * - All generations
 * - All generation error logs
 * - User account from Supabase Auth
 *
 * This service ensures proper order of deletion to respect foreign key constraints.
 */

import type { SupabaseClient } from "../../db/supabase.client";
import { supabaseAdmin } from "../../db/supabase.admin";

/**
 * Result of account deletion operation
 */
export interface AccountDeletionResult {
  success: boolean;
  error?: string;
}

/**
 * Account Deletion Service
 * Provides methods for safely deleting user accounts and all associated data
 */
export class AccountDeletionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Delete user account and all associated data
   * Deletes in proper order to respect foreign key constraints:
   * 1. Flashcards (references generations with SET NULL)
   * 2. Generations
   * 3. Generation error logs
   * 4. User from Supabase Auth
   *
   * @param userId - User ID to delete
   * @returns Promise that resolves to deletion result
   */
  async deleteAccount(userId: string): Promise<AccountDeletionResult> {
    try {
      // 1. Delete flashcards (references generations with SET NULL)
      const { error: flashcardsError } = await this.supabase.from("flashcards").delete().eq("user_id", userId);

      if (flashcardsError) {
        return {
          success: false,
          error: `Failed to delete flashcards data: ${flashcardsError.message}`,
        };
      }

      // 2. Delete generations
      const { error: generationsError } = await this.supabase.from("generations").delete().eq("user_id", userId);

      if (generationsError) {
        return {
          success: false,
          error: `Failed to delete generations data: ${generationsError.message}`,
        };
      }

      // 3. Delete generation error logs
      const { error: errorLogsError } = await this.supabase
        .from("generation_error_logs")
        .delete()
        .eq("user_id", userId);

      if (errorLogsError) {
        return {
          success: false,
          error: `Failed to delete error logs data: ${errorLogsError.message}`,
        };
      }

      // 4. Delete user from Supabase Auth using admin API
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        console.error("[AccountDeletionService] Failed to delete user from Supabase Auth:", authError);
        return {
          success: false,
          error: `Failed to delete user account: ${authError.message}`,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("[AccountDeletionService] Unexpected error during account deletion:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get count of data to be deleted for a user
   * Useful for showing confirmation dialogs
   *
   * @param userId - User ID to check
   * @returns Promise that resolves to counts of data to be deleted
   */
  async getAccountDataCounts(userId: string): Promise<{
    flashcardsCount: number;
    generationsCount: number;
    errorLogsCount: number;
  }> {
    const [flashcardsResult, generationsResult, errorLogsResult] = await Promise.all([
      this.supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId),
      this.supabase.from("generations").select("*", { count: "exact", head: true }).eq("user_id", userId),
      this.supabase.from("generation_error_logs").select("*", { count: "exact", head: true }).eq("user_id", userId),
    ]);

    return {
      flashcardsCount: flashcardsResult.count || 0,
      generationsCount: generationsResult.count || 0,
      errorLogsCount: errorLogsResult.count || 0,
    };
  }
}
