/**
 * Error Handling Middleware
 *
 * Provides centralized error handling for API handlers.
 * Maps custom error types to appropriate HTTP responses.
 *
 * @example
 * ```ts
 * export const GET = withErrorHandling(async (context) => {
 *   const user = await userService.getUser(id);
 *   // If service throws NotFoundError, it will be caught and converted to 404 Response
 *   return ApiResponseBuilder.success(user);
 * });
 *
 * // Or manually map errors
 * try {
 *   await someOperation();
 * } catch (error) {
 *   return mapErrorToResponse(error);
 * }
 * ```
 */

import type { APIContext } from "astro";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { NotFoundError, ValidationError as CustomValidationError } from "@/lib/errors";
import { AIServiceError } from "@/lib/services/generation.service";

/**
 * Map known error types to appropriate HTTP responses
 */
export function mapErrorToResponse(error: unknown): Response {
  // NotFoundError -> 404
  if (error instanceof NotFoundError) {
    return ApiResponseBuilder.notFound(error.message);
  }

  // ValidationError -> 400
  if (error instanceof CustomValidationError) {
    return ApiResponseBuilder.validationError(error.message, error.details);
  }

  // AIServiceError -> 503
  if (error instanceof AIServiceError) {
    return ApiResponseBuilder.serviceUnavailable(
      "Unable to process request at this time. Please try again later.",
      error.details
    );
  }

  // Generic Error -> 500
  if (error instanceof Error) {
    console.error("[API] Unexpected error:", error);
    return ApiResponseBuilder.internalError("An unexpected error occurred. Please try again later.");
  }

  // Unknown error type -> 500
  console.error("[API] Unknown error type:", error);
  return ApiResponseBuilder.internalError("An unexpected error occurred. Please try again later.");
}

/**
 * Higher-order function that wraps a handler with error handling
 * Automatically catches errors and converts them to appropriate responses
 */
export function withErrorHandling(
  handler: (context: APIContext) => Promise<Response>
): (context: APIContext) => Promise<Response> {
  return async (context: APIContext) => {
    try {
      return await handler(context);
    } catch (error) {
      return mapErrorToResponse(error);
    }
  };
}

/**
 * Async error boundary for service calls
 * Wraps service calls and returns Result type instead of throwing
 */
export async function tryCatchService<T>(
  operation: () => Promise<T>,
  errorContext?: string
): Promise<{ success: true; data: T } | { success: false; error: Response }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    if (errorContext) {
      console.error(`[API] ${errorContext}:`, error);
    }
    return {
      success: false,
      error: mapErrorToResponse(error),
    };
  }
}

/**
 * Log error details for debugging
 * Useful for development and monitoring
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[API] ${context}:` : "[API] Error:";

  if (error instanceof Error) {
    console.error(prefix, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
  } else {
    console.error(prefix, error);
  }
}
