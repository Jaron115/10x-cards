/**
 * Core types for API handlers
 *
 * This file contains fundamental types used across all API handlers:
 * - Result pattern for functional error handling
 * - Context types for authenticated requests
 * - Validated request types
 */

import type { APIContext } from "astro";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Result type for functional error handling
 * Represents either a successful result with data or a failure with an error
 *
 * @example
 * ```ts
 * const result: Result<User, Error> = await getUser(id);
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Authenticated context passed to handlers that require authentication
 * Contains verified user and supabase client
 */
export interface AuthenticatedContext {
  user: User;
  supabase: SupabaseClient;
  cookies: APIContext["cookies"];
  request: APIContext["request"];
  params: APIContext["params"];
  url: APIContext["url"];
  locals: APIContext["locals"];
}

/**
 * Validated request with parsed and validated data
 */
export interface ValidatedRequest<T> {
  data: T;
  context: APIContext | AuthenticatedContext;
}

/**
 * Handler execution result
 * Can be either a Response or a Result type
 */
export type HandlerResult<T> = Promise<Response | Result<T, Error>>;

/**
 * Generic handler function type
 */
export type Handler<TContext = APIContext> = (context: TContext) => Promise<Response>;

/**
 * Validation result from middleware
 */
export type ValidationResult<T> = Result<T, ValidationError>;

/**
 * Custom validation error with field details
 */
export interface ValidationError {
  message: string;
  fields?: {
    field: string;
    message: string;
  }[];
}
