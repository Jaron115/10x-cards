/**
 * API Response Builder
 *
 * Provides consistent response formatting across all API endpoints.
 * Handles success and error responses with proper status codes and headers.
 *
 * @example
 * ```ts
 * // Success response
 * return ApiResponseBuilder.success({ id: 1, name: "John" });
 *
 * // Error response
 * return ApiResponseBuilder.error("NOT_FOUND", "User not found");
 *
 * // Specific error types
 * return ApiResponseBuilder.notFound("User not found");
 * return ApiResponseBuilder.unauthorized();
 * return ApiResponseBuilder.validationError("Invalid email", { field: "email" });
 * ```
 */

import type { ApiResponseDTO } from "@/types";

/**
 * Standard error response structure
 */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * API Response Builder
 * Utility object with static methods for building responses
 */
export const ApiResponseBuilder = {
  /**
   * Create a successful JSON response
   */
  success<T>(data: T, status = 200): Response {
    const response: ApiResponseDTO<T> = {
      success: true,
      data,
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  /**
   * Create an error JSON response
   */
  error(code: string, message: string, details?: unknown, status = 400): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        details,
      },
    };

    return new Response(JSON.stringify(response), {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  },

  /**
   * 200 OK - Resource retrieved successfully
   */
  ok<T>(data: T): Response {
    return this.success(data, 200);
  },

  /**
   * 201 Created - Resource created successfully
   */
  created<T>(data: T): Response {
    return this.success(data, 201);
  },

  /**
   * 204 No Content - Request succeeded with no response body
   */
  noContent(): Response {
    return new Response(null, { status: 204 });
  },

  /**
   * 400 Bad Request - Validation error
   */
  validationError(message: string, details?: unknown): Response {
    return this.error("VALIDATION_ERROR", message, details, 400);
  },

  /**
   * 401 Unauthorized - Authentication required
   */
  unauthorized(message = "Authentication required"): Response {
    return this.error("UNAUTHORIZED", message, undefined, 401);
  },

  /**
   * 403 Forbidden - Insufficient permissions
   */
  forbidden(message = "Insufficient permissions"): Response {
    return this.error("FORBIDDEN", message, undefined, 403);
  },

  /**
   * 404 Not Found - Resource not found
   */
  notFound(message = "Resource not found"): Response {
    return this.error("NOT_FOUND", message, undefined, 404);
  },

  /**
   * 409 Conflict - Resource conflict (e.g., duplicate)
   */
  conflict(message: string, details?: unknown): Response {
    return this.error("CONFLICT", message, details, 409);
  },

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  rateLimitExceeded(message: string, retryAfter?: string): Response {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message,
        details: retryAfter ? { retry_after: retryAfter } : undefined,
      },
    };

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (retryAfter) {
      headers["Retry-After"] = retryAfter;
    }

    return new Response(JSON.stringify(response), {
      status: 429,
      headers,
    });
  },

  /**
   * 500 Internal Server Error - Unexpected error
   */
  internalError(message = "An unexpected error occurred. Please try again later."): Response {
    return this.error("INTERNAL_ERROR", message, undefined, 500);
  },

  /**
   * 503 Service Unavailable - External service error
   */
  serviceUnavailable(message: string, details?: unknown): Response {
    return this.error("SERVICE_UNAVAILABLE", message, details, 503);
  },

  /**
   * Custom error with specific status code
   */
  customError(code: string, message: string, status: number, details?: unknown): Response {
    return this.error(code, message, details, status);
  },
} as const;

/**
 * Export as default for convenience
 */
export default ApiResponseBuilder;
