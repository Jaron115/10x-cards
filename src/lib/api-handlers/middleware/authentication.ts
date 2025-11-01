/**
 * Authentication Middleware
 *
 * Provides authentication utilities for API handlers.
 * Verifies user authentication and creates authenticated contexts.
 *
 * @example
 * ```ts
 * // In a handler
 * export async function GET(context: APIContext) {
 *   const authResult = requireAuth(context);
 *   if (!authResult.success) {
 *     return authResult.error; // Returns 401 Response
 *   }
 *
 *   const authContext = authResult.data;
 *   // Use authContext.user, authContext.supabase, etc.
 * }
 *
 * // Or use the wrapper
 * export const GET = withAuth(async (authContext) => {
 *   // authContext is guaranteed to have user
 *   return ApiResponseBuilder.success({ user: authContext.user });
 * });
 * ```
 */

import type { APIContext } from "astro";
import type { AuthenticatedContext, Result } from "../types";
import { ApiResponseBuilder } from "../utils/responseBuilder";

/**
 * Check if user is authenticated and return authenticated context
 * Returns a Result type - either success with context or failure with Response
 */
export function requireAuth(context: APIContext): Result<AuthenticatedContext, Response> {
  const { locals, cookies, request, params, url } = context;

  // Check if user exists in locals (set by middleware)
  if (!locals.user) {
    return {
      success: false,
      error: ApiResponseBuilder.unauthorized("Authentication required"),
    };
  }

  // Create authenticated context
  const authContext: AuthenticatedContext = {
    user: locals.user,
    supabase: locals.supabase,
    cookies,
    request,
    params,
    url,
    locals,
  };

  return {
    success: true,
    data: authContext,
  };
}

/**
 * Higher-order function that wraps a handler to require authentication
 * Automatically checks authentication and passes authenticated context to handler
 *
 * @example
 * ```ts
 * export const GET = withAuth(async (authContext) => {
 *   const userId = authContext.user.id;
 *   const data = await fetchUserData(userId);
 *   return ApiResponseBuilder.success(data);
 * });
 * ```
 */
export function withAuth<T = Response>(
  handler: (context: AuthenticatedContext) => Promise<T>
): (context: APIContext) => Promise<T | Response> {
  return async (context: APIContext) => {
    const authResult = requireAuth(context);

    if (!authResult.success) {
      return authResult.error;
    }

    return handler(authResult.data);
  };
}

/**
 * Optional authentication - returns user if authenticated, undefined otherwise
 * Useful for endpoints that work differently for authenticated vs guest users
 */
export function optionalAuth(context: APIContext): AuthenticatedContext | null {
  const { locals, cookies, request, params, url } = context;

  if (!locals.user) {
    return null;
  }

  return {
    user: locals.user,
    supabase: locals.supabase,
    cookies,
    request,
    params,
    url,
    locals,
  };
}
