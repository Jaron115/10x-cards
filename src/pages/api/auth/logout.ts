import type { APIContext } from "astro";
import { LogoutHandler } from "@/lib/api-handlers/auth/LogoutHandler";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out user and clears session cookies
 */
export const POST = (context: APIContext) => new LogoutHandler().handle(context);
