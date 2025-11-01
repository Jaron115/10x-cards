# Cloudflare Pages Deployment

## Konfiguracja projektu

Projekt został skonfigurowany do deploymentu na Cloudflare Pages z następującymi zmianami:

### 1. Adapter Astro

- Zainstalowano `@astrojs/cloudflare` adapter
- Usunięto `@astrojs/node` adapter
- Zaktualizowano `astro.config.mjs` aby używać adaptera Cloudflare z włączonym `platformProxy`

### 2. GitHub Actions Workflow

Utworzono nowy workflow `.github/workflows/master.yml` który:

- Uruchamia linting kodu
- Wykonuje testy jednostkowe z coverage
- Buduje projekt
- Deployuje na Cloudflare Pages

## Wymagane zmienne środowiskowe w GitHub Secrets

Aby deployment działał poprawnie, należy skonfigurować następujące sekrety w repozytorium GitHub:

### Cloudflare

- `CLOUDFLARE_API_TOKEN` - Token API z Cloudflare (z uprawnieniami do Cloudflare Pages)
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
- `CLOUDFLARE_PROJECT_NAME` - Nazwa projektu w Cloudflare Pages

### Supabase

- `SUPABASE_URL` - URL do instancji Supabase
- `SUPABASE_KEY` - Klucz publiczny (anon key) do Supabase

## Jak uzyskać Cloudflare credentials

### 1. CLOUDFLARE_API_TOKEN

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **My Profile** → **API Tokens**
3. Kliknij **Create Token**
4. Wybierz szablon **Edit Cloudflare Workers** lub utwórz custom token z uprawnieniami:
   - Account → Cloudflare Pages → Edit
5. Skopiuj wygenerowany token

### 2. CLOUDFLARE_ACCOUNT_ID

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **Workers & Pages**
3. Account ID znajduje się w prawym panelu bocznym

### 3. CLOUDFLARE_PROJECT_NAME

1. Zaloguj się do Cloudflare Dashboard
2. Przejdź do **Workers & Pages**
3. Utwórz nowy projekt Pages (jeśli jeszcze nie istnieje)
4. Nazwa projektu to wartość, którą należy użyć

## Konfiguracja zmiennych środowiskowych w Cloudflare Pages

Zmienne środowiskowe dla aplikacji (np. `SUPABASE_URL`, `SUPABASE_KEY`) należy również skonfigurować w Cloudflare Pages:

1. Przejdź do projektu w Cloudflare Dashboard
2. Wybierz **Settings** → **Environment variables**
3. Dodaj zmienne:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

## Struktura wdrożenia

Workflow `master.yml` uruchamia się automatycznie przy każdym pushu do brancha `master` i wykonuje następujące kroki:

1. **Lint** - sprawdzenie jakości kodu
2. **Unit Tests** - uruchomienie testów jednostkowych z coverage
3. **Deploy** - zbudowanie projektu i wdrożenie na Cloudflare Pages

Katalog `dist` jest deployowany na Cloudflare Pages.

## Wersje akcji GitHub

Wszystkie akcje GitHub używają najnowszych stabilnych wersji:

- `actions/checkout@v5`
- `actions/setup-node@v6`
- `actions/upload-artifact@v5`
- `actions/download-artifact@v6`
- `actions/github-script@v8`
- `cloudflare/wrangler-action@v3`
