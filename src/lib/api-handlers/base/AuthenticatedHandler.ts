/**
 * Authenticated API Handler
 *
 * Base class for handlers that require authentication.
 * Automatically checks authentication and provides AuthenticatedContext to execute method.
 *
 * @example
 * ```ts
 * class GetMyProfileHandler extends AuthenticatedHandler<UserDTO> {
 *   protected async executeAuthenticated(context: AuthenticatedContext): Promise<Response> {
 *     const userId = context.user.id;
 *     const profile = await userService.getProfile(userId);
 *     return this.successResponse(profile);
 *   }
 * }
 *
 * // Usage in API route
 * export const GET = (context: APIContext) => new GetMyProfileHandler().handle(context);
 * ```
 */

import type { APIContext } from "astro";
import { BaseApiHandler } from "./BaseApiHandler";
import { requireAuth } from "../middleware/authentication";
import type { AuthenticatedContext } from "../types";

/**
 * Base class for authenticated API handlers
 * Extends BaseApiHandler with automatic authentication
 */
export abstract class AuthenticatedHandler extends BaseApiHandler {
  /**
   * Store authenticated context for use in subclasses
   */
  protected authContext?: AuthenticatedContext;

  /**
   * Override authenticate to require authentication
   * Stores authenticated context for use in execute method
   */
  protected async authenticate(context: APIContext): Promise<Response | null> {
    const authResult = requireAuth(context);

    if (!authResult.success) {
      return authResult.error;
    }

    // Store authenticated context
    this.authContext = authResult.data;
    return null;
  }

  /**
   * Override execute to call executeAuthenticated with AuthenticatedContext
   * This ensures subclasses always have access to authenticated user
   */
  protected async execute(_context: APIContext): Promise<Response> {
    if (!this.authContext) {
      // This should never happen if authenticate() is called first
      throw new Error("Authentication context not available");
    }

    return this.executeAuthenticated(this.authContext);
  }

  /**
   * Main execution logic with authenticated context
   * Must be implemented by subclasses
   * Guaranteed to have authenticated user available
   */
  protected abstract executeAuthenticated(context: AuthenticatedContext): Promise<Response>;

  /**
   * Helper to get current user ID
   */
  protected getUserId(): string {
    if (!this.authContext) {
      throw new Error("Authentication context not available");
    }
    return this.authContext.user.id;
  }

  /**
   * Helper to get current user
   */
  protected getUser() {
    if (!this.authContext) {
      throw new Error("Authentication context not available");
    }
    return this.authContext.user;
  }

  /**
   * Helper to get Supabase client
   */
  protected getSupabase() {
    if (!this.authContext) {
      throw new Error("Authentication context not available");
    }
    return this.authContext.supabase;
  }
}
