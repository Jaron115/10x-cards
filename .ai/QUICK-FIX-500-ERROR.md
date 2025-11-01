# 🔴 SZYBKIE ROZWIĄZANIE: Błąd 500 po deploymencie

## Problem

Po deploymencie na Cloudflare Pages strona zwraca błąd 500 z komunikatem:

```
Error: Missing required environment variables:
SUPABASE_URL: ✗ MISSING
SUPABASE_KEY: ✗ MISSING
```

## Przyczyna

**Zmienne środowiskowe ustawione w GitHub Secrets NIE SĄ automatycznie przekazywane do Cloudflare Pages runtime.**

GitHub Secrets są dostępne tylko podczas **budowania** aplikacji w GitHub Actions, ale **nie są dostępne podczas wykonywania** aplikacji na Cloudflare Pages.

## ✅ Rozwiązanie

Musisz **ręcznie** ustawić zmienne środowiskowe w Cloudflare Pages Dashboard:

### Krok 1: Przejdź do Cloudflare Dashboard

1. Otwórz: https://dash.cloudflare.com/
2. Zaloguj się na swoje konto

### Krok 2: Znajdź swój projekt

1. W menu bocznym kliknij **Workers & Pages**
2. Znajdź swój projekt na liście (np. `10x-cards-2zl`)
3. Kliknij na nazwę projektu

### Krok 3: Dodaj zmienne środowiskowe

1. Przejdź do zakładki **Settings**
2. Przewiń w dół do sekcji **Environment variables**
3. Kliknij **Add variable**
4. Dla **Production** environment dodaj:

   **SUPABASE_URL**
   - Variable name: `SUPABASE_URL`
   - Value: `https://twoja-instancja.supabase.co` (skopiuj z Supabase Dashboard)
   - Environment: `Production`
   - Kliknij **Save**

   **SUPABASE_KEY**
   - Variable name: `SUPABASE_KEY`
   - Value: `twój_anon_key` (skopiuj z Supabase Dashboard → Settings → API → anon/public key)
   - Environment: `Production`
   - Kliknij **Save**

   **SUPABASE_SERVICE_ROLE_KEY**
   - Variable name: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: `twój_service_role_key` (skopiuj z Supabase Dashboard → Settings → API → service_role key)
   - Environment: `Production`
   - ⚠️ **UWAGA**: Ten klucz jest poufny! Nie udostępniaj go publicznie
   - Kliknij **Save**

   **OPENROUTER_API_KEY** (opcjonalnie, jeśli używasz AI)
   - Variable name: `OPENROUTER_API_KEY`
   - Value: `twój_openrouter_key`
   - Environment: `Production`
   - Kliknij **Save**

   **OPENROUTER_MODEL** (opcjonalnie, jeśli używasz AI)
   - Variable name: `OPENROUTER_MODEL`
   - Value: `anthropic/claude-3.5-sonnet` (lub inny model)
   - Environment: `Production`
   - Kliknij **Save**

### Krok 4: Wykonaj ponowny deployment

**Ważne**: Zmienne środowiskowe są ładowane tylko podczas deploymentu. Musisz wykonać ponowny deployment:

#### Opcja A: Przez GitHub Actions (zalecane)

1. Przejdź do repozytorium na GitHub
2. Kliknij zakładkę **Actions**
3. Wybierz workflow **Deploy to Cloudflare Pages**
4. Kliknij **Run workflow** → **Run workflow**

#### Opcja B: Przez Cloudflare Dashboard

1. W projekcie Cloudflare Pages przejdź do zakładki **Deployments**
2. Kliknij **Create deployment**
3. Wybierz branch `master`
4. Kliknij **Save and Deploy**

### Krok 5: Sprawdź czy działa

1. Poczekaj aż deployment się zakończy (1-2 minuty)
2. Otwórz URL swojej aplikacji (np. `https://0c2210f6.10x-cards-2zl.pages.dev/`)
3. Strona powinna działać poprawnie! ✅

## 🔍 Weryfikacja

Jeśli nadal widzisz błąd 500:

1. Przejdź do projektu w Cloudflare Dashboard
2. Zakładka **Deployments** → kliknij na ostatni deployment
3. Przewiń w dół do **Functions logs** (Real-time Logs)
4. Odśwież stronę i sprawdź logi
5. Upewnij się, że widzisz:
   ```
   [SUPABASE CLIENT] Environment variables check:
   SUPABASE_URL: ✓ FOUND
   SUPABASE_KEY: ✓ FOUND
   ```

## 🤖 Automatyzacja (opcjonalnie)

Możesz użyć skryptu do automatycznego ustawienia zmiennych:

```bash
# 1. Ustaw zmienne lokalne (użyj wartości z GitHub Secrets)
export CLOUDFLARE_API_TOKEN="twój_token"
export CLOUDFLARE_ACCOUNT_ID="twoje_account_id"
export CLOUDFLARE_PROJECT_NAME="10x-cards-2zl"
export SUPABASE_URL="https://..."
export SUPABASE_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."

# 2. Uruchom skrypt
chmod +x scripts/setup-cloudflare-env.sh
./scripts/setup-cloudflare-env.sh
```

## 📚 Dodatkowe informacje

- Pełna dokumentacja: `.ai/cloudflare-deployment.md`
- Troubleshooting: `.ai/cloudflare-troubleshooting.md`
- Skrypt automatyzacji: `scripts/setup-cloudflare-env.sh`

## ⚠️ Ważne uwagi

1. **Zmienne w GitHub Secrets** są używane tylko podczas budowania w CI/CD
2. **Zmienne w Cloudflare Pages** są używane podczas wykonywania aplikacji
3. **Musisz ustawić zmienne w OBIE miejsca** (GitHub Secrets + Cloudflare Pages)
4. Po dodaniu/zmianie zmiennych w Cloudflare **zawsze wykonaj ponowny deployment**
