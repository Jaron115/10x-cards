import { test as base, type Page } from "@playwright/test";
import { getTestUser } from "../utils/test-helpers";

/**
 * Auth fixture that provides authenticated user context
 */

export type AuthFixtures = {
  authenticatedPage: Page;
};

/**
 * Login helper function
 */
export async function loginUser(page: Page) {
  const { email, password } = getTestUser();

  // Navigate to home page (should redirect to login if not authenticated)
  await page.goto("/");

  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { state: "visible", timeout: 10000 });

  // Fill in login credentials
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);

  // Submit the form
  await page.click('[data-testid="login-submit-button"]');

  // Wait for successful navigation to app
  await page.waitForURL(/\/app/, { timeout: 10000 });

  // Verify we're logged in by checking for sidebar
  await page.waitForSelector('[data-testid="sidebar"]', { state: "visible", timeout: 5000 });
}

/**
 * Logout helper function
 */
export async function logoutUser(page: Page) {
  // Click logout button
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to home/login page
  await page.waitForURL(/^\/$/, { timeout: 5000 });
}

/**
 * Extended test with authenticated page fixture
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Login before the test
    await loginUser(page);

    // Provide the authenticated page to the test
    await use(page);

    // Teardown: Logout after the test (optional, helps clean up)
    try {
      await logoutUser(page);
    } catch (error) {
      // Ignore logout errors (e.g., if already logged out)
      console.warn("Logout failed during teardown:", error);
    }
  },
});

export { expect } from "@playwright/test";
