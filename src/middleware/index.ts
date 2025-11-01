/**
 * Astro middleware
 * Handles authentication by:
 * 1. Creating authenticated Supabase client with JWT token
 * 2. Validating session from HTTPOnly cookies
 * 3. Automatically refreshing expired tokens
 * 4. Setting sessionExpired flag when refresh token expires
 */

import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";
import { supabaseClient } from "../db/supabase.client.ts";
import type { Database } from "../db/database.types.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Get session tokens from cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // 2. If no access token, use unauthenticated client
  if (!accessToken) {
    context.locals.supabase = supabaseClient;
    context.locals.user = null;
    return next();
  }

  // 3. Verify and get user from access token
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser(accessToken);

  // 4. If token is valid, create authenticated client and inject user
  if (!error && user) {
    // Create authenticated Supabase client with JWT token
    context.locals.supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    context.locals.user = user;
    return next();
  }

  // 5. If access token is expired, try to refresh using refresh token
  if (error && refreshToken) {
    const { data, error: refreshError } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (!refreshError && data.session) {
      // Update cookies with new tokens
      context.cookies.set("sb-access-token", data.session.access_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD, // Built-in Astro variable, keep as is
        sameSite: "lax",
        maxAge: data.session.expires_in,
      });

      context.cookies.set("sb-refresh-token", data.session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD, // Built-in Astro variable, keep as is
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });

      // Create authenticated Supabase client with new JWT token
      context.locals.supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        },
      });
      context.locals.user = data.user;
      return next();
    }

    // 6. Refresh failed - session has expired (refresh token expired after 30 days)
    // Set flag to show "session expired" message on login page
    context.locals.sessionExpired = true;
  }

  // 7. Token invalid and refresh failed - clear cookies and use unauthenticated client
  context.cookies.delete("sb-access-token", { path: "/" });
  context.cookies.delete("sb-refresh-token", { path: "/" });
  context.locals.supabase = supabaseClient;
  context.locals.user = null;

  return next();
});
