# Quick Start Guide - Testing

Szybki przewodnik po uruchomieniu i pisaniu testów w projekcie 10x Cards.

## 🚀 Pierwsze kroki

### 1. Sprawdź instalację

Wszystkie zależności powinny być już zainstalowane. Jeśli nie, uruchom:

```bash
npm install
```

### 2. Uruchom przykładowe testy

```bash
# Testy jednostkowe
npm test

# Testy E2E (wymaga uruchomionego serwera deweloperskiego)
npm run test:e2e
```

## 📝 Napisz swój pierwszy test jednostkowy

### Krok 1: Stwórz plik testowy

Utwórz plik w katalogu `tests/unit/` z rozszerzeniem `.test.ts` lub `.test.tsx`:

```bash
tests/unit/lib/myFunction.test.ts
```

### Krok 2: Napisz test

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/myFunction";

describe("myFunction", () => {
  it("should return correct value", () => {
    const result = myFunction("input");
    expect(result).toBe("expected output");
  });
});
```

### Krok 3: Uruchom test

```bash
npm test
```

## 🧩 Napisz test komponentu React

### Krok 1: Stwórz plik testowy

```bash
tests/unit/components/MyComponent.test.tsx
```

### Krok 2: Napisz test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../../utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render text', () => {
    render(<MyComponent text="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle button click', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);

    const button = screen.getByRole('button');
    button.click();

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Krok 3: Uruchom w trybie watch

```bash
npm run test:watch
```

Testy będą automatycznie uruchamiane przy każdej zmianie!

## 🌐 Napisz swój pierwszy test E2E

### Krok 1: Stwórz Page Object

```bash
tests/e2e/pages/MyPage.ts
```

```typescript
import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class MyPage extends BasePage {
  readonly heading: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", { level: 1 });
  }

  async goto() {
    await super.goto("/my-page");
  }
}
```

### Krok 2: Napisz test

```bash
tests/e2e/myFeature.spec.ts
```

```typescript
import { test, expect } from "@playwright/test";
import { MyPage } from "./pages/MyPage";

test.describe("My Feature", () => {
  test("should display heading", async ({ page }) => {
    const myPage = new MyPage(page);
    await myPage.goto();

    await expect(myPage.heading).toBeVisible();
    await expect(myPage.heading).toHaveText("Welcome");
  });
});
```

### Krok 3: Uruchom test

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom z UI (zalecane dla debugowania)
npm run test:e2e:ui

# Uruchom w trybie debug
npm run test:e2e:debug
```

## 🎯 Przydatne komendy

### Testy jednostkowe

```bash
# Uruchom wszystkie testy
npm test

# Tryb watch (automatyczne uruchamianie)
npm run test:watch

# UI mode (interaktywny interfejs)
npm run test:ui

# Raport pokrycia kodu
npm run test:coverage

# Uruchom konkretny plik
npm test tests/unit/lib/myFunction.test.ts

# Uruchom testy pasujące do wzorca
npm test -- myFunction
```

### Testy E2E

```bash
# Uruchom wszystkie testy
npm run test:e2e

# UI mode (zalecane)
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Pokaż ostatni raport
npm run test:e2e:report

# Uruchom konkretny plik
npm run test:e2e tests/e2e/login.spec.ts

# Uruchom w trybie headed (z widoczną przeglądarką)
npx playwright test --headed

# Uruchom na konkretnej przeglądarce
npx playwright test --project=chromium
```

## 🔍 Debug testów

### Vitest - Testy jednostkowe

1. **Użyj console.log**

   ```typescript
   it("should work", () => {
     console.log("Debug info:", value);
     expect(value).toBe(expected);
   });
   ```

2. **Użyj debugger**

   ```typescript
   it("should work", () => {
     debugger; // Zatrzyma się tutaj w VS Code
     expect(value).toBe(expected);
   });
   ```

3. **Uruchom w VS Code Debug mode**
   - Ustaw breakpoint
   - F5 lub Run > Start Debugging

### Playwright - Testy E2E

1. **Debug mode**

   ```bash
   npm run test:e2e:debug
   ```

2. **UI mode (najlepszy dla debugowania)**

   ```bash
   npm run test:e2e:ui
   ```

3. **Trace Viewer**

   ```bash
   npx playwright show-trace trace.zip
   ```

4. **Codegen - nagraj interakcje**
   ```bash
   npx playwright codegen http://localhost:4321
   ```

## 📊 Sprawdź pokrycie kodu

```bash
# Wygeneruj raport
npm run test:coverage

# Otworz w przeglądarce
open coverage/index.html
```

Cel: **80% pokrycia** dla wszystkich metryk (lines, functions, branches, statements)

## 🎓 Następne kroki

1. Przeczytaj [README.md](./README.md) dla szczegółowej dokumentacji
2. Sprawdź przykładowe testy w `tests/unit/` i `tests/e2e/`
3. Poznaj [Best Practices](./README.md#-best-practices)
4. Eksperymentuj z [MSW](./mocks/handlers.ts) dla mockowania API

## 💡 Wskazówki

- Uruchamiaj `test:watch` podczas pisania testów
- Używaj `test:ui` dla lepszego overview testów
- Nazywaj testy opisowo: "should X when Y"
- Jeden test = jedna funkcjonalność
- Mockuj zewnętrzne zależności (API, database)
- Testuj zachowanie, nie implementację

## 🐛 Problemy?

### Testy nie działają?

1. Sprawdź czy server deweloperski działa (dla E2E)
2. Sprawdź czy wszystkie zależności są zainstalowane
3. Usuń cache: `rm -rf node_modules/.vite`
4. Przeinstaluj: `npm install`

### Playwright nie działa?

```bash
# Przeinstaluj przeglądarki
npx playwright install chromium --with-deps
```

### Vitest nie znajduje modułów?

Sprawdź czy ścieżki w `vitest.config.ts` są poprawne:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

## 📚 Więcej informacji

- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Docs](https://mswjs.io/)
