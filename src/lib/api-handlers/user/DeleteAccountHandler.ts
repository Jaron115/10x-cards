/**
 * Delete Account Handler
 *
 * Handles DELETE /api/user/account - Delete user account and all associated data
 *
 * Features:
 * - Authentication required
 * - Complete data deletion (flashcards, generations, error logs)
 * - User account deletion from Supabase Auth
 * - Session cookie clearing
 * - Irreversible operation
 *
 * @example
 * ```ts
 * export const DELETE = (context: APIContext) => new DeleteAccountHandler().handle(context);
 * ```
 */

import type { DeleteAccountResponseDTO } from "@/types";
import { AuthenticatedHandler } from "../base/AuthenticatedHandler";
import type { AuthenticatedContext } from "../types";
import { AccountDeletionService } from "@/lib/services/accountDeletion.service";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { CookieManager } from "../utils/cookieManager";

/**
 * Handler for deleting user account
 * This operation is irreversible and will delete all user data
 */
export class DeleteAccountHandler extends AuthenticatedHandler {
  /**
   * Main execution logic with authentication
   */
  protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
    const userId = this.getUserId();
    const supabase = this.getSupabase();

    // Initialize account deletion service
    const accountDeletionService = new AccountDeletionService(supabase);

    // Delete account and all associated data
    const deletionResult = await accountDeletionService.deleteAccount(userId);

    if (!deletionResult.success) {
      // eslint-disable-next-line no-console
      console.error("[DeleteAccountHandler] Account deletion failed:", deletionResult.error);
      return ApiResponseBuilder.internalError(deletionResult.error || "Failed to delete account");
    }

    // Clear session cookies (important - otherwise user appears still logged in)
    CookieManager.clearSessionCookies(context.cookies);

    // Build successful response
    const response: DeleteAccountResponseDTO = {
      success: true,
      message: "Account and all associated data permanently deleted",
    };

    return this.successResponse(response);
  }
}
