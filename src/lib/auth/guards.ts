import type { AstroGlobal } from "astro";
import type { User } from "@supabase/supabase-js";

/**
 * Guard for protected routes that require authentication
 * Checks if user is authenticated and redirects to login page if not
 * @param Astro Astro global object
 * @returns User object if authenticated, or returns Response redirect
 */
export function requireAuth(Astro: AstroGlobal): User | Response {
  const user = Astro.locals.user;

  if (!user) {
    return Astro.redirect("/");
  }

  return user;
}

/**
 * Guard for public routes (login/register pages)
 * Redirects to app if user is already authenticated
 * @param Astro Astro global object
 * @returns undefined if guest, or returns Response redirect if authenticated
 */
export function requireGuest(Astro: AstroGlobal): undefined | Response {
  const user = Astro.locals.user;

  if (user) {
    return Astro.redirect("/app/generator");
  }

  return undefined;
}
