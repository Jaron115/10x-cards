/**
 * Centralized API error handling
 * Handles common HTTP errors and provides consistent error messages
 */

import type { ApiErrorDTO, ValidationErrorDetailDTO } from "@/types";
import { HttpError, type ParsedApiError } from "./types";

/**
 * Parse validation errors from API response
 */
function parseValidationErrors(details: ValidationErrorDetailDTO[]): Record<string, string> {
  const errors: Record<string, string> = {};
  details.forEach((detail) => {
    errors[detail.field] = detail.message;
  });
  return errors;
}

/**
 * Handle HTTP response errors
 * Throws HttpError with appropriate message and validation errors
 */
export async function handleApiError(response: Response, operation: string): Promise<never> {
  // Handle 401 Unauthorized - redirect to login
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new HttpError(401, "Sesja wygasła. Zaloguj się ponownie.");
  }

  // Handle 404 Not Found
  if (response.status === 404) {
    throw new HttpError(404, "Nie znaleziono zasobu");
  }

  // Handle 400 Bad Request with validation errors
  if (response.status === 400) {
    try {
      const errorData: ApiErrorDTO = await response.json();

      // Check for validation errors
      if (errorData.error.code === "VALIDATION_ERROR" && errorData.error.details) {
        const validationErrors = parseValidationErrors(errorData.error.details as ValidationErrorDetailDTO[]);
        throw new HttpError(400, errorData.error.message || "Błąd walidacji", validationErrors);
      }

      // Other 400 errors
      throw new HttpError(400, errorData.error.message || `Błąd podczas ${operation}`);
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(400, `Błąd podczas ${operation}`);
    }
  }

  // Handle 403 Forbidden
  if (response.status === 403) {
    throw new HttpError(403, "Brak uprawnień do wykonania tej operacji");
  }

  // Handle 429 Too Many Requests
  if (response.status === 429) {
    throw new HttpError(429, "Zbyt wiele żądań. Spróbuj ponownie później.");
  }

  // Handle 500 Internal Server Error
  if (response.status >= 500) {
    throw new HttpError(500, "Błąd serwera. Spróbuj ponownie później.");
  }

  // Generic error for other status codes
  throw new HttpError(response.status, `Błąd podczas ${operation}`);
}

/**
 * Parse error object to user-friendly message
 */
export function parseError(error: unknown, fallbackMessage: string): ParsedApiError {
  if (error instanceof HttpError) {
    return {
      message: error.message,
      validationErrors: error.validationErrors,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("fetch");
}
