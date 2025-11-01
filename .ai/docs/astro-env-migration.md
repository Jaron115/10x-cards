# Migracja do Astro Env API

## Data migracji: 2025-11-01

## Przegląd

Projekt został zmigrowany z tradycyjnego `import.meta.env` na nowe Astro 5 **`astro:env` API** w celu zapewnienia type-safe environment variables i lepszej kompatybilności z Cloudflare Pages.

## Dlaczego ta zmiana?

Zgodnie z [oficjalną dokumentacją Astro](https://docs.astro.build/en/guides/environment-variables/#variable-types), nowe API `astro:env`:

1. **Zapewnia type safety** - wszystkie zmienne środowiskowe są typowane przez TypeScript
2. **Walidacja w runtime** - zmienne są walidowane podczas startu aplikacji
3. **Lepsza kompatybilność z adapterami** - szczególnie z Cloudflare, gdzie rozwiązuje problemy z odczytywaniem zmiennych
4. **Organizacja** - wyraźny podział na public/secret i client/server
5. **Bezpieczeństwo** - automatyczna walidacja sekrectów przy starcie (opcja `validateSecrets: true`)

## Zmienne środowiskowe w projekcie

### Schema w `astro.config.mjs`

```javascript
env: {
  schema: {
    // Supabase configuration (public server variables)
    SUPABASE_URL: envField.string({
      context: "server",
      access: "public",
    }),
    SUPABASE_KEY: envField.string({
      context: "server",
      access: "public",
    }),
    SUPABASE_SERVICE_ROLE_KEY: envField.string({
      context: "server",
      access: "secret",
    }),
    // OpenRouter AI configuration
    OPENROUTER_API_KEY: envField.string({
      context: "server",
      access: "secret",
    }),
    OPENROUTER_MODEL: envField.string({
      context: "server",
      access: "public",
      default: "openai/gpt-4o-mini",
    }),
    OPENROUTER_TIMEOUT_MS: envField.string({
      context: "server",
      access: "public",
      optional: true,
      default: "60000",
    }),
    OPENROUTER_USE_MOCK: envField.string({
      context: "server",
      access: "public",
      optional: true,
      default: "false",
    }),
  },
  validateSecrets: true,
}
```

### Typy zmiennych

1. **Public server variables** - dostępne na serwerze, bezpieczne do użycia
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_MODEL`
   - `OPENROUTER_TIMEOUT_MS`
   - `OPENROUTER_USE_MOCK`

2. **Secret server variables** - dostępne tylko na serwerze, nie w bundle
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENROUTER_API_KEY`

## Zmiany w kodzie

### Przed migracją

```typescript
// Stara wersja
const supabaseUrl = import.meta.env.SUPABASE_URL;
const apiKey = import.meta.env.OPENROUTER_API_KEY;
```

### Po migracji

```typescript
// Nowa wersja
import { SUPABASE_URL, OPENROUTER_API_KEY } from "astro:env/server";

// Zmienne są teraz dostępne bezpośrednio
const client = createClient(SUPABASE_URL, SUPABASE_KEY);
```

## Zmodyfikowane pliki

1. **astro.config.mjs** - dodano schema env
2. **src/db/supabase.client.ts** - import z `astro:env/server`
3. **src/db/supabase.admin.ts** - import z `astro:env/server`
4. **src/lib/services/generation.service.ts** - import z `astro:env/server`
5. **src/pages/api/generations.ts** - import z `astro:env/server`
6. **src/env.d.ts** - usunięto ręczną definicję `ImportMetaEnv`

## Uwagi ważne

### `import.meta.env.PROD` pozostaje bez zmian

Wbudowana zmienna Astro `import.meta.env.PROD` jest używana do określania środowiska produkcyjnego i **nie wymaga** migracji. Pozostaje jako `import.meta.env.PROD` w:

- `src/middleware/index.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/auth/register.ts`

## Konfiguracja w Cloudflare Pages

Wszystkie zmienne środowiskowe muszą być skonfigurowane w Cloudflare Pages Dashboard:

**Settings → Environment Variables**

Wymagane zmienne:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (opcjonalne, domyślnie: "openai/gpt-4o-mini")
- `OPENROUTER_TIMEOUT_MS` (opcjonalne, domyślnie: "60000")
- `OPENROUTER_USE_MOCK` (opcjonalne, domyślnie: "false")

## Testowanie

Po migracji należy:

1. ✅ `npm run astro sync` - wygenerować typy
2. ✅ `npm run build` - zbudować projekt
3. ✅ Zweryfikować działanie na Cloudflare Pages

## Referencje

- [Astro Environment Variables Documentation](https://docs.astro.build/en/guides/environment-variables/#variable-types)
- [astro:env API Reference](https://docs.astro.build/en/reference/runtime-api/astro-env/)
