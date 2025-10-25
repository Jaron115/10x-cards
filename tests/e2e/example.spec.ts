/**
 * Example E2E test
 * This is a template showing how to structure Playwright tests
 */

import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

test.describe("Example Test Suite", () => {
  test("should load homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/10x Cards|Flashcards/i);
  });

  test("should navigate to login page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify we're on the login page
    await expect(page).toHaveURL(/\/app\/login/);
    await expect(loginPage.loginButton).toBeVisible();
  });
});
