import { createClient } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Debug logging - always log in production to diagnose issues
console.log("[SUPABASE CLIENT] Initializing...");
console.log(
  `  SUPABASE_URL: ${supabaseUrl ? `${supabaseUrl.substring(0, 20)}... (${supabaseUrl.length} chars)` : "❌ MISSING"}`
);
console.log(
  `  SUPABASE_KEY: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}... (${supabaseAnonKey.length} chars)` : "❌ MISSING"}`
);

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg =
    `Missing required environment variables:\n` +
    `SUPABASE_URL: ${supabaseUrl ? "✓" : "✗ MISSING"}\n` +
    `SUPABASE_KEY: ${supabaseAnonKey ? "✓" : "✗ MISSING"}\n` +
    `Make sure these are set in Cloudflare Pages Dashboard under Settings → Environment variables`;
  console.error("[SUPABASE CLIENT] ERROR:", errorMsg);
  throw new Error(errorMsg);
}

console.log("[SUPABASE CLIENT] ✓ Environment variables found, creating client...");

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "d0a3904e-ab79-4d01-837d-63036c4213b4";
