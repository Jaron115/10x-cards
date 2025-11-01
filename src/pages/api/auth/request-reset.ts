import type { APIContext } from "astro";
import type { ApiResponseDTO, ResetPasswordRequest, ResetPasswordResponseDTO } from "@/types";
import { createErrorResponse } from "@/lib/auth/helpers";

export const prerender = false;

/**
 * POST /api/auth/request-reset
 * Sends password reset email to the user
 * Uses Supabase Auth resetPasswordForEmail method
 */
export async function POST({ request, locals }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON");
  }

  // 2. Validate request body
  if (!body || typeof body !== "object") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Invalid request body");
  }

  const { email } = body as ResetPasswordRequest;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return createErrorResponse(400, "VALIDATION_ERROR", "Email jest wymagany");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return createErrorResponse(400, "VALIDATION_ERROR", "Nieprawidłowy format adresu email");
  }

  // 3. Get the origin for redirect URL
  const origin = new URL(request.url).origin;
  const redirectTo = `${origin}/auth/update-password`;

  // 4. Call Supabase Auth resetPasswordForEmail
  // NOTE: Supabase will send an email with a reset link regardless of whether the email exists
  // This is a security best practice to prevent email enumeration
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  // 5. Handle Supabase errors
  if (error) {
    console.error("[AUTH] Password reset request error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    // Don't expose whether email exists or not
    // Return generic error message
    return createErrorResponse(
      500,
      "INTERNAL_ERROR",
      "Wystąpił błąd podczas wysyłania emaila. Spróbuj ponownie później."
    );
  }

  // 6. Success response
  // NOTE: We return success even if the email doesn't exist (security best practice)
  const response: ApiResponseDTO<ResetPasswordResponseDTO> = {
    success: true,
    data: {
      message:
        "Jeśli konto z tym adresem email istnieje, wysłaliśmy link do resetowania hasła. Sprawdź swoją skrzynkę pocztową.",
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
