// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  env: {
    schema: {
      // Supabase configuration
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "public",
      }),
      SUPABASE_SERVICE_ROLE_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "",
      }),
      // OpenRouter AI configuration
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
        default: "mock-api-key",
      }),
      OPENROUTER_MODEL: envField.string({
        context: "server",
        access: "public",
        default: "openai/gpt-4o-mini",
      }),
      OPENROUTER_TIMEOUT_MS: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "60000",
      }),
      OPENROUTER_USE_MOCK: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "false",
      }),
    },
    validateSecrets: true,
  },
});
