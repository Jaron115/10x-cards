import type { APIContext } from "astro";
import { GetCurrentUserHandler } from "@/lib/api-handlers/auth/GetCurrentUserHandler";

export const prerender = false;

/**
 * GET /api/auth/me
 * Returns current authenticated user data
 * Used by Zustand store to fetch user data on app load
 */
export const GET = (context: APIContext) => new GetCurrentUserHandler().handle(context);
