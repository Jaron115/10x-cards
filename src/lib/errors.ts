/**
 * Custom error classes for the application
 * Used throughout services and API routes for consistent error handling
 */

import type { ApiErrorDTO } from "@/types";

/**
 * Creates a standardized error response for API endpoints
 * @param status HTTP status code
 * @param code Error code for client handling
 * @param message User-friendly error message
 * @param details Optional additional error details
 * @returns Response object with JSON error payload
 */
export function createErrorResponse(
  status: number,
  code: ApiErrorDTO["error"]["code"],
  message: string,
  details?: unknown
): Response {
  const errorResponse: ApiErrorDTO = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Error thrown when a requested resource is not found
 * Maps to HTTP 404 status code
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when validation fails
 * Maps to HTTP 400 status code
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when authentication is missing or invalid
 * Maps to HTTP 401 status code
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Error thrown when user doesn't have permission to access resource
 * Maps to HTTP 403 status code
 */
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}
