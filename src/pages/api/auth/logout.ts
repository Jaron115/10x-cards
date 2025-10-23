import type { APIContext } from "astro";
import type { LogoutResponseDTO } from "@/types";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Logs out user and clears session cookies
 */
export async function POST({ locals, cookies }: APIContext): Promise<Response> {
  const supabase = locals.supabase;

  // 1. Get access token from cookie
  const accessToken = cookies.get("sb-access-token")?.value;

  // 2. Call Supabase Auth signOut (if we have a token)
  if (accessToken) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("[AUTH] Logout error:", {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      // Continue anyway - we'll clear cookies regardless
    }
  }

  // 3. Delete session cookies
  cookies.delete("sb-access-token", { path: "/" });
  cookies.delete("sb-refresh-token", { path: "/" });

  // 4. Success response
  const response: LogoutResponseDTO = {
    success: true,
    message: "Zostałeś wylogowany",
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
