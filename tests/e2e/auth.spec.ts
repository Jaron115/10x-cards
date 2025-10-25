import { test, expect } from "@playwright/test";
import { GeneratorPage } from "./pages/GeneratorPage";

test.describe("Autentykacja i nawigacja", () => {
  test("użytkownik powinien być zalogowany i widzieć dashboard", async ({ page }) => {
    // Navigate to app (should already be authenticated via global setup)
    await page.goto("/app/generator");

    // Verify we're on an authenticated page
    await expect(page).toHaveURL(/\/app/);

    // Verify sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

    // Verify navigation items are present
    await expect(page.locator('[data-testid="nav-generator"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-flashcards"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-study"]')).toBeVisible();
  });

  test("użytkownik powinien móc nawigować do generatora", async ({ page }) => {
    // First, navigate to any authenticated page to see the sidebar
    await page.goto("/app/flashcards");

    const generatorPage = new GeneratorPage(page);

    // Navigate to generator via sidebar
    await generatorPage.gotoViaSidebar();

    // Verify we're on the generator page
    await expect(page).toHaveURL(/\/app\/generator/);

    // Verify generator form is visible
    await expect(generatorPage.sourceTextarea).toBeVisible();
    await expect(generatorPage.generateButton).toBeVisible();
    await expect(generatorPage.characterCount).toBeVisible();
  });

  test("przycisk generowania powinien być wyłączony bez tekstu", async ({ page }) => {
    const generatorPage = new GeneratorPage(page);
    await generatorPage.goto();

    // Button should be disabled initially
    await expect(generatorPage.generateButton).toBeDisabled();

    // Fill with too little text (less than 1000 chars)
    await generatorPage.sourceTextarea.fill("Za krótki tekst");

    // Button should still be disabled
    await expect(generatorPage.generateButton).toBeDisabled();
  });
});
