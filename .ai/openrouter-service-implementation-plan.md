## Opis usługi

Usługa OpenRouter integruje aplikację z API `https://openrouter.ai/api/v1/chat/completions` w celu generowania propozycji fiszek (flashcards) z dostarczonego tekstu źródłowego. Jest zaprojektowana jako cienki, testowalny klient HTTP (`OpenRouterClient`) oraz warstwa domenowa (`GenerationService`), która wykorzystuje klienta do uzyskania ustrukturyzowanych odpowiedzi (JSON) zgodnych z wymogami API i lokalnymi typami (`FlashcardProposalDTO`).

W ramach obecnej bazy kodu usługa będzie wykorzystywana głównie przez endpoint `POST /api/generations` oraz `GenerationService`. Plan obejmuje przejście z mocków na produkcyjne wywołania, twardą walidację (zod/JSON Schema), obsługę błędów i bezpieczną konfigurację.

### Kluczowe komponenty (przegląd)

1. OpenRouterClient — bezpośredni klient HTTP do OpenRouter (chat completions).
2. GenerationService (aktualizacja) — wykorzystuje `OpenRouterClient` do generowania propozycji fiszek.
3. Konfiguracja — źródła `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_MS`, przełącznik mocków.
4. Schematy i walidacja — JSON Schema dla `response_format` + Zod do walidacji wyjścia modeli.
5. Rate limiting i middleware — integracja z istniejącym `RateLimitService` i astro middleware.
6. Telemetria i logowanie — rejestrowanie czasu, modelu, błędów (do tabeli `generation_error_logs`).

## Opis konstruktora

### OpenRouterClient

Konstruktor przyjmuje konfigurację środowiskową i opcje czasu wykonania:

- apiKey: string (wymagany w prod — z `import.meta.env.OPENROUTER_API_KEY`)
- baseUrl: string = `https://openrouter.ai/api/v1/chat/completions`
- defaultModel: string = `import.meta.env.OPENROUTER_MODEL` lub bezpieczny domyślny model
- timeoutMs: number = `import.meta.env.OPENROUTER_TIMEOUT_MS` (domyślnie 60000)

### GenerationService (aktualizacja)

Konstruktor pozostaje bez zmian z punktu widzenia zewnętrznego API, ale wewnętrznie korzysta z instancji `OpenRouterClient`. W trybie deweloperskim można włączyć mocki (ENV), a w produkcji skorzystać z prawdziwego klienta.

## Publiczne metody i pola

### OpenRouterClient

- chatComplete(messages, options): Promise<ChatCompletionResponse>
  - `messages`: tablica wiadomości `{ role: 'system' | 'user' | 'assistant', content: string }`
  - `options`: { model?: string; response_format?: ResponseFormat; temperature?: number; top_p?: number; max_tokens?: number; seed?: number; extraHeaders?: Record<string,string> }
  - Zwraca obiekt z `raw` odpowiedzi oraz ewentualnie `parsed` JSON, jeśli użyto `response_format` o typie `json_schema` i udało się sparsować.

### GenerationService (istniejąca)

- generateFlashcards(source_text: string, api_key: string, model: string): Promise<GenerationResult>
  - Zmiana implementacyjna: wewnętrznie wykorzystuje `OpenRouterClient.chatComplete` z `response_format` (JSON Schema), a następnie waliduje wynik (Zod) i mapuje do `FlashcardProposalDTO[]`.
- saveGeneration(...), logError(...): bez zmian (z już istniejącą obsługą persistence i logów błędów).

## Prywatne metody i pola

### OpenRouterClient (przykładowe)

- buildHeaders(apiKey): Record<string,string> — bezpiecznie buduje nagłówki (Authorization, Content-Type).
- buildPayload(messages, options): object — składa body POST (model, messages, response_format, parametry modelu).
- assertOk(response): void — rzuca błąd gdy kod HTTP != 2xx, dołączając treść błędu z OpenRouter.
- parseStructured(contentOrParsed): unknown — próbuje odczytać `message.parsed` (jeśli wspierane) lub sparsować `message.content` jako JSON.

### GenerationService (rozszerzenia)

- parseAIResponse(response): FlashcardProposalDTO[] — aktualizacja: próba odczytu wyniku ustrukturyzowanego; fallback na obecny JSON w `message.content` + solidna walidacja Zod.
- toFlashcardProposals(validated): FlashcardProposalDTO[] — mapowanie i trymerowanie pól.

## Obsługa błędów

Poniższe scenariusze powinny być obsłużone i mapowane do istniejących typów błędów (`AIServiceError`, `ApiErrorDTO`):

1. Błędny JSON w żądaniu klienta (HTTP 400) — już obsługiwane w endpointach.
2. Brak `OPENROUTER_API_KEY` w prod — HTTP 500 `INTERNAL_ERROR` + log.
3. Sieć/timeout połączenia z OpenRouter — `TIMEOUT_ERROR` lub `NETWORK_ERROR` w `AIServiceError` + zapis do `generation_error_logs`.
4. Kody HTTP 4xx/5xx z OpenRouter — `AIServiceError` z kodem statusu i treścią odpowiedzi.
5. Niespójny lub nie-JSON wynik modelu — `PARSE_ERROR` (JSON parse) lub `VALIDATION_ERROR` (Zod) po stronie serwera.
6. Przekroczenie limitów (RateLimitService) — HTTP 429 `RATE_LIMIT_EXCEEDED` z nagłówkiem `Retry-After`.
7. Przekroczenie limitu długości `source_text` — już egzekwowane przez `GenerateFlashcardsSchema` (Zod) w warstwie API.

## Kwestie bezpieczeństwa

1. Sekrety w ENV: `OPENROUTER_API_KEY` nigdy nie trafia do logów ani do klienta.
2. Whitelist modeli: pozwól na ograniczony zestaw modeli (ENV/konfiguracja) zamiast arbitralnego inputu od użytkownika.
3. Walidacja danych: twarda walidacja Zod po stronie serwera nawet przy `response_format` (modele mogą się mylić).
4. Timeouts i idempotencja: limit czasu, brak wielokrotnych prób bez backoffu; unikaj powielania zapisów (hash wejścia już istnieje w `GenerationService`).
5. Redakcja logów: loguj długości, skróty (`MD5`) i kody, nie pełne treści.
6. Ochrona przed injection: komunikaty systemowe bez interpolacji niesprawdzonego inputu; treść użytkownika tylko jako `user` message.

## Włączenie elementów wymaganych przez OpenRouter (z przykładami)

1. Komunikat systemowy (System Prompt)

```typescript
const SYSTEM_PROMPT = `You are a flashcard generation expert. Generate 5-8 high-quality flashcards from the provided text.
Each flashcard should:
- Have a clear, concise question on the front
- Have a comprehensive answer on the back
- Cover important concepts from the text
- Be useful for learning and retention`;
```

2. Komunikat użytkownika (User Prompt)

```typescript
const userMessage = source_text; // surowa treść wejściowa użytkownika
```

3. Ustrukturyzowane odpowiedzi (response_format: JSON Schema)

Wymagamy aby model zwrócił tablicę obiektów `{ front, back }` (5–8 elementów):

```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "FlashcardProposals",
    "strict": true,
    "schema": {
      "type": "array",
      "minItems": 5,
      "maxItems": 8,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "front": { "type": "string", "minLength": 1, "maxLength": 200 },
          "back": { "type": "string", "minLength": 1, "maxLength": 500 }
        },
        "required": ["front", "back"]
      }
    }
  }
}
```

4. Nazwa modelu (Model name)

```typescript
const model = import.meta.env.OPENROUTER_MODEL ?? "openai/gpt-4"; // przykład zgodny z obecnym kodem
```

5. Parametry modelu (Model parameters)

```typescript
const params = {
  temperature: 0.7,
  top_p: 0.95,
  max_tokens: 2000,
  // opcjonalnie:
  // seed: 42,
};
```

6. Przykładowe kompletne body żądania do OpenRouter

```json
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a flashcard generation expert. Generate 5-8 high-quality flashcards from the provided text.\nEach flashcard should:\n- Have a clear, concise question on the front\n- Have a comprehensive answer on the back\n- Cover important concepts from the text\n- Be useful for learning and retention"
    },
    { "role": "user", "content": "<very long source text here>" }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "FlashcardProposals",
      "strict": true,
      "schema": {
        "type": "array",
        "minItems": 5,
        "maxItems": 8,
        "items": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "front": { "type": "string", "minLength": 1, "maxLength": 200 },
            "back": { "type": "string", "minLength": 1, "maxLength": 500 }
          },
          "required": ["front", "back"]
        }
      }
    }
  },
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 2000
}
```

## Plan wdrożenia krok po kroku

1. Zmienne środowiskowe
   - Dodaj do `.env` (lokalnie) i do sekretów CI/CD:
     - `OPENROUTER_API_KEY` — klucz produkcyjny.
     - `OPENROUTER_MODEL` — np. `openai/gpt-4` (lub inny wspierający JSON Schema).
     - `OPENROUTER_TIMEOUT_MS` — opcjonalnie, np. `60000`.
     - `OPENROUTER_USE_MOCK=false` — aby przełączyć z mocków na produkcję.
   - Przenieś `DEV_CONFIG` do `.env` i dodaj też tę opcję do .env.example ale pustą

2. Nowy klient: `src/lib/services/openrouter.service.ts`
   - Utwórz klasę `OpenRouterClient` z metodą `chatComplete(messages, options)`.
   - Domyślne nagłówki: `Authorization: Bearer <apiKey>`, `Content-Type: application/json`.
   - Obsłuż timeout: `AbortSignal.timeout(timeoutMs)`.
   - Po `response.ok === false` — odczytaj `text()` i rzuć błąd aplikacyjny z kodem HTTP.
   - Zwracaj oprócz `raw` także `parsed` (jeśli `response_format` było ustawione i wynik jest JSON).

3. Integracja z `GenerationService`
   - Wstrzyknij `OpenRouterClient` (np. konstruktorem lub przez prostą inicjalizację wewnątrz metody przy braku DI).
   - Ustaw `USE_MOCK` na wartość wynikającą z ENV (`OPENROUTER_USE_MOCK`). W produkcji: `false`.
   - Buduj żądanie z:
     - `messages`: `[ { role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: source_text } ]`
     - `response_format`: JSON Schema jak powyżej.
     - parametrami modelu (temperature/top_p/max_tokens) — zgodnie z wymogami jakości i kosztu.
   - Odbierz wynik:
     - Jeśli `parsed` dostępne: waliduj przez Zod.
     - W innym przypadku: parsuj `message.content` do JSON i waliduj.
   - Zmapuj do `FlashcardProposalDTO[]` z `source: 'ai-full'` i trymerowaniem pól.

4. Walidacja i schematy
   - Dodaj Zod schema odpowiadający JSON Schema (w tym długości `front`/`back`).
   - Waliduj wynik z modelu (twardo) i zwracaj `AIServiceError('PARSE_ERROR' | 'VALIDATION_ERROR')` przy niezgodnościach.

5. Endpoint `POST /api/generations`
   - Pozostaw walidację wejścia (`GenerateFlashcardsSchema`) i rate limiting.
   - Przekazuj `api_key` i `model` z ENV do `GenerationService.generateFlashcards`.
   - Upewnij się, że w prod `DEV_CONFIG.SKIP_RATE_LIMIT=false` (lub przenieś DEV/PROD do centralnej konfiguracji).

6. Logowanie i monitoring
   - Zapisuj czas (`duration_ms`), model, długość wejścia, skrót (`MD5`) w DB (już wspierane przez `saveGeneration`).
   - Błędy AI loguj przez `logError` (już istnieje) i zapewnij, że nie są logowane pełne treści zapytań.

7. Wdrożenie
   - Ustaw sekrety w środowisku (prod/stage): `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_TIMEOUT_MS`.
   - Przełącz `OPENROUTER_USE_MOCK=false` oraz włącz `RateLimitService` dla produkcji.
   - Obserwuj logi i metryki po wdrożeniu; w razie potrzeby dostosuj parametry modelu i limity czasu.

## Przykładowe szkielety kodu (orientacyjne)

> Uwaga: poniższe to szkice do implementacji zgodnie z istniejącą konwencją TypeScript/Astro. Nazwy plików i importy powinny odpowiadać strukturze projektu.

```typescript
// src/lib/services/openrouter.service.ts (nowy plik)
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface ResponseFormatJsonSchema {
  type: "json_schema";
  json_schema: { name: string; strict: true; schema: unknown };
}
export type ResponseFormat = ResponseFormatJsonSchema; // można rozszerzyć w przyszłości

export class OpenRouterClient {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://openrouter.ai/api/v1/chat/completions",
    private readonly timeoutMs: number = 60000
  ) {}

  async chatComplete(
    messages: ChatMessage[],
    options: {
      model: string;
      response_format?: ResponseFormat;
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
    }
  ): Promise<{ raw: unknown; parsed?: unknown }> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...options, messages }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter error ${response.status}: ${text}`);
    }

    const data = await response.json();
    // Preferowane: message.parsed jeśli model obsłużył response_format; fallback: JSON.parse(content)
    const content = data?.choices?.[0]?.message?.content;
    const parsed =
      data?.choices?.[0]?.message?.parsed ?? (typeof content === "string" ? JSON.parse(content) : undefined);
    return { raw: data, parsed };
  }
}
```

```typescript
// Fragment użycia w GenerationService.generateFlashcards(...)
const client = new OpenRouterClient(api_key);
const { parsed, raw } = await client.chatComplete(
  [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: source_text },
  ],
  {
    model,
    response_format: {
      type: "json_schema",
      json_schema: { name: "FlashcardProposals", strict: true, schema: /* JSON Schema jak wyżej */ {} },
    },
    temperature: 0.7,
    top_p: 0.95,
    max_tokens: 2000,
  }
);

// Walidacja i mapowanie wyniku do FlashcardProposalDTO[]
```
