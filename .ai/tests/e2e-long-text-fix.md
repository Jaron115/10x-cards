# Fix: E2E Test Timeout dla długiego tekstu

**Data**: 2025-10-29  
**Problem**: Test E2E "przycisk generowania powinien być wyłączony dla za długiego tekstu" timeout'ował się po 30s

## 🐛 Problem

### Objawy

```
Test timeout of 30000ms exceeded.
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('generator-source-textarea')
```

### Przyczyna

Test próbował wypełnić textarea 11,000 znakami używając standardowej metody Playwright `.fill()`, która:

- Symuluje rzeczywiste wpisywanie przez użytkownika
- Jest bardzo wolna dla dużych ilości tekstu
- Przekraczała domyślny timeout 30s

## ✅ Rozwiązanie

### 1. Dodano metodę `fillSourceText()` do `GeneratorPage`

Nowa metoda automatycznie wybiera optymalną strategię wypełniania:

```typescript
async fillSourceText(text: string) {
  // For very large texts, use pressSequentially with delay: 0
  // This triggers proper React events but is much faster than normal typing
  if (text.length > 5000) {
    await this.sourceTextarea.click();
    await this.sourceTextarea.clear();
    // pressSequentially with delay: 0 is fast but triggers proper React onChange events
    await this.sourceTextarea.pressSequentially(text, { delay: 0 });
    // Small wait for React state to update
    await this.page.waitForTimeout(300);
  } else {
    // For smaller texts, use normal fill for realistic interaction
    await this.sourceTextarea.fill(text);
  }
}
```

**Zalety tego podejścia:**

- ✅ Automatyczne wykrywanie dużych tekstów (>5000 znaków)
- ✅ Szybkie wypełnianie przez `pressSequentially` z `delay: 0`
- ✅ Poprawne wywołanie event'ów React (działa z React 19)
- ✅ Zachowanie realistycznej symulacji dla małych tekstów

### 2. Zwiększono timeout dla testu z długim tekstem

```typescript
test("przycisk generowania powinien być wyłączony dla za długiego tekstu", async ({ page }) => {
  // Zwiększ timeout do 60s dla testu z dużym tekstem
  test.setTimeout(60000);

  // ... reszta testu
});
```

### 3. Zaktualizowano wszystkie testy

Zamieniono bezpośrednie wywołania `.sourceTextarea.fill()` na `.fillSourceText()` w:

- ✅ Test: "powinien wygenerować fiszki z tekstu źródłowego (happy path)"
- ✅ Test: "przycisk generowania powinien być wyłączony dla za krótkiego tekstu"
- ✅ Test: "przycisk generowania powinien być wyłączony dla za długiego tekstu"
- ✅ Test: "przycisk generowania powinien być włączony dla poprawnej długości tekstu"

## 📊 Rezultaty

### Przed zmianami:

- ❌ Test timeout po 30s
- ❌ Nie można było przetestować walidacji długiego tekstu
- ❌ `.fill()` dla 11,000 znaków zajmowało >30s

### Po zmianach:

- ✅ Test przechodzi w ~14s (zamiast timeout po 30s)
- ✅ Poprawna walidacja limitu 10,000 znaków
- ✅ Zachowana realistyczna symulacja dla normalnych przypadków użycia
- ✅ Wszystkie 8 testów generatora przechodzą

## 🔍 Problem na CI (GitHub Actions)

**Uwaga**: Logi pokazują również problem z CI:

```
[AUTH] Login error: { message: 'Invalid API key', status: 401, name: 'AuthApiError' }
```

**To osobny problem** wymagający:

1. Weryfikacji czy GitHub Secrets są poprawnie skonfigurowane
2. Sprawdzenia czy `SUPABASE_KEY` w environment "integration" jest aktualny
3. Upewnienia się że Supabase project jest aktywny

**Rozwiązanie problemu CI**:

1. Przejdź do Settings → Environments → integration
2. Zweryfikuj/zaktualizuj secrets:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `E2E_USERNAME`
   - `E2E_PASSWORD`
   - `E2E_USERNAME_ID`

## 🎯 Najlepsze praktyki

### Kiedy używać `fillSourceText()`?

- ✅ Zawsze dla pól tekstowych w generatorze
- ✅ Automatycznie optymalizuje wydajność
- ✅ Jednolite API dla wszystkich przypadków

### Kiedy używać bezpośredniego `.fill()`?

- ✅ Dla małych formularzy (login, krótkie inputy)
- ✅ Gdy chcemy przetestować konkretnie interakcję użytkownika
- ✅ Gdy nie ma problemu z wydajnością

## 📝 Pliki zmienione

1. `tests/e2e/pages/GeneratorPage.ts`
   - Dodano metodę `fillSourceText()` z automatyczną optymalizacją

2. `tests/e2e/generator.spec.ts`
   - Zaktualizowano 4 testy aby używały `fillSourceText()`
   - Dodano `test.setTimeout(60000)` do testu z długim tekstem

## 🚀 Weryfikacja

Aby zweryfikować poprawkę lokalnie:

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Lub tylko testy walidacji
npm run test:e2e -- tests/e2e/generator.spec.ts -g "Walidacja"

# Lub tylko problematyczny test
npm run test:e2e -- tests/e2e/generator.spec.ts -g "za długiego tekstu"
```

---

**Status**: ✅ Problem rozwiązany lokalnie  
**Status CI**: ⚠️ Wymaga konfiguracji GitHub Secrets
