# Testing Documentation

Kompleksowa dokumentacja dotycząca testowania w projekcie 10x Cards.

## 📋 Spis treści

- [Struktura testów](#struktura-testów)
- [Testy jednostkowe (Unit Tests)](#testy-jednostkowe-unit-tests)
- [Testy E2E (End-to-End)](#testy-e2e-end-to-end)
- [Uruchamianie testów](#uruchamianie-testów)
- [Best Practices](#best-practices)

## 🗂️ Struktura testów

```
tests/
├── unit/                    # Testy jednostkowe
│   ├── components/         # Testy komponentów React
│   └── lib/               # Testy funkcji pomocniczych
├── e2e/                    # Testy end-to-end
│   ├── pages/             # Page Object Models
│   └── *.spec.ts          # Specyfikacje testów E2E
├── mocks/                  # Mock Service Worker handlers
│   ├── handlers.ts        # Definicje mock handlers
│   ├── server.ts          # MSW server (Node.js)
│   └── browser.ts         # MSW worker (przeglądarka)
├── fixtures/               # Dane testowe
│   ├── users.ts           # Fixtures dla użytkowników
│   └── flashcards.ts      # Fixtures dla fiszek
├── setup/                  # Pliki konfiguracyjne testów
│   └── vitest.setup.ts    # Setup dla Vitest
└── utils/                  # Narzędzia testowe
    └── test-utils.tsx     # Custom render i helpers
```

## 🧪 Testy jednostkowe (Unit Tests)

### Framework: Vitest + React Testing Library

Testy jednostkowe służą do testowania izolowanych jednostek kodu (funkcji, komponentów) bez zależności zewnętrznych.

### Przykład testu komponentu

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);

    const element = screen.getByRole('button');
    expect(element).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Przykład testu funkcji

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/myFunction";

describe("myFunction", () => {
  it("should return correct value", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });

  it("should handle edge cases", () => {
    expect(myFunction(null)).toBeUndefined();
    expect(myFunction("")).toBe("");
  });
});
```

### Mockowanie API z MSW

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';

describe('Component with API calls', () => {
  it('should fetch and display data', async () => {
    // Override default handler
    server.use(
      http.get('/api/data', () => {
        return HttpResponse.json({ data: 'test' });
      })
    );

    render(<ComponentWithAPI />);

    // Wait for data to load
    const element = await screen.findByText('test');
    expect(element).toBeInTheDocument();
  });
});
```

## 🌐 Testy E2E (End-to-End)

### Framework: Playwright

Testy E2E testują całą aplikację od początku do końca, symulując rzeczywiste interakcje użytkownika.

### Page Object Model (POM)

Używamy wzorca Page Object Model dla lepszej organizacji testów:

```typescript
// tests/e2e/pages/HomePage.ts
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class HomePage extends BasePage {
  readonly loginButton: Locator;

  constructor(page: Page) {
    super(page);
    this.loginButton = page.getByRole("button", { name: /login/i });
  }

  async goto() {
    await super.goto("/");
  }

  async clickLogin() {
    await this.loginButton.click();
  }
}
```

### Przykład testu E2E

```typescript
import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/HomePage";

test.describe("User Flow", () => {
  test("should complete login flow", async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(page).toHaveTitle(/10x Cards/);
    await homePage.clickLogin();

    await expect(page).toHaveURL(/\/app\/login/);
  });
});
```

### Visual Testing

```typescript
test("should match screenshot", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png");
});
```

## 🚀 Uruchamianie testów

### Testy jednostkowe

```bash
# Uruchom wszystkie testy jednostkowe
npm test

# Uruchom w trybie watch
npm run test:watch

# Uruchom z interfejsem UI
npm run test:ui

# Wygeneruj raport pokrycia kodu
npm run test:coverage
```

### Testy E2E

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z interfejsem UI
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug

# Pokaż raport z ostatniego uruchomienia
npm run test:e2e:report
```

## ✅ Best Practices

### Testy jednostkowe

1. **Testuj zachowanie, nie implementację**

   ```typescript
   // ❌ Źle - testowanie implementacji
   expect(component.state.count).toBe(1);

   // ✅ Dobrze - testowanie zachowania
   expect(screen.getByText("Count: 1")).toBeInTheDocument();
   ```

2. **Używaj pattern AAA (Arrange, Act, Assert)**

   ```typescript
   it('should increment counter', () => {
     // Arrange
     render(<Counter />);

     // Act
     const button = screen.getByRole('button');
     button.click();

     // Assert
     expect(screen.getByText('1')).toBeInTheDocument();
   });
   ```

3. **Mockuj zależności zewnętrzne**

   ```typescript
   vi.mock("@/lib/api", () => ({
     fetchData: vi.fn(() => Promise.resolve({ data: "test" })),
   }));
   ```

4. **Używaj semantic queries**
   - Preferuj: `getByRole`, `getByLabelText`, `getByText`
   - Unikaj: `getByTestId` (tylko gdy nie ma innej opcji)

### Testy E2E

1. **Izoluj testy**
   - Każdy test powinien być niezależny
   - Używaj `beforeEach` do przygotowania stanu

2. **Używaj Page Object Model**
   - Enkapsuluj logikę strony
   - Ułatwia utrzymanie testów

3. **Czekaj na elementy prawidłowo**

   ```typescript
   // ❌ Źle
   await page.waitForTimeout(1000);

   // ✅ Dobrze
   await expect(page.getByText("Loaded")).toBeVisible();
   ```

4. **Testuj krytyczne ścieżki użytkownika**
   - Logowanie/rejestracja
   - Główne funkcjonalności
   - Płatności i formularze

### Ogólne

1. **Nazywaj testy opisowo**

   ```typescript
   // ❌ Źle
   it("test 1", () => {});

   // ✅ Dobrze
   it("should display error message when email is invalid", () => {});
   ```

2. **Jeden koncept na test**
   - Test powinien sprawdzać jedną rzecz
   - Łatwiejsze debugowanie

3. **Utrzymuj testy aktualne**
   - Aktualizuj wraz ze zmianami w kodzie
   - Nie ignoruj broken tests

4. **Cel: 80% pokrycia kodu**
   - Skup się na krytycznym kodzie
   - Jakość ważniejsza niż ilość

## 🔧 Konfiguracja

### vitest.config.ts

Konfiguracja Vitest z ustawieniami dla React, coverage, i środowiska jsdom.

### playwright.config.ts

Konfiguracja Playwright z ustawieniami dla przeglądarki Chromium, raportów, i lokalnego serwera deweloperskiego.

## 📚 Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
