import type { Page } from "@playwright/test";

/**
 * Helper functions for E2E tests
 */

/**
 * Get test user credentials from environment variables
 */
export function getTestUser() {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  const userId = process.env.E2E_USERNAME_ID;

  if (!email || !password || !userId) {
    throw new Error(
      "Missing E2E test user credentials in .env.test. Required: E2E_USERNAME, E2E_PASSWORD, E2E_USERNAME_ID"
    );
  }

  return { email, password, userId };
}

/**
 * Wait for element to be visible and stable
 */
export async function waitForStableElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: "visible", timeout });
  // Wait a bit for any animations to complete
  await page.waitForTimeout(100);
}

/**
 * Type text with realistic delay (simulates human typing)
 */
export async function typeWithDelay(page: Page, selector: string, text: string, delay = 50) {
  const element = page.locator(selector);
  await element.click();
  await element.fill(""); // Clear first
  await element.type(text, { delay });
}

/**
 * Generate a long text for testing (with specified character count)
 */
export function generateTestText(characterCount: number): string {
  const baseText =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";

  const repetitions = Math.ceil(characterCount / baseText.length);
  const fullText = baseText.repeat(repetitions);

  return fullText.substring(0, characterCount);
}

/**
 * Wait for toast notification and get its text
 */
export async function waitForToast(page: Page, timeout = 5000): Promise<string> {
  // Sonner toasts typically have role="status" or similar
  const toast = page.locator("[data-sonner-toast]").first();
  await toast.waitFor({ state: "visible", timeout });
  return (await toast.textContent()) || "";
}

/**
 * Check if user is logged in by checking for auth-related UI elements
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    // Check if we can see the sidebar or other authenticated UI elements
    await page.waitForSelector('[data-testid="sidebar"]', { state: "visible", timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
