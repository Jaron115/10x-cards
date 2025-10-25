import { chromium, type FullConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, "../../.auth/user.json");

/**
 * Global setup - login once and save authentication state
 * This runs before all tests and creates a reusable auth state
 */
async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || "http://localhost:4321";
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing E2E_USERNAME or E2E_PASSWORD in .env.test");
  }

  // eslint-disable-next-line no-console
  console.log("🔐 Setting up authentication...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to login page
    await page.goto(baseURL);

    // Wait for login form
    await page.waitForSelector('[data-testid="login-form"]', { state: "visible", timeout: 10000 });

    // Fill in credentials
    await page.fill('[data-testid="login-email-input"]', email);
    await page.fill('[data-testid="login-password-input"]', password);

    // Wait a bit for validation
    await page.waitForTimeout(1000);

    // Submit form directly (bypasses button validation)
    await page.evaluate(() => {
      const form = document.querySelector('[data-testid="login-form"]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    });

    // Wait for successful navigation
    await page.waitForURL(/\/app/, { timeout: 10000 });

    // Verify we're logged in
    await page.waitForSelector('[data-testid="sidebar"]', { state: "visible", timeout: 5000 });

    // Save authentication state
    await page.context().storageState({ path: authFile });

    // eslint-disable-next-line no-console
    console.log("✅ Authentication state saved to", authFile);
  } finally {
    await page.close();
    await browser.close();
  }
}

export default globalSetup;
