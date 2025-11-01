import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

import type { Database } from "../db/database.types.ts";

// Debug logging - always log in production to diagnose issues
console.log("[SUPABASE CLIENT] Initializing...");
console.log(
  `  SUPABASE_URL: ${SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}... (${SUPABASE_URL.length} chars)` : "❌ MISSING"}`
);
console.log(
  `  SUPABASE_KEY: ${SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 10)}... (${SUPABASE_KEY.length} chars)` : "❌ MISSING"}`
);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  const errorMsg =
    `Missing required environment variables:\n` +
    `SUPABASE_URL: ${SUPABASE_URL ? "✓" : "✗ MISSING"}\n` +
    `SUPABASE_KEY: ${SUPABASE_KEY ? "✓" : "✗ MISSING"}\n` +
    `Make sure these are set in Cloudflare Pages Dashboard under Settings → Environment variables`;
  console.error("[SUPABASE CLIENT] ERROR:", errorMsg);
  throw new Error(errorMsg);
}

console.log("[SUPABASE CLIENT] ✓ Environment variables found, creating client...");

export const supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "d0a3904e-ab79-4d01-837d-63036c4213b4";
