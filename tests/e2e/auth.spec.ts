import { test, expect } from "./fixtures/auth.fixture";
import { GeneratorPage } from "./pages/GeneratorPage";

test.describe("Autentykacja i nawigacja", () => {
  test("użytkownik powinien się zalogować i zobaczyć dashboard", async ({ authenticatedPage }) => {
    // Verify we're on an authenticated page
    await expect(authenticatedPage).toHaveURL(/\/app/);

    // Verify sidebar is visible
    await expect(authenticatedPage.locator('[data-testid="sidebar"]')).toBeVisible();

    // Verify navigation items are present
    await expect(authenticatedPage.locator('[data-testid="nav-generator"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="nav-flashcards"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="nav-study"]')).toBeVisible();
  });

  test("użytkownik powinien móc nawigować do generatora", async ({ authenticatedPage }) => {
    const generatorPage = new GeneratorPage(authenticatedPage);

    // Navigate to generator via sidebar
    await generatorPage.gotoViaSidebar();

    // Verify we're on the generator page
    await expect(authenticatedPage).toHaveURL(/\/app\/generator/);

    // Verify generator form is visible
    await expect(generatorPage.sourceTextarea).toBeVisible();
    await expect(generatorPage.generateButton).toBeVisible();
    await expect(generatorPage.characterCount).toBeVisible();
  });

  test("przycisk generowania powinien być wyłączony bez tekstu", async ({ authenticatedPage }) => {
    const generatorPage = new GeneratorPage(authenticatedPage);
    await generatorPage.goto();

    // Button should be disabled initially
    await expect(generatorPage.generateButton).toBeDisabled();

    // Fill with too little text (less than 1000 chars)
    await generatorPage.sourceTextarea.fill("Za krótki tekst");

    // Button should still be disabled
    await expect(generatorPage.generateButton).toBeDisabled();
  });
});
