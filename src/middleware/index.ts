/**
 * Astro middleware
 * Injects Supabase client into context.locals for all routes
 *
 * TODO: Add JWT authentication when needed:
 * 1. Extract Bearer token from Authorization header
 * 2. Validate token using supabase.auth.getUser()
 * 3. Inject user into context.locals
 * 4. Return 401 for protected routes without valid token
 */

import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware((context, next) => {
  // Inject Supabase client into context for all routes
  context.locals.supabase = supabaseClient;

  // Continue to the next middleware or route handler
  return next();
});
