import { test, expect } from "@playwright/test";

/**
 * Test weryfikujący że zmienne środowiskowe z .env.test są załadowane
 */
test.describe("Konfiguracja środowiska E2E", () => {
  test("powinien załadować zmienne środowiskowe z .env.test", () => {
    // Sprawdź czy zmienne z .env.test są dostępne
    expect(process.env.E2E_USERNAME).toBeDefined();
    expect(process.env.E2E_PASSWORD).toBeDefined();
    expect(process.env.E2E_USERNAME_ID).toBeDefined();
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_KEY).toBeDefined();

    // Opcjonalnie wyświetl wartości (bez haseł) dla debugowania
    console.log("✅ E2E_USERNAME:", process.env.E2E_USERNAME);
    console.log("✅ E2E_USERNAME_ID:", process.env.E2E_USERNAME_ID);
    console.log("✅ SUPABASE_URL:", process.env.SUPABASE_URL);
  });

  test("powinien mieć dostęp do baseURL", async ({ page }) => {
    // Test że możemy nawigować do aplikacji
    await page.goto("/");
    await expect(page).toHaveURL(/.*localhost:4321.*/);
  });
});
