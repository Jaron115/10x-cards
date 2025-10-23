import type { APIContext } from "astro";
import type { ApiResponseDTO, LoginRequest, LoginResponseDTO } from "@/types";
import { createErrorResponse, mapSupabaseAuthError, validateAuthRequestBody } from "@/lib/auth/helpers";

export const prerender = false;

/**
 * POST /api/auth/login
 * Authenticates user and creates session
 * Sets HTTPOnly cookies with access and refresh tokens
 */
export async function POST({ request, locals, cookies }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Parse request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return createErrorResponse(400, "VALIDATION_ERROR", "Invalid JSON");
  }

  // 2. Validate request body
  const validation = validateAuthRequestBody(body);
  if (!validation.isValid) {
    return createErrorResponse(400, "VALIDATION_ERROR", validation.error || "Invalid request body");
  }

  const { email, password } = body as LoginRequest;

  // 3. Call Supabase Auth signInWithPassword
  // Supabase automatically:
  // - Checks if user exists
  // - Verifies password
  // - Creates new session
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // 4. Handle Supabase errors
  if (error) {
    console.error("[AUTH] Login error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    const mappedError = mapSupabaseAuthError(error);
    return createErrorResponse(mappedError.status, mappedError.code, mappedError.message);
  }

  // 5. Check if user and session were created
  if (!data.user || !data.session) {
    console.error("[AUTH] Login succeeded but no user or session returned");
    return createErrorResponse(500, "INTERNAL_ERROR", "Login failed");
  }

  // 6. Set session cookies
  cookies.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: data.session.expires_in,
  });

  cookies.set("sb-refresh-token", data.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // 7. Success response
  const response: ApiResponseDTO<LoginResponseDTO> = {
    success: true,
    data: {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
    },
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
