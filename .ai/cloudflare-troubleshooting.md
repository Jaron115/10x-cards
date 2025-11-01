# Cloudflare Pages - Troubleshooting

## Błąd 500 po deployment

Jeśli po wdrożeniu aplikacji na Cloudflare Pages otrzymujesz błąd 500, wykonaj następujące kroki:

### 1. Sprawdź logi w Cloudflare Dashboard

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do **Workers & Pages**
3. Wybierz swój projekt
4. Przejdź do zakładki **Deployments**
5. Kliknij na ostatni deployment
6. Sprawdź **Functions logs** (Real-time Logs)

### 2. Sprawdź czy zmienne środowiskowe są poprawnie skonfigurowane

#### W GitHub Secrets:

Upewnij się, że wszystkie wymagane sekrety są skonfigurowane w GitHub:

1. Przejdź do repozytorium na GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Sprawdź czy istnieją:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_PROJECT_NAME`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### Weryfikacja w logach GitHub Actions:

1. Przejdź do zakładki **Actions** w repozytorium
2. Kliknij na ostatni workflow run
3. Sprawdź job **deploy** → krok **Build project**
4. Logi powinny pokazać czy zmienne są dostępne

### 3. Testuj lokalnie z produkcyjnym buildem

```bash
# Ustaw zmienne środowiskowe lokalnie
export SUPABASE_URL="your-supabase-url"
export SUPABASE_KEY="your-supabase-key"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Zbuduj projekt
npm run build

# Uruchom preview
npm run preview
```

Jeśli aplikacja działa lokalnie, problem jest prawdopodobnie związany z konfiguracją Cloudflare.

### 4. Sprawdź kompatybilność zależności

Niektóre pakiety Node.js mogą nie działać w środowisku Cloudflare Workers. Sprawdź:

1. Czy wszystkie zależności są kompatybilne z Cloudflare Workers Runtime
2. Czy nie używasz modułów Node.js, które nie są dostępne w Cloudflare (np. `fs`, `path` w runtime)

### 5. Debugowanie w Cloudflare

Dodaj tymczasowe logi do kodu, aby zobaczyć co się dzieje:

```typescript
// W src/db/supabase.client.ts
console.log("[SUPABASE] Initializing client...");
console.log("[SUPABASE] URL:", supabaseUrl ? "SET" : "MISSING");
console.log("[SUPABASE] KEY:", supabaseAnonKey ? "SET" : "MISSING");
```

Po deployment sprawdź logi w Cloudflare Dashboard.

### 6. Sprawdź build output

Upewnij się, że katalog `dist` zawiera wszystkie wymagane pliki:

```bash
# Po lokalnym buildzie
ls -la dist/
```

Powinien zawierać:

- `_worker.js` - główny plik worker dla Cloudflare
- `_routes.json` - routing configuration
- Statyczne assety

### 7. Zweryfikuj adapter Cloudflare

Sprawdź czy `astro.config.mjs` jest poprawnie skonfigurowany:

```javascript
adapter: cloudflare({
  platformProxy: {
    enabled: true,
  },
}),
```

## Częste problemy

### Problem: "Missing required environment variables"

**Przyczyna:** Zmienne środowiskowe nie są skonfigurowane w Cloudflare Pages Dashboard.

⚠️ **WAŻNE**: GitHub Secrets NIE SĄ automatycznie przekazywane do Cloudflare Pages runtime!

**Rozwiązanie:**

1. **Musisz ręcznie ustawić zmienne w Cloudflare Pages Dashboard:**
   - Przejdź do https://dash.cloudflare.com/
   - Workers & Pages → Twój projekt
   - Settings → Environment variables
   - Dodaj wszystkie wymagane zmienne dla Production environment

2. **Po dodaniu zmiennych wykonaj ponowny deployment:**
   - Zmienne są ładowane tylko podczas deploymentu
   - Uruchom ponownie workflow w GitHub Actions lub
   - Wykonaj deployment przez Cloudflare Dashboard

3. **Sprawdź szczegółowy przewodnik:**
   - Zobacz: `.ai/QUICK-FIX-500-ERROR.md` dla krok-po-kroku instrukcji
   - Lub użyj skryptu: `./scripts/setup-cloudflare-env.sh`

**Weryfikacja:**

```bash
# Sprawdź logi w Cloudflare Dashboard
# Powinny pokazać:
[SUPABASE CLIENT] Environment variables check:
SUPABASE_URL: ✓ FOUND
SUPABASE_KEY: ✓ FOUND
```

### Problem: "Cannot find module"

**Przyczyna:** Brakująca zależność lub problem z resolverem modułów.

**Rozwiązanie:**

1. Sprawdź czy wszystkie zależności są w `package.json`
2. Usuń `node_modules` i `package-lock.json`, następnie uruchom `npm install`
3. Sprawdź czy build działa lokalnie

### Problem: "Supabase client initialization failed"

**Przyczyna:** Niepoprawne credentials lub URL do Supabase.

**Rozwiązanie:**

1. Sprawdź czy `SUPABASE_URL` i `SUPABASE_KEY` są poprawne
2. Sprawdź czy URL zawiera `https://`
3. Sprawdź czy klucz nie wygasł

### Problem: "Function exceeded time limit"

**Przyczyna:** Funkcja wykonuje się zbyt długo (limit Cloudflare: 30s dla free plan).

**Rozwiązanie:**

1. Zoptymalizuj kod
2. Użyj cache'owania
3. Rozważ upgrade planu Cloudflare

## Przydatne komendy

```bash
# Sprawdź wersję adaptera Cloudflare
npm list @astrojs/cloudflare

# Zbuduj projekt z verbose logging
npm run build -- --verbose

# Sprawdź czy build jest poprawny
npm run preview

# Sprawdź logi Cloudflare (wymaga wrangler CLI)
npx wrangler pages deployment tail
```

## Kontakt z pomocą techniczną

Jeśli problem nadal występuje:

1. Zbierz wszystkie logi (GitHub Actions + Cloudflare)
2. Przygotuj opis problemu
3. Skontaktuj się z pomocą techniczną Cloudflare
4. Lub otwórz issue na GitHub: https://github.com/withastro/astro/issues
