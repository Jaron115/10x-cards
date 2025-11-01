/**
 * Login Handler
 *
 * Handles POST /api/auth/login - Authenticate user and create session
 *
 * Features:
 * - Email/password validation
 * - Supabase authentication
 * - Session cookie management
 * - Error mapping for user-friendly messages
 *
 * @example
 * ```ts
 * export const POST = (context: APIContext) => new LoginHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import type { LoginResponseDTO } from "@/types";
import { BaseApiHandler } from "../base/BaseApiHandler";
import { validateBody } from "../middleware/validation";
import { LoginSchema } from "@/lib/validation/auth.schemas";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { CookieManager } from "../utils/cookieManager";
import { mapSupabaseAuthError } from "@/lib/auth/helpers";

/**
 * Handler for user login
 * Authenticates user and creates session with cookies
 */
export class LoginHandler extends BaseApiHandler {
  /**
   * Main execution logic
   */
  protected async execute(context: APIContext): Promise<Response> {
    // 1. Validate request body
    const validationResult = await validateBody(context.request, LoginSchema);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { email, password } = validationResult.data;
    const supabase = context.locals.supabase;

    // 2. Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 3. Handle authentication errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[AUTH] Login error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      const mappedError = mapSupabaseAuthError(error);
      return ApiResponseBuilder.customError(mappedError.code, mappedError.message, mappedError.status);
    }

    // 4. Validate response data
    if (!data.user || !data.session) {
      // eslint-disable-next-line no-console
      console.error("[AUTH] Login succeeded but no user or session returned");
      return ApiResponseBuilder.internalError("Login failed");
    }

    // 5. Set session cookies
    CookieManager.setSessionCookies(context.cookies, data.session, import.meta.env.PROD);

    // 6. Build success response
    const responseData: LoginResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
    };

    return this.successResponse(responseData);
  }
}
