import type { APIContext } from "astro";
import { LoginHandler } from "@/lib/api-handlers/auth/LoginHandler";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates user and creates session
 * Sets HTTPOnly cookies with access and refresh tokens
 */
export const POST = (context: APIContext) => new LoginHandler().handle(context);
