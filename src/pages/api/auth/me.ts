import type { APIContext } from "astro";
import type { ApiResponseDTO, GetCurrentUserResponseDTO } from "@/types";
import { createErrorResponse } from "@/lib/auth/helpers";

export const prerender = false;

/**
 * GET /api/auth/me
 * Returns current authenticated user data
 * Used by Zustand store to fetch user data on app load
 */
export async function GET({ locals }: APIContext): Promise<Response> {
  const user = locals.user;

  // 1. Check if user is authenticated
  if (!user) {
    return createErrorResponse(401, "UNAUTHORIZED", "Authentication required");
  }

  // 2. Return user data
  const response: ApiResponseDTO<GetCurrentUserResponseDTO> = {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email || "",
      },
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
