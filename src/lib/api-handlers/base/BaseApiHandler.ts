/**
 * Base API Handler
 *
 * Abstract base class implementing Template Method Pattern for API handlers.
 * Provides a consistent structure for handling API requests with:
 * - Authentication (optional)
 * - Validation (optional)
 * - Error handling
 * - Response building
 *
 * @example
 * ```ts
 * class GetUserHandler extends BaseApiHandler<UserDTO> {
 *   protected async execute(context: APIContext): Promise<Response> {
 *     const userId = context.params.id;
 *     const user = await userService.getUser(userId);
 *     return this.successResponse(user);
 *   }
 * }
 *
 * // Usage in API route
 * export const GET = (context: APIContext) => new GetUserHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import { ApiResponseBuilder } from "../utils/responseBuilder";
import { mapErrorToResponse, logError } from "../middleware/errorHandler";

/**
 * Abstract base class for API handlers
 * Implements Template Method Pattern
 */
export abstract class BaseApiHandler {
  /**
   * Main handler method - implements the template
   * This is the method called by API routes
   */
  async handle(context: APIContext): Promise<Response> {
    try {
      // Step 1: Optional authentication check
      const authResult = await this.authenticate(context);
      if (authResult !== null) {
        return authResult; // Return error response if auth failed
      }

      // Step 2: Optional validation
      const validationResult = await this.validate(context);
      if (validationResult !== null) {
        return validationResult; // Return error response if validation failed
      }

      // Step 3: Execute main logic
      const response = await this.execute(context);
      return response;
    } catch (error) {
      // Step 4: Handle any errors
      return this.handleError(error, context);
    }
  }

  /**
   * Optional authentication step
   * Override this method to add authentication
   * Return null if authentication succeeds
   * Return Response if authentication fails
   */
  protected async authenticate(_context: APIContext): Promise<Response | null> {
    return null; // Default: no authentication required
  }

  /**
   * Optional validation step
   * Override this method to add validation
   * Return null if validation succeeds
   * Return Response if validation fails
   */
  protected async validate(_context: APIContext): Promise<Response | null> {
    return null; // Default: no validation required
  }

  /**
   * Main execution logic - must be implemented by subclasses
   * This is where the actual business logic goes
   */
  protected abstract execute(context: APIContext): Promise<Response>;

  /**
   * Error handling - can be overridden for custom error handling
   * Default implementation uses mapErrorToResponse
   */
  protected handleError(error: unknown, _context: APIContext): Response {
    logError(error, this.constructor.name);
    return mapErrorToResponse(error);
  }

  /**
   * Helper method to create success responses
   */
  protected successResponse<T>(data: T, status = 200): Response {
    return ApiResponseBuilder.success(data, status);
  }

  /**
   * Helper method to create created responses (201)
   */
  protected createdResponse<T>(data: T): Response {
    return ApiResponseBuilder.created(data);
  }

  /**
   * Helper method to create error responses
   */
  protected errorResponse(code: string, message: string, details?: unknown, status = 400): Response {
    return ApiResponseBuilder.error(code, message, details, status);
  }
}
