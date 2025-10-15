/**
 * Custom error classes for the application
 * Used throughout services and API routes for consistent error handling
 */

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

