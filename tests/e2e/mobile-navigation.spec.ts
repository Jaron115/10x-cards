import { test, expect } from "@playwright/test";

test.describe("Mobilna nawigacja", () => {
  test("hamburger menu powinno być widoczne na urządzeniach mobilnych", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Navigate to app
    await page.goto("/app/generator");

    // Verify mobile menu trigger is visible
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(mobileMenuTrigger).toBeVisible();

    // Verify desktop sidebar is hidden on mobile
    const desktopSidebar = page.locator('[data-testid="sidebar"]');
    await expect(desktopSidebar).not.toBeVisible();
  });

  test("użytkownik powinien móc otworzyć mobilne menu", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/app/generator");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Click hamburger menu
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await mobileMenuTrigger.click();

    // Wait for sheet animation to complete
    await page.waitForTimeout(500);

    // Verify sheet is open and navigation is visible
    await expect(page.locator('[data-testid="mobile-nav-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav-items"]')).toBeVisible();

    // Verify all navigation items are present within mobile nav
    const mobileNav = page.locator('[data-testid="mobile-nav-items"]');
    await expect(mobileNav.locator('[data-testid="nav-generator"]')).toBeVisible();
    await expect(mobileNav.locator('[data-testid="nav-flashcards"]')).toBeVisible();
    await expect(mobileNav.locator('[data-testid="nav-new"]')).toBeVisible();
    await expect(mobileNav.locator('[data-testid="nav-study"]')).toBeVisible();
    await expect(mobileNav.locator('[data-testid="nav-account"]')).toBeVisible();

    // Verify logout button is visible
    await expect(page.locator('[data-testid="mobile-logout-button"]')).toBeVisible();
  });

  test("użytkownik powinien móc nawigować przez mobilne menu", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/app/generator");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Open mobile menu
    await page.locator('[data-testid="mobile-menu-trigger"]').click();

    // Wait for sheet animation
    await page.waitForTimeout(500);

    // Click on "Moje fiszki" in mobile nav (scope to mobile nav to avoid duplicate)
    const mobileNav = page.locator('[data-testid="mobile-nav-items"]');
    await mobileNav.locator('[data-testid="nav-flashcards"]').click();

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/app\/flashcards/);
  });

  test("mobilne menu powinno zamknąć się po kliknięciu overlay", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/app/generator");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Open mobile menu
    await page.locator('[data-testid="mobile-menu-trigger"]').click();

    // Wait for sheet animation
    await page.waitForTimeout(500);

    // Verify sheet is open
    await expect(page.locator('[data-testid="mobile-nav-header"]')).toBeVisible();

    // Click overlay (outside the sheet)
    await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: 350, y: 300 } });

    // Wait for close animation
    await page.waitForTimeout(500);

    // Verify sheet is closed
    await expect(page.locator('[data-testid="mobile-nav-header"]')).not.toBeVisible();
  });

  test("desktop sidebar powinien być widoczny na dużych ekranach", async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.goto("/app/generator");

    // Verify desktop sidebar is visible
    const desktopSidebar = page.locator('[data-testid="sidebar"]');
    await expect(desktopSidebar).toBeVisible();

    // Verify mobile menu trigger is NOT visible on desktop
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(mobileMenuTrigger).not.toBeVisible();
  });

  test("mobilne menu powinno być dostępne dla czytników ekranu", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/app/generator");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check aria-label on mobile menu trigger
    const mobileMenuTrigger = page.locator('[data-testid="mobile-menu-trigger"]');
    await expect(mobileMenuTrigger).toHaveAttribute("aria-label", "Otwórz menu nawigacji");

    // Open mobile menu
    await mobileMenuTrigger.click();

    // Wait for sheet animation
    await page.waitForTimeout(500);

    // Verify navigation items have proper aria-current when active (scope to mobile nav)
    const mobileNav = page.locator('[data-testid="mobile-nav-items"]');
    const activeNavItem = mobileNav.locator('[data-testid="nav-generator"]');
    await expect(activeNavItem).toHaveAttribute("aria-current", "page");
  });

  test("mobilne menu powinno wyświetlać email użytkownika", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/app/generator");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Open mobile menu
    await page.locator('[data-testid="mobile-menu-trigger"]').click();

    // Wait for sheet animation
    await page.waitForTimeout(500);

    // Verify user email is displayed in header
    const header = page.locator('[data-testid="mobile-nav-header"]');
    await expect(header).toBeVisible();

    // Check if email is present (it should be from global auth setup)
    const emailText = header.locator("p.text-xs.text-muted-foreground");
    await expect(emailText).toBeVisible();
  });
});
