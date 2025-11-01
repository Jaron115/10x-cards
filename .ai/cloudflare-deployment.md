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
- `SUPABASE_SERVICE_ROLE_KEY` - Klucz service role do Supabase (dla operacji admin)

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

## ⚠️ WAŻNE: Konfiguracja zmiennych środowiskowych

### Cloudflare Pages wymaga konfiguracji zmiennych w Dashboard

W przeciwieństwie do tradycyjnych deploymentów, Cloudflare Pages **nie** używa zmiennych z build time. Zamiast tego:

1. **Zmienne muszą być skonfigurowane w Cloudflare Pages Dashboard**
2. **Zmienne są dostępne w runtime przez Cloudflare Workers**
3. **Build może być wykonany bez zmiennych środowiskowych**

### Konfiguracja zmiennych w Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages**
3. Wybierz swój projekt
4. Przejdź do **Settings** → **Environment variables**
5. Dodaj następujące zmienne dla środowiska **Production**:
   - `SUPABASE_URL` - URL do instancji Supabase
   - `SUPABASE_KEY` - Klucz publiczny (anon key) do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Klucz service role do Supabase
   - `OPENROUTER_API_KEY` - (opcjonalnie) Klucz API do Openrouter.ai
   - `OPENROUTER_MODEL` - (opcjonalnie) Model AI do użycia

### Jak Astro + Cloudflare obsługuje zmienne?

Astro z adapterem Cloudflare automatycznie:

- Odczytuje zmienne z Cloudflare Pages environment
- Udostępnia je przez `import.meta.env` w kodzie server-side
- **NIE WYMAGA** żadnej specjalnej konfiguracji w `astro.config.mjs`

Workflow GitHub Actions może wykonać build **bez** zmiennych środowiskowych, ponieważ są one dostępne dopiero w runtime na Cloudflare.

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
