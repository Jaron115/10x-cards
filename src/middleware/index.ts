/**
 * Astro middleware
 * Handles authentication by:
 * 1. Injecting Supabase client into context.locals
 * 2. Validating session from HTTPOnly cookies
 * 3. Automatically refreshing expired tokens
 * 4. Setting sessionExpired flag when refresh token expires
 */

import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Inject Supabase client into context for all routes
  context.locals.supabase = supabaseClient;

  // 2. Get session tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // 3. If no access token, user is not authenticated
  if (!accessToken) {
    context.locals.user = null;
    return next();
  }

  // 4. Verify and get user from access token
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(accessToken);

  // 5. If token is valid, inject user into context
  if (!error && user) {
    context.locals.user = user;
    return next();
  }

  // 6. If access token is expired, try to refresh using refresh token
  if (error && refreshToken) {
    const { data, error: refreshError } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!refreshError && data.session) {
      // Update cookies with new tokens
      context.cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: data.session.expires_in,
      });

      context.cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Inject user into context
      context.locals.user = data.user;
      return next();
    }

    // 7. Refresh failed - session has expired (refresh token expired after 30 days)
    // Set flag to show "session expired" message on login page
    context.locals.sessionExpired = true;
  }

  // 8. Token invalid and refresh failed - clear cookies
  context.cookies.delete("sb-access-token", { path: "/" });
  context.cookies.delete("sb-refresh-token", { path: "/" });
  context.locals.user = null;

  return next();
});
