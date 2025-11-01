/**
 * Register Handler
 *
 * Handles POST /api/auth/register - Register new user and create session
 *
 * Features:
 * - Email/password validation
 * - Supabase user registration
 * - Automatic login after registration
 * - Session cookie management
 * - Error mapping for user-friendly messages
 *
 * @example
 * ```ts
 * export const POST = (context: APIContext) => new RegisterHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import type { RegisterResponseDTO } from "@/types";
import { BaseApiHandler } from "../base/BaseApiHandler";
import { validateBody } from "../middleware/validation";
import { RegisterSchema } from "@/lib/validation/auth.schemas";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { CookieManager } from "../utils/cookieManager";
import { mapSupabaseAuthError } from "@/lib/auth/helpers";

/**
 * Handler for user registration
 * Registers new user and automatically logs them in
 */
export class RegisterHandler extends BaseApiHandler {
  /**
   * Main execution logic
   */
  protected async execute(context: APIContext): Promise<Response> {
    // 1. Validate request body
    const validationResult = await validateBody(context.request, RegisterSchema);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { email, password } = validationResult.data;
    const supabase = context.locals.supabase;

    // 2. Register with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    // 3. Handle registration errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[AUTH] Registration error:", {
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
      console.error("[AUTH] Registration succeeded but no user or session returned");
      return ApiResponseBuilder.internalError("Registration failed");
    }

    // 5. Set session cookies (user is automatically logged in)
    CookieManager.setSessionCookies(context.cookies, data.session, import.meta.env.PROD);

    // 6. Build success response
    const responseData: RegisterResponseDTO = {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      message: "Konto utworzone pomyślnie. Jesteś teraz zalogowany.",
    };

    return this.createdResponse(responseData);
  }
}
