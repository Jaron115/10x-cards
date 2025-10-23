import type { AstroGlobal } from "astro";
import type { User } from "@supabase/supabase-js";

/**
 * Guard for protected routes that require authentication
 * Checks if user is authenticated and redirects to login page if not
 * @param Astro Astro global object
 * @returns User object if authenticated, or never returns (redirects)
 */
export function requireAuth(Astro: AstroGlobal): User {
  const user = Astro.locals.user;

  if (!user) {
    throw Astro.redirect("/");
  }

  return user;
}

/**
 * Guard for public routes (login/register pages)
 * Redirects to app if user is already authenticated
 * @param Astro Astro global object
 */
export function requireGuest(Astro: AstroGlobal): void {
  const user = Astro.locals.user;

  if (user) {
    throw Astro.redirect("/app/generator");
  }
}
