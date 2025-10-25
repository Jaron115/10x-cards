/* eslint-disable react-hooks/rules-of-hooks */
// Playwright fixtures use "use" parameter which triggers false positive from react-hooks eslint
import { test as base, type Page } from "@playwright/test";
import { getTestUser } from "../utils/test-helpers";

/**
 * Auth fixture that provides authenticated user context
 */

export interface AuthFixtures {
  authenticatedPage: Page;
}

/**
 * Login helper function
 */
export async function loginUser(page: Page) {
  const { email, password } = getTestUser();

  // Clear all cookies first
  await page.context().clearCookies();

  // Navigate to home page (should redirect to login if not authenticated)
  await page.goto("/");

  // Clear storage after navigation
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Wait for login form to be visible
  await page.waitForSelector('[data-testid="login-form"]', { state: "visible", timeout: 10000 });

  // Fill in login credentials
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', password);

  // Wait for the submit button to become enabled (validation passes)
  const submitButton = page.locator('[data-testid="login-submit-button"]');
  await submitButton.waitFor({ state: "visible", timeout: 5000 });

  // Wait until button is enabled (not disabled)
  await page.waitForFunction(
    () => {
      const button = document.querySelector('[data-testid="login-submit-button"]');
      return button && !(button as HTMLButtonElement).disabled;
    },
    { timeout: 5000 }
  );

  // Submit the form
  await submitButton.click();

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

  // Wait for redirect to home/login page (more flexible regex)
  await page.waitForURL(/^(http:\/\/localhost:\d+)?\/$/, { timeout: 5000 });
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
      // eslint-disable-next-line no-console
      console.warn("Logout failed during teardown:", error);
    }
  },
});

export { expect } from "@playwright/test";
