import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "astro:env/server";
import type { Database } from "./database.types.ts";

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is required");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
}

/**
 * Supabase Admin Client
 * WARNING: This client bypasses RLS policies. Use only for admin operations like deleting users.
 * Should NOT be exposed to client-side code.
 */
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export type SupabaseAdminClient = typeof supabaseAdmin;
