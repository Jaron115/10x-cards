/**
 * Logout Handler
 *
 * Handles POST /api/auth/logout - Logout user and clear session
 *
 * Features:
 * - Supabase session termination
 * - Cookie clearing
 * - Graceful error handling (clears cookies even if Supabase fails)
 *
 * @example
 * ```ts
 * export const POST = (context: APIContext) => new LogoutHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import type { LogoutResponseDTO } from "@/types";
import { BaseApiHandler } from "../base/BaseApiHandler";
import { CookieManager } from "../utils/cookieManager";

/**
 * Handler for user logout
 * Terminates session and clears cookies
 */
export class LogoutHandler extends BaseApiHandler {
  /**
   * Main execution logic
   */
  protected async execute(context: APIContext): Promise<Response> {
    const supabase = context.locals.supabase;

    // 1. Get access token from cookie
    const accessToken = CookieManager.getAccessToken(context.cookies);

    // 2. Call Supabase Auth signOut (if we have a token)
    if (accessToken) {
      const { error } = await supabase.auth.signOut();

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[AUTH] Logout error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        // Continue anyway - we'll clear cookies regardless
      }
    }

    // 3. Clear session cookies
    CookieManager.clearSessionCookies(context.cookies);

    // 4. Build success response
    const response: LogoutResponseDTO = {
      success: true,
      message: "Zostałeś wylogowany",
    };

    return this.successResponse(response);
  }
}
