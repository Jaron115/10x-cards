# Testy E2E - Generator AI

Testy end-to-end dla funkcjonalności generatora fiszek AI.

## ✅ Co zostało przetestowane

### Autentykacja i nawigacja (3 testy)

- ✅ Użytkownik jest zalogowany i widzi dashboard
- ✅ Nawigacja do generatora przez sidebar
- ✅ Walidacja przycisków (disabled/enabled)

### Generator AI - Generowanie fiszek (5 testów)

- ✅ **Happy path**: Generowanie fiszek z tekstu źródłowego
- ✅ **Zatwierdzanie i zapisywanie**: Approve fiszek i zapis do bazy
- ✅ **Odrzucanie**: Reject pojedynczych propozycji
- ✅ **Edycja**: Edycja treści fiszek
- ✅ **Anulowanie edycji**: Cancel edycji i przywrócenie oryginalnej treści

### Generator AI - Walidacja (3 testy)

- ✅ Przycisk wyłączony dla za krótkiego tekstu (< 1000 znaków)
- ✅ Przycisk wyłączony dla za długiego tekstu (> 10000 znaków)
- ✅ Przycisk włączony dla poprawnej długości (1000-10000 znaków)

## 🏗️ Architektura testów

### Struktura plików

```
tests/e2e/
├── fixtures/
│   ├── auth.fixture.ts        # (legacy) Auth helpers
│   ├── api-mocks.ts           # Mockowanie API (OpenRouter, Supabase)
│   └── database.fixture.ts     # Database cleanup helpers
├── pages/
│   └── GeneratorPage.ts       # Page Object Model dla generatora
├── utils/
│   └── test-helpers.ts        # Utility functions
├── global.setup.ts            # Global setup - logowanie raz
├── auth.spec.ts               # Testy autentykacji
└── generator.spec.ts          # Testy generatora
```

### Kluczowe rozwiązania

#### 1. Global Setup

- **Logowanie raz** przed wszystkimi testami
- Zapisanie session state do `.auth/user.json`
- Reużywanie sesji we wszystkich testach (szybsze, stabilniejsze)

#### 2. API Mocking

- **OpenRouter API** - zmockowane odpowiedzi z 6 przykładowymi fiszkami
- **Flashcard save API** - zmockowane zapisywanie
- Delay 2s dla generacji, 500ms dla zapisu (realistyczne)

#### 3. Page Object Model

- `GeneratorPage` - encapsulacja interakcji z UI
- `ProposalCard` - zarządzanie pojedynczą fiszką
- Czytelne testy, łatwa konserwacja

#### 4. Data-testid

- Wszystkie kluczowe elementy mają `data-testid`
- Stable selektory niezależne od stylów
- Format: `<component>-<element>-<id>`

## 🚀 Uruchomienie testów

### Wszystkie testy E2E

```bash
npm run test:e2e
```

### Tylko testy generatora

```bash
npm run test:e2e -- tests/e2e/generator.spec.ts
```

### Tryb interaktywny (UI)

```bash
npm run test:e2e:ui
```

### Tryb debug

```bash
npm run test:e2e:debug
```

### Z widoczną przeglądarką

```bash
npm run test:e2e:headed
```

## 🔧 Konfiguracja

### Zmienne środowiskowe (.env.test)

```env
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# User testowy
E2E_USERNAME=tests@user.com
E2E_PASSWORD=SomeTestPass!2
E2E_USERNAME_ID=uuid-here

# OpenRouter (opcjonalne - używamy mocków)
OPENROUTER_API_KEY=xxx
OPENROUTER_MODEL=openai/gpt-4o-mini
```

### Playwright Config

- **Global Setup**: `tests/e2e/global.setup.ts`
- **Storage State**: `.auth/user.json` (gitignored)
- **Base URL**: `http://localhost:4321`
- **Timeout**: 30s per test
- **Workers**: 4 parallel
- **Retry**: 0 locally, 2 on CI

## 📝 Dodawanie nowych testów

1. **Użyj Page Object Model**

```typescript
import { test, expect } from "@playwright/test";
import { GeneratorPage } from "./pages/GeneratorPage";

test("mój nowy test", async ({ page }) => {
  const generatorPage = new GeneratorPage(page);
  await generatorPage.goto();
  // ...
});
```

2. **Setup mocków w beforeEach**

```typescript
test.beforeEach(async ({ page }) => {
  await mockGenerationAPI(page);
  await mockFlashcardSaveAPI(page);
});
```

3. **Dodaj data-testid do nowych elementów**

```tsx
<button data-testid="my-new-button">...</button>
```

## 🐛 Debugging

### Screenshots i videos

Po każdym failed teście:

- Screenshot: `test-results/*/test-failed-*.png`
- Video: `test-results/*/video.webm`

### HTML Report

```bash
npm run test:e2e:report
```

### Logs

- Console logs z testów
- Network requests
- Traces (on first retry)

## 🔄 Cleanup

Testy nie modyfikują prawdziwych danych (wszystko zmockowane), ale jeśli potrzebujesz cleanup:

```typescript
import { cleanupTestUserData } from "./fixtures/database.fixture";

test.afterAll(async () => {
  await cleanupTestUserData(process.env.E2E_USERNAME_ID!);
});
```

## 📊 Wyniki

**Status**: ✅ 11/11 testów przechodzi (100%)  
**Czas wykonania**: ~17s  
**Coverage**: Generator AI + Auth + Navigation  
**Mockowane API**: OpenRouter, Supabase

---

**Ostatnia aktualizacja**: 2025-10-25  
**Wersja Playwright**: 1.56.1
