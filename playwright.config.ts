import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from appropriate .env file
if (!process.env.CI) {
  // Local development - use .env.test
  dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
} else {
  // CI environment - load .env file created by GitHub Actions
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

/**
 * Playwright configuration for E2E testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Global setup - run once before all tests
  globalSetup: "./tests/e2e/global.setup.ts",

  // Test directory
  testDir: "./tests/e2e",

  // Maximum time one test can run
  timeout: 30 * 1000,

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Number of workers (parallel test execution)
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:4321",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot only when test fails
    screenshot: "only-on-failure",

    // Capture video on first retry
    video: "retain-on-failure",

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,

    // Use saved authentication state from global setup
    storageState: ".auth/user.json",
  },

  // Configure projects for major browsers (only Chromium as per requirements)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run local dev server before starting tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Explicitly pass environment variables to the dev server
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL || "",
      SUPABASE_KEY: process.env.SUPABASE_KEY || "",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",
      OPENROUTER_USE_MOCK: process.env.OPENROUTER_USE_MOCK || "false",
      CI: process.env.CI || "false",
    },
  },

  // Output directory for test artifacts
  outputDir: "test-results/",
});
