/**
 * Cookie Manager Utility
 *
 * Centralized cookie management for authentication sessions.
 * Handles setting and clearing Supabase session cookies with consistent configuration.
 *
 * @example
 * ```ts
 * // Set session cookies after login/register
 * CookieManager.setSessionCookies(cookies, session);
 *
 * // Clear session cookies on logout
 * CookieManager.clearSessionCookies(cookies);
 * ```
 */

import type { AstroCookies } from "astro";
import type { Session } from "@supabase/supabase-js";

/**
 * Cookie configuration constants
 */
const COOKIE_CONFIG = {
  ACCESS_TOKEN_NAME: "sb-access-token",
  REFRESH_TOKEN_NAME: "sb-refresh-token",
  REFRESH_TOKEN_MAX_AGE: 60 * 60 * 24 * 30, // 30 days
  PATH: "/",
  SAME_SITE: "lax" as const,
} as const;

/**
 * Cookie Manager
 * Provides static methods for managing authentication cookies
 */
export const CookieManager = {
  /**
   * Set session cookies after successful authentication
   * Sets both access token and refresh token with appropriate configuration
   *
   * @param cookies - Astro cookies object
   * @param session - Supabase session containing tokens
   * @param isProduction - Whether running in production (for secure flag)
   */
  setSessionCookies(cookies: AstroCookies, session: Session, isProduction: boolean): void {
    // Set access token cookie
    cookies.set(COOKIE_CONFIG.ACCESS_TOKEN_NAME, session.access_token, {
      path: COOKIE_CONFIG.PATH,
      httpOnly: true,
      secure: isProduction,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      maxAge: session.expires_in,
    });

    // Set refresh token cookie
    cookies.set(COOKIE_CONFIG.REFRESH_TOKEN_NAME, session.refresh_token, {
      path: COOKIE_CONFIG.PATH,
      httpOnly: true,
      secure: isProduction,
      sameSite: COOKIE_CONFIG.SAME_SITE,
      maxAge: COOKIE_CONFIG.REFRESH_TOKEN_MAX_AGE,
    });
  },

  /**
   * Clear session cookies on logout or account deletion
   * Removes both access token and refresh token
   *
   * @param cookies - Astro cookies object
   */
  clearSessionCookies(cookies: AstroCookies): void {
    cookies.delete(COOKIE_CONFIG.ACCESS_TOKEN_NAME, { path: COOKIE_CONFIG.PATH });
    cookies.delete(COOKIE_CONFIG.REFRESH_TOKEN_NAME, { path: COOKIE_CONFIG.PATH });
  },

  /**
   * Get access token from cookies
   *
   * @param cookies - Astro cookies object
   * @returns Access token value or undefined if not found
   */
  getAccessToken(cookies: AstroCookies): string | undefined {
    return cookies.get(COOKIE_CONFIG.ACCESS_TOKEN_NAME)?.value;
  },

  /**
   * Get refresh token from cookies
   *
   * @param cookies - Astro cookies object
   * @returns Refresh token value or undefined if not found
   */
  getRefreshToken(cookies: AstroCookies): string | undefined {
    return cookies.get(COOKIE_CONFIG.REFRESH_TOKEN_NAME)?.value;
  },

  /**
   * Check if user has session cookies
   *
   * @param cookies - Astro cookies object
   * @returns True if both access and refresh tokens exist
   */
  hasSessionCookies(cookies: AstroCookies): boolean {
    return !!this.getAccessToken(cookies) && !!this.getRefreshToken(cookies);
  },
} as const;
