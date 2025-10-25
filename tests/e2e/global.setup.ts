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
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login via API endpoint (more stable than UI)
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password,
      },
    });

    if (!loginResponse.ok()) {
      throw new Error(`Login failed with status ${loginResponse.status()}`);
    }

    // Navigate to app to verify login worked
    await page.goto(`${baseURL}/app/generator`);

    // Wait for authenticated page to load
    await page.waitForSelector('[data-testid="sidebar"]', { state: "visible", timeout: 10000 });

    // Save authentication state
    await context.storageState({ path: authFile });

    // eslint-disable-next-line no-console
    console.log("✅ Authentication state saved to", authFile);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("❌ Authentication failed:", error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
