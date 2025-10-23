import type { AuthError } from "@supabase/supabase-js";
import type { ApiErrorDTO } from "@/types";
import { createErrorResponse } from "@/lib/errors";

// Re-export for convenience
export { createErrorResponse };

/**
 * Maps Supabase Auth errors to standardized API error responses
 * Converts Supabase-specific error messages to user-friendly Polish messages
 * @param error AuthError from Supabase
 * @returns Object with status code, error code, and message
 */
export function mapSupabaseAuthError(error: AuthError): {
  status: number;
  code: ApiErrorDTO["error"]["code"];
  message: string;
} {
  const errorMessage = error.message.toLowerCase();

  // Email already registered
  if (errorMessage.includes("already registered") || errorMessage.includes("user already registered")) {
    return {
      status: 409,
      code: "VALIDATION_ERROR",
      message: "Konto z tym adresem email już istnieje.",
    };
  }

  // Invalid login credentials
  if (errorMessage.includes("invalid login credentials") || errorMessage.includes("invalid credentials")) {
    return {
      status: 401,
      code: "UNAUTHORIZED",
      message: "Nieprawidłowy email lub hasło.",
    };
  }

  // Email not confirmed
  if (errorMessage.includes("email not confirmed")) {
    return {
      status: 401,
      code: "UNAUTHORIZED",
      message: "Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.",
    };
  }

  // Password requirements not met
  if (errorMessage.includes("password") && (errorMessage.includes("short") || errorMessage.includes("weak"))) {
    return {
      status: 422,
      code: "VALIDATION_ERROR",
      message: "Hasło nie spełnia wymagań bezpieczeństwa. Użyj co najmniej 6 znaków.",
    };
  }

  // Invalid email format
  if (errorMessage.includes("email") && errorMessage.includes("invalid")) {
    return {
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Nieprawidłowy format adresu email.",
    };
  }

  // Rate limit exceeded
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return {
      status: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.",
    };
  }

  // User not found
  if (errorMessage.includes("user not found")) {
    return {
      status: 404,
      code: "NOT_FOUND",
      message: "Użytkownik nie istnieje.",
    };
  }

  // Default internal error
  console.error("[AUTH] Unhandled Supabase error:", {
    message: error.message,
    status: error.status,
    name: error.name,
  });

  return {
    status: 500,
    code: "INTERNAL_ERROR",
    message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
  };
}

/**
 * Validates if the request body contains required auth fields
 * @param body Request body to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateAuthRequestBody(body: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return {
      isValid: false,
      error: "Invalid request body",
    };
  }

  const { email, password } = body as Record<string, unknown>;

  if (!email || typeof email !== "string" || email.trim() === "") {
    return {
      isValid: false,
      error: "Email is required",
    };
  }

  if (!password || typeof password !== "string" || password === "") {
    return {
      isValid: false,
      error: "Password is required",
    };
  }

  return {
    isValid: true,
  };
}
