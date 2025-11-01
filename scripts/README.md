# Scripts

## setup-cloudflare-env.sh

Skrypt do automatycznego ustawienia zmiennych środowiskowych w Cloudflare Pages.

### Wymagania

- Wrangler CLI (instalowany automatycznie przez `npx`)
- Cloudflare API Token z uprawnieniami do Cloudflare Pages
- Account ID i Project Name z Cloudflare Dashboard

### Użycie

```bash
# 1. Ustaw wymagane zmienne środowiskowe
export CLOUDFLARE_API_TOKEN="twój_cloudflare_api_token"
export CLOUDFLARE_ACCOUNT_ID="twoje_cloudflare_account_id"
export CLOUDFLARE_PROJECT_NAME="nazwa_projektu_w_cloudflare"

# 2. Ustaw zmienne aplikacji
export SUPABASE_URL="https://twoja-instancja.supabase.co"
export SUPABASE_KEY="twój_supabase_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="twój_supabase_service_role_key"

# 3. (Opcjonalnie) Ustaw zmienne OpenRouter
export OPENROUTER_API_KEY="twój_openrouter_api_key"
export OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# 4. Uruchom skrypt
./scripts/setup-cloudflare-env.sh
```

### Alternatywnie: użyj pliku .env

```bash
# Utwórz plik .env.cloudflare (NIE commituj go do repo!)
cat > .env.cloudflare << EOF
CLOUDFLARE_API_TOKEN=twój_token
CLOUDFLARE_ACCOUNT_ID=twoje_id
CLOUDFLARE_PROJECT_NAME=nazwa_projektu
SUPABASE_URL=https://...
SUPABASE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
EOF

# Załaduj zmienne i uruchom skrypt
source .env.cloudflare && ./scripts/setup-cloudflare-env.sh
```

### Co robi ten skrypt?

1. Sprawdza czy wszystkie wymagane zmienne środowiskowe są ustawione
2. Używa Wrangler CLI do ustawienia zmiennych w Cloudflare Pages
3. Ustawia zmienne dla środowiska Production
4. Wyświetla komunikaty o postępie

### Uwagi

- Skrypt używa `npx wrangler pages secret put` do ustawienia zmiennych
- Zmienne są ustawiane jako "secrets" (bezpieczne zmienne środowiskowe)
- Po uruchomieniu skryptu musisz wykonać ponowny deployment aby zmienne były dostępne
- Skrypt NIE wykonuje deploymentu - musisz to zrobić ręcznie

### Troubleshooting

**Błąd: "CLOUDFLARE_API_TOKEN is not set"**
- Upewnij się, że eksportujesz zmienne przed uruchomieniem skryptu
- Sprawdź czy nie ma literówek w nazwach zmiennych

**Błąd: "Authentication error"**
- Sprawdź czy CLOUDFLARE_API_TOKEN jest poprawny
- Sprawdź czy token ma uprawnienia do Cloudflare Pages
- Sprawdź czy CLOUDFLARE_ACCOUNT_ID jest poprawny

**Błąd: "Project not found"**
- Sprawdź czy CLOUDFLARE_PROJECT_NAME jest poprawny
- Sprawdź czy projekt istnieje w Cloudflare Dashboard
- Nazwa projektu musi być dokładnie taka sama jak w Dashboard

### Zobacz też

- `.ai/QUICK-FIX-500-ERROR.md` - Szybki przewodnik rozwiązywania błędu 500
- `.ai/cloudflare-deployment.md` - Pełna dokumentacja deploymentu
- `.ai/cloudflare-troubleshooting.md` - Troubleshooting

