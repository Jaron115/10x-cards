import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment configuration
    environment: "happy-dom",
    globals: true,

    // Setup files
    setupFiles: ["./tests/setup/vitest.setup.ts"],

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "dist/",
        "tests/",
        "**/*.config.{js,ts,mjs}",
        "**/*.d.ts",
        "**/types.ts",
        "src/db/database.types.ts",
        "src/env.d.ts",
        ".astro/",
      ],
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Test patterns
    include: ["tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".astro"],

    // Timeout
    testTimeout: 10000,

    // Reporter
    reporters: ["default"],
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
