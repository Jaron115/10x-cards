/**
 * Get Current User Handler
 *
 * Handles GET /api/auth/me - Returns current authenticated user data
 *
 * Features:
 * - Authentication required
 * - Returns user ID and email
 * - Used by frontend to fetch user data on app load
 *
 * @example
 * ```ts
 * export const GET = (context: APIContext) => new GetCurrentUserHandler().handle(context);
 * ```
 */

import type { GetCurrentUserResponseDTO } from "@/types";
import { AuthenticatedHandler } from "../base/AuthenticatedHandler";
import type { AuthenticatedContext } from "../types";

/**
 * Handler for getting current authenticated user
 * Requires authentication - returns 401 if not authenticated
 */
export class GetCurrentUserHandler extends AuthenticatedHandler {
  /**
   * Main execution logic with authentication
   */
  protected async executeAuthenticated(_context: AuthenticatedContext): Promise<Response> {
    const user = this.getUser();

    // Build response with user data
    const responseData: GetCurrentUserResponseDTO = {
      user: {
        id: user.id,
        email: user.email || "",
      },
    };

    return this.successResponse(responseData);
  }
}
