import type { APIContext } from "astro";
import type { ApiResponseDTO, RegisterRequest, RegisterResponseDTO } from "@/types";
import { createErrorResponse, mapSupabaseAuthError, validateAuthRequestBody } from "@/lib/auth/helpers";

export const prerender = false;

/**
 * POST /api/auth/register
 * Registers a new user and automatically logs them in
 * Creates session cookies upon successful registration
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

  const { email, password } = body as RegisterRequest;

  // 3. Call Supabase Auth signUp
  // Supabase automatically:
  // - Validates email format
  // - Validates password length (min 6 characters)
  // - Checks email uniqueness
  // - Creates session (access_token and refresh_token)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  // 4. Handle Supabase errors
  if (error) {
    console.error("[AUTH] Registration error:", {
      message: error.message,
      status: error.status,
      name: error.name,
    });

    const mappedError = mapSupabaseAuthError(error);
    return createErrorResponse(mappedError.status, mappedError.code, mappedError.message);
  }

  // 5. Check if user and session were created
  if (!data.user || !data.session) {
    console.error("[AUTH] Registration succeeded but no user or session returned");
    return createErrorResponse(500, "INTERNAL_ERROR", "Registration failed");
  }

  // 6. Set session cookies (user is automatically logged in)
  cookies.set("sb-access-token", data.session.access_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD, // Built-in Astro variable, keep as is
    sameSite: "lax",
    maxAge: data.session.expires_in,
  });

  cookies.set("sb-refresh-token", data.session.refresh_token, {
    path: "/",
    httpOnly: true,
    secure: import.meta.env.PROD, // Built-in Astro variable, keep as is
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // 7. Success response
  const response: ApiResponseDTO<RegisterResponseDTO> = {
    success: true,
    data: {
      user: {
        id: data.user.id,
        email: data.user.email || "",
      },
      message: "Konto utworzone pomyślnie. Jesteś teraz zalogowany.",
    },
  };

  return new Response(JSON.stringify(response), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}
