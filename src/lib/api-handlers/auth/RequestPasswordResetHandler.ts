/**
 * Request Password Reset Handler
 *
 * Handles POST /api/auth/request-reset - Send password reset email
 *
 * Features:
 * - Email validation
 * - Supabase password reset email
 * - Security: Returns success even if email doesn't exist (prevents email enumeration)
 * - Automatic redirect URL generation
 *
 * @example
 * ```ts
 * export const POST = (context: APIContext) => new RequestPasswordResetHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import type { ResetPasswordResponseDTO } from "@/types";
import { BaseApiHandler } from "../base/BaseApiHandler";
import { validateBody } from "../middleware/validation";
import { RequestPasswordResetSchema } from "@/lib/validation/auth.schemas";
import { ApiResponseBuilder } from "../utils/responseBuilder";

/**
 * Handler for password reset requests
 * Sends password reset email via Supabase
 */
export class RequestPasswordResetHandler extends BaseApiHandler {
  /**
   * Main execution logic
   */
  protected async execute(context: APIContext): Promise<Response> {
    // 1. Validate request body
    const validationResult = await validateBody(context.request, RequestPasswordResetSchema);
    if (!validationResult.success) {
      return validationResult.error;
    }

    const { email } = validationResult.data;
    const supabase = context.locals.supabase;

    // 2. Get the origin for redirect URL
    const origin = new URL(context.request.url).origin;
    const redirectTo = `${origin}/auth/update-password`;

    // 3. Call Supabase Auth resetPasswordForEmail
    // NOTE: Supabase will send an email with a reset link regardless of whether the email exists
    // This is a security best practice to prevent email enumeration
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    // 4. Handle Supabase errors
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[AUTH] Password reset request error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });

      // Don't expose whether email exists or not
      // Return generic error message
      return ApiResponseBuilder.internalError("Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie później.");
    }

    // 5. Success response
    // NOTE: We return success even if the email doesn't exist (security best practice)
    const responseData: ResetPasswordResponseDTO = {
      message:
        "Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową.",
    };

    return this.successResponse(responseData);
  }
}
