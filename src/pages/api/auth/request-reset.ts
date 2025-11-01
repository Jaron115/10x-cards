import type { APIContext } from "astro";
import { RequestPasswordResetHandler } from "@/lib/api-handlers/auth/RequestPasswordResetHandler";

export const prerender = false;

/**
 * POST /api/auth/request-reset
 * Sends password reset email to the user
 * Uses Supabase Auth resetPasswordForEmail method
 */
export const POST = (context: APIContext) => new RequestPasswordResetHandler().handle(context);
