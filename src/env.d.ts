/// <reference types="astro/client" />

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: User | null;
      sessionExpired?: boolean;
    }
  }
}

// Environment variables are now managed via astro:env API
// See astro.config.mjs for the schema definition
// Import from "astro:env/server" or "astro:env/client" as needed
