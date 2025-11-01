import type { APIContext } from "astro";
import { RegisterHandler } from "@/lib/api-handlers/auth/RegisterHandler";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user and automatically logs them in
 * Creates session cookies upon successful registration
 */
export const POST = (context: APIContext) => new RegisterHandler().handle(context);
