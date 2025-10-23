# Plan Implementacji Endpointu API: POST /api/generations

## 1. Przegląd Endpointu

Endpoint `POST /api/generations` umożliwia uwierzytelnionym użytkownikom generowanie propozycji fiszek z tekstu źródłowego przy użyciu AI. Ten endpoint stanowi kluczową funkcjonalność opartą na sztucznej inteligencji w aplikacji, wykorzystując Openrouter.ai do analizy dostarczonego tekstu (1000-10000 znaków) i generowania odpowiednich propozycji fiszek.

**Kluczowe charakterystyki:**
- Waliduje 
- Generuje 3-10 propozycji fiszek z tekstu dostarczonego przez użytkownika
- Przechowuje metadane generacji do śledzenia i analityki
- Implementuje rate limiting (10 generacji na użytkownika dziennie) w celu kontroli kosztów
- Loguje błędy API AI do monitorowania i debugowania
- Zwraca propozycje natychmiast bez zapisywania ich jako fiszek (wymagana akceptacja użytkownika)

## 2. Szczegóły Żądania

### Metoda HTTP
`POST`

### Struktura URL
```
/api/generations
```

### Nagłówki
- `Authorization: Bearer <supabase_jwt_token>` (Wymagany)
- `Content-Type: application/json` (Wymagany)

### Treść Żądania
```typescript
{
  "source_text": string // Wymagany, 1000-10000 znaków
}
```

### Parametry
**Wymagane:**
- `source_text` (string): Treść tekstowa, z której będą generowane fiszki
  - Minimalna długość: 1000 znaków
  - Maksymalna długość: 10000 znaków
  - Nie może być pusty ani zawierać tylko białych znaków

**Opcjonalne:**
- Brak

### Przykładowe Żądanie
```bash
POST /api/generations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance... [kontynuacja przez 1000+ znaków]"
}
```

## 3. Szczegóły Odpowiedzi

### Odpowiedź Sukcesu (201 Created)
```typescript
{
  "success": true,
  "data": {
    "generation_id": number,        // Unikalny ID rekordu generacji
    "model": string | null,         // Użyty model AI (np. "openai/gpt-4")
    "duration_ms": number,          // Czas generacji w milisekundach
    "generated_count": number,      // Liczba zwróconych propozycji fiszek
    "flashcards_proposals": [
      {
        "front": string,            // Pytanie/przód fiszki
        "back": string,             // Odpowiedź/tył fiszki
        "source": "ai-full"         // Zawsze "ai-full" dla propozycji
      }
    ]
  }
}
```

### Odpowiedzi Błędów

#### 401 Unauthorized
Brak lub nieprawidłowy token uwierzytelniający (obsługiwany przez middleware).
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

#### 400 Bad Request
Walidacja danych wejściowych nie powiodła się.
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be between 1000 and 10000 characters",
    "details": {
      "field": "source_text",
      "current_length": 500,
      "min_length": 1000,
      "max_length": 10000
    }
  }
}
```

#### 429 Too Many Requests
Przekroczono dzienny limit generacji.
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have reached your daily generation limit. Please try again tomorrow.",
    "retry_after": "2025-10-11T00:00:00Z"
  }
}
```

#### 503 Service Unavailable
Błąd API AI lub niedostępność.
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "Unable to generate flashcards at this time. Please try again later.",
    "details": "Connection timeout to AI service"
  }
}
```

#### 500 Internal Server Error
Błąd bazy danych lub nieoczekiwany błąd serwera.
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

## 4. Wykorzystywane Typy

### Z pliku `src/types.ts`

**Komenda Wejściowa:**
```typescript
export interface GenerateFlashcardsCommand {
  source_text: string; // Min 1000, max 10000 znaków
}
```

**Odpowiedź Wyjściowa:**
```typescript
export interface GenerateFlashcardsResponseDTO {
  generation_id: number;
  model: string | null;
  duration_ms: number;
  generated_count: number;
  flashcards_proposals: FlashcardProposalDTO[];
}
```

**Propozycja Fiszki:**
```typescript
export interface FlashcardProposalDTO {
  front: string;
  back: string;
  source: "ai-full";
}
```

**Wstawianie do Bazy:**
```typescript
export type InsertGenerationData = TablesInsert<"generations">;
// Pola: user_id, duration_ms, model, generated_count, 
//        accepted_unedited_count (0), accepted_edited_count (0),
//        source_text_hash, source_text_length
```

**Logowanie Błędów:**
```typescript
export type InsertGenerationErrorLogData = TablesInsert<"generation_error_logs">;
// Pola: user_id, model, source_text_hash, source_text_length,
//       error_code, error_message
```

**Błąd API:**
```typescript
export interface ApiErrorDTO {
  success: false;
  error: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION_ERROR" 
          | "RATE_LIMIT_EXCEEDED" | "AI_SERVICE_ERROR" | "INTERNAL_ERROR";
    message: string;
    details?: unknown;
  };
}
```

**Błąd Rate Limit:**
```typescript
export interface RateLimitErrorDTO extends Omit<ApiErrorDTO, "error"> {
  error: {
    code: "RATE_LIMIT_EXCEEDED";
    message: string;
    retry_after: string; // Znacznik czasu ISO 8601
  };
}
```

## 5. Przepływ Danych

### Przepływ Wysokiego Poziomu
```
1. Klient wysyła POST /api/generations z source_text
2. Middleware Astro waliduje token JWT i wyciąga user_id
3. Handler route'u waliduje treść żądania używając schematu Zod
4. Sprawdzenie dziennego rate limitu użytkownika (zapytanie do tabeli generations)
5. Obliczenie hashu SHA-256 z source_text
6. Wywołanie API Openrouter.ai z source_text
7. Parsowanie odpowiedzi AI do FlashcardProposalDTO[]
8. Zapisanie metadanych generacji do tabeli generations
9. Zwrócenie odpowiedzi 201 z propozycjami
```

### Szczegółowy Przepływ z Obsługą Błędów

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Żądanie Klienta (POST /api/generations)                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Middleware Astro (src/middleware/index.ts)              │
│    - Wyciągnięcie tokenu Bearer z nagłówka Authorization   │
│    - Walidacja JWT używając Supabase Auth                  │
│    - Wyciągnięcie user_id z tokenu                         │
│    - Wstrzyknięcie user do context.locals                  │
│    → Jeśli nieprawidłowy: Zwrócenie 401 UNAUTHORIZED       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Handler Route'u (src/pages/api/generations.ts)         │
│    - Ustawienie export const prerender = false             │
│    - Pobranie klienta supabase z context.locals            │
│    - Pobranie user_id z context.locals                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Walidacja Wejścia (schemat Zod)                        │
│    - Walidacja obecności source_text                       │
│    - Walidacja typu source_text (string)                   │
│    - Usunięcie białych znaków                              │
│    - Walidacja długości: 1000 ≤ długość ≤ 10000          │
│    → Jeśli nieprawidłowy: Zwrócenie 400 VALIDATION_ERROR  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Sprawdzenie Rate Limit (rateLimit.service)              │
│    - Zapytanie do tabeli generations dla user_id          │
│    - Zliczenie generacji utworzonych dzisiaj (po 00:00)   │
│    - Sprawdzenie czy count >= 10                           │
│    → Jeśli przekroczony: Zwrócenie 429 RATE_LIMIT_EXCEEDED│
│      z retry_after = jutro 00:00 UTC                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Obliczenie Hashu (generation.service)                   │
│    - Obliczenie hashu SHA-256 z source_text               │
│    - Pobranie source_text.length                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Wywołanie API AI (ai.service)                           │
│    - Pobranie OPENROUTER_API_KEY z import.meta.env        │
│    - Przygotowanie żądania do Openrouter.ai               │
│    - Dołączenie wyboru modelu (np. "openai/gpt-4")        │
│    - Dołączenie promptu systemowego do generacji fiszek    │
│    - Dołączenie source_text użytkownika                    │
│    - Ustawienie timeoutu (np. 60 sekund)                   │
│    - Start timera do śledzenia duration_ms                 │
│    → Jeśli błąd: Przejście do kroku 8 (Logowanie Błędu)   │
│    → Jeśli sukces: Przejście do kroku 9 (Parsowanie)      │
└─────────────────────────────────────────────────────────────┘
                          ↓ (ŚCIEŻKA BŁĘDU)
┌─────────────────────────────────────────────────────────────┐
│ 8. Logowanie Błędu (przy niepowodzeniu API AI)            │
│    - Wyciągnięcie kodu i wiadomości błędu z odpowiedzi AI │
│    - Zapis do tabeli generation_error_logs:                │
│      * user_id                                             │
│      * model (jeśli dostępny)                              │
│      * source_text_hash                                    │
│      * source_text_length                                  │
│      * error_code                                          │
│      * error_message                                       │
│    - Zwrócenie 503 AI_SERVICE_ERROR do klienta            │
└─────────────────────────────────────────────────────────────┘
                          ↓ (ŚCIEŻKA SUKCESU)
┌─────────────────────────────────────────────────────────────┐
│ 9. Parsowanie Odpowiedzi AI (aiService)                   │
│    - Zatrzymanie timera duration                           │
│    - Parsowanie odpowiedzi JSON z API AI                   │
│    - Wyciągnięcie tablicy propozycji fiszek                │
│    - Walidacja struktury odpowiedzi                        │
│    - Mapowanie do formatu FlashcardProposalDTO[]           │
│    - Zliczenie wygenerowanych fiszek                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Zapis do Bazy (generation.service)                     │
│    - Utworzenie obiektu InsertGenerationData:             │
│      * user_id                                             │
│      * duration_ms (z timera)                              │
│      * model (z odpowiedzi AI)                             │
│      * generated_count (z tablicy propozycji)              │
│      * accepted_unedited_count = 0 (początkowa)            │
│      * accepted_edited_count = 0 (początkowa)              │
│      * source_text_hash                                    │
│      * source_text_length                                  │
│    - Wstawienie do tabeli generations przez Supabase      │
│    - Pobranie wygenerowanego generation_id                 │
│    → Jeśli błąd DB: Zwrócenie 500 INTERNAL_ERROR          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Budowanie DTO Odpowiedzi                              │
│    - Utworzenie GenerateFlashcardsResponseDTO:            │
│      * generation_id                                       │
│      * model                                               │
│      * duration_ms                                         │
│      * generated_count                                     │
│      * flashcards_proposals                                │
│    - Opakowanie w ApiResponseDTO z success: true          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Zwrócenie Odpowiedzi (201 Created)                    │
│    - Ustawienie Content-Type: application/json            │
│    - Zwrócenie odpowiedzi JSON ze statusem 201            │
└─────────────────────────────────────────────────────────────┘
```

### Interakcje z Bazą Danych

1. **Sprawdzenie Rate Limit:**
   ```sql
   SELECT COUNT(*) FROM generations
   WHERE user_id = $1 
   AND generation_time >= CURRENT_DATE;
   ```

2. **Wstawienie Rekordu Generacji:**
   ```typescript
   await supabase
     .from('generations')
     .insert({
       user_id,
       duration_ms,
       model,
       generated_count,
       accepted_unedited_count: 0,
       accepted_edited_count: 0,
       source_text_hash,
       source_text_length
     })
     .select()
     .single();
   ```

3. **Wstawienie Logu Błędu (przy niepowodzeniu AI):**
   ```typescript
   await supabase
     .from('generation_error_logs')
     .insert({
       user_id,
       model,
       source_text_hash,
       source_text_length,
       error_code,
       error_message
     });
   ```

### Integracja z Zewnętrznym API

**Żądanie do Openrouter.ai:**
```typescript
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer <OPENROUTER_API_KEY>
Content-Type: application/json

{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a flashcard generation expert. Generate 5-8 high-quality flashcards from the provided text. Return only valid JSON in the format: [{\"front\": \"question\", \"back\": \"answer\"}]"
    },
    {
      "role": "user",
      "content": "<source_text>"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 2000
}
```

## 6. Względy Bezpieczeństwa

### Uwierzytelnianie
- **Oparte na Middleware**: Całe uwierzytelnianie obsługiwane przez middleware Astro przed dotarciem do handlera route'u
- **Walidacja JWT**: Supabase Auth waliduje podpis i wygaśnięcie tokenu
- **Kontekst Użytkownika**: ID użytkownika wyciągane z zwalidowanego tokenu i wstrzykiwane do `context.locals`
- **Brak Dostępu Publicznego**: Endpoint wymaga prawidłowego uwierzytelnienia; brak anonimowych żądań

### Autoryzacja
- **Izolacja Użytkowników**: PostgreSQL Row-Level Security (RLS) zapewnia, że użytkownicy mają dostęp tylko do własnych generacji
- **Polityka RLS**: `auth.uid() = user_id` wymuszona na poziomie bazy danych
- **User ID z Tokenu**: Zawsze używaj `user_id` z zwalidowanego tokenu, nigdy z treści żądania

### Ochrona Klucza API
- **Zmienne Środowiskowe**: OPENROUTER_API_KEY przechowywany w zmiennych środowiskowych
- **Tylko po Stronie Serwera**: Klucz API nigdy nie jest ujawniony klientowi
- **Dostęp przez import.meta.env**: Użycie systemu zmiennych środowiskowych Astro
- **Walidacja**: Sprawdzenie obecności klucza API przy starcie

### Sanityzacja Wejścia
- **Usuwanie Białych Znaków**: Usunięcie początkowych/końcowych białych znaków z source_text
- **Walidacja Długości**: Wymuszenie limitu 1000-10000 znaków w celu zapobiegania nadużyciom
- **Walidacja Typu**: Upewnienie się, że source_text jest typu string
- **Brak HTML/Skryptów**: Choć nie przechowujemy source_text, należy być ostrożnym przy przekazywaniu do AI (potencjalny prompt injection)

### Rate Limiting
- **Dzienny Limit**: 10 generacji na użytkownika dziennie
- **Kontrola Kosztów**: Zapobiega nadmiernym kosztom API z Openrouter.ai
- **Zapobieganie Nadużyciom**: Łagodzi potencjalne nadużycia lub automatyczne ataki
- **Granularność**: Limit per-użytkownik używając uwierzytelnionego user_id

### Prywatność Danych
- **Brak Przechowywania Tekstu Źródłowego**: source_text nie jest przechowywany w bazie danych, tylko jego hash i długość
- **Hash do Deduplikacji**: Hash SHA-256 umożliwia wykrywanie duplikatów bez przechowywania rzeczywistej treści
- **Wykluczenie User ID**: DTO odpowiedzi nigdy nie zawierają user_id
- **Zgodność z RODO**: Minimalna zbieranie danych, wszystkie dane użytkownika usuwalne przez kaskadę

### Ujawnianie Informacji o Błędach
- **Ogólne Komunikaty Błędów**: Zewnętrzne błędy zwracają ogólne komunikaty użytkownikom
- **Szczegółowe Logowanie**: Szczegółowe błędy logowane wewnętrznie do debugowania
- **Brak Stack Trace**: Nigdy nie ujawniaj stack trace ani wewnętrznych ścieżek klientom
- **Sanityzacja Błędów AI**: Filtrowanie błędów API AI w celu zapobiegania wyciekowi szczegółów API

## 7. Obsługa Błędów

### Błędy Walidacji (400)

**Warunki Wyzwalające:**
- Brak pola `source_text`
- `source_text` nie jest stringiem
- Długość `source_text` < 1000 znaków
- Długość `source_text` > 10000 znaków
- `source_text` jest pusty lub zawiera tylko białe znaki

**Implementacja:**
```typescript
const GenerateFlashcardsSchema = z.object({
  source_text: z.string()
    .trim()
    .min(1000, "Source text must be at least 1000 characters")
    .max(10000, "Source text must not exceed 10000 characters")
});

try {
  const { source_text } = GenerateFlashcardsSchema.parse(body);
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.errors[0].message,
          details: {
            field: error.errors[0].path[0],
            current_length: body.source_text?.length || 0,
            min_length: 1000,
            max_length: 10000
          }
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
```

### Przekroczenie Rate Limit (429)

**Warunki Wyzwalające:**
- Użytkownik utworzył 10 lub więcej generacji dzisiaj (od 00:00 UTC)

**Implementacja:**
```typescript
const checkRateLimit = async (supabase, userId: string) => {
  const { count, error } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('generation_time', new Date().toISOString().split('T')[0]);

  if (error) throw error;

  if (count >= 10) {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return {
      exceeded: true,
      retryAfter: tomorrow.toISOString()
    };
  }

  return { exceeded: false };
};

// Użycie w handlerze route'u
const rateLimit = await checkRateLimit(supabase, user.id);
if (rateLimit.exceeded) {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "You have reached your daily generation limit. Please try again tomorrow.",
        retry_after: rateLimit.retryAfter
      }
    }),
    { 
      status: 429, 
      headers: { 
        "Content-Type": "application/json",
        "Retry-After": rateLimit.retryAfter
      } 
    }
  );
}
```

### Błędy Usługi AI (503)

**Warunki Wyzwalające:**
- API Openrouter.ai zwraca odpowiedź błędu
- Timeout połączenia do Openrouter.ai
- Błędy sieci
- Nieprawidłowy klucz API
- Przekroczenie rate limit u dostawcy AI

**Implementacja:**
```typescript
try {
  const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens }),
    signal: AbortSignal.timeout(60000) // 60 sekund timeout
  });

  if (!aiResponse.ok) {
    // Logowanie błędu do generation_error_logs
    await supabase.from('generation_error_logs').insert({
      user_id: user.id,
      model,
      source_text_hash: hash,
      source_text_length: sourceText.length,
      error_code: aiResponse.status.toString(),
      error_message: await aiResponse.text()
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "AI_SERVICE_ERROR",
          message: "Unable to generate flashcards at this time. Please try again later.",
          details: "AI service returned an error"
        }
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
} catch (error) {
  // Błąd sieci lub timeout
  await supabase.from('generation_error_logs').insert({
    user_id: user.id,
    model,
    source_text_hash: hash,
    source_text_length: sourceText.length,
    error_code: 'NETWORK_ERROR',
    error_message: error.message
  });

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "AI_SERVICE_ERROR",
        message: "Unable to generate flashcards at this time. Please try again later.",
        details: "Connection timeout to AI service"
      }
    }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}
```

### Błędy Bazy Danych (500)

**Warunki Wyzwalające:**
- Niepowodzenie wstawienia rekordu generacji
- Niepowodzenie wstawienia logu błędu
- Błąd połączenia z Supabase
- Naruszenia ograniczeń

**Implementacja:**
```typescript
try {
  const { data, error } = await supabase
    .from('generations')
    .insert(generationData)
    .select()
    .single();

  if (error) throw error;

  return data;
} catch (error) {
  console.error('Database error:', error);
  
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred. Please try again later."
      }
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}
```

### Nieoczekiwane Błędy (500)

**Warunki Wyzwalające:**
- Nieobsłużone wyjątki
- Błędy parsowania
- Błędy kodu

**Implementacja:**
```typescript
// Opakowanie całego handlera route'u w try-catch
export const POST = async ({ locals, request }: APIContext) => {
  try {
    // ... cała logika handlera route'u
  } catch (error) {
    console.error('Unexpected error in POST /api/generations:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again later."
        }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

## 8. Względy Wydajnościowe

### Optymalizacja Czasu Odpowiedzi

**Docelowa Wydajność:**
- Wywołanie API AI: 2-5 sekund (zależne od Openrouter.ai)
- Operacje bazodanowe: < 100ms łącznie
- Całkowity czas odpowiedzi: 2-6 sekund (zdominowany przez API AI)

**Strategie Optymalizacji:**
1. **Operacje Asynchroniczne**: Użycie async/await dla wszystkich operacji I/O
2. **Równoległe Zapisy do Bazy**: Jeśli potrzebne logowanie błędów, nie blokuj odpowiedzi
3. **Pooling Połączeń**: Supabase automatycznie obsługuje pooling połączeń
4. **Konfiguracja Timeout**: Ustawienie rozsądnych timeoutów (60 sekund dla API AI)

### Optymalizacja Zapytań do Bazy

**Indeksowane Zapytania:**
- Sprawdzenie rate limit używa indeksu na `user_id` i `generation_time`
- Upewnienie się, że istnieje indeks złożony: `CREATE INDEX idx_generations_user_time ON generations(user_id, generation_time)`

**Wydajne Zliczanie:**
```typescript
// Użycie head: true do pobrania liczby bez pobierania danych
const { count } = await supabase
  .from('generations')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .gte('generation_time', todayStart);
```

### Zarządzanie Pamięcią

**Duże Payloady:**
- Tekst źródłowy ograniczony do 10000 znaków (~10KB)
- Odpowiedź AI zazwyczaj < 5KB
- Ślad pamięciowy na żądanie: < 50KB

**Rozważania Streamingu:**
- Dla MVP, użycie standardowego request/response (bez streamingu)
- Przyszła optymalizacja: Streamowanie odpowiedzi AI dla lepszego UX

### Wydajność Logowania Błędów

**Asynchroniczne Logowanie:**
```typescript
// Nie await logowania błędów - fire and forget
supabase
  .from('generation_error_logs')
  .insert(errorData)
  .then(() => console.log('Error logged'))
  .catch(err => console.error('Failed to log error:', err));

// Natychmiastowe zwrócenie odpowiedzi błędu użytkownikowi
return new Response(errorResponse, { status: 503 });
```

### Wydajność Rate Limiting

**Rozważania Cachowania:**
- Dla scenariuszy wysokiego ruchu, cachuj liczniki rate limit w Redis
- Dla MVP, bezpośrednie zapytanie do bazy jest wystarczające
- Zapytanie jest indeksowane i szybkie (< 10ms)

### Wydajność API AI

**Wybór Modelu:**
- Balans między jakością a prędkością
- Szybsze modele: "openai/gpt-3.5-turbo" (1-2s)
- Wyższa jakość: "openai/gpt-4" (3-5s)
- Konfigurowalny przez zmienną środowiskową

**Optymalizacja Tokenów:**
- Wydajny prompt systemowy w celu minimalizacji użycia tokenów
- Żądanie tylko niezbędnych tokenów w parametrze max_tokens
- Typowa generacja: 300-800 tokenów

## 9. Kroki Implementacji

### Krok 1: Konfiguracja Środowiska
1. Dodaj `OPENROUTER_API_KEY` do pliku `.env`
2. Dodaj `OPENROUTER_MODEL` do `.env` (domyślnie: "openai/gpt-4")
3. Zaktualizuj `src/env.d.ts` aby uwzględnić typy zmiennych środowiskowych:
   ```typescript
   interface ImportMetaEnv {
     readonly SUPABASE_URL: string;
     readonly SUPABASE_ANON_KEY: string;
     readonly OPENROUTER_API_KEY: string;
     readonly OPENROUTER_MODEL: string;
   }
   ```
4. Utworzenie pliku endpointu w katalogu `/src/pages/api`, np `generations.ts`

### Krok 2: Utworzenie Funkcji Pomocniczych

**Plik:** `src/lib/utils/hash.ts`
```typescript
export async function calculateSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### Krok 3: Utworzenie Serwisu Rate Limit

**Plik:** `src/lib/services/rateLimit.service.ts`

### Krok 4: Utworzenie Serwisu Generacji

**Plik:** `src/lib/services/generation.service.ts`

- Integruje się z zewnętrznym serwisem AI. Na etapie developmentu skorzystamy z mocków zamiast wywołania serwisu AI.
- Obsługuje logikę zapisue do tabeli `generations` oraz rejestracji błędów w `generation_error_logs`

### Krok 5: Utworzenie Schematu Walidacji Zod

**Plik:** `src/lib/validation/generation.schemas.ts`

### Krok 6: Utworzenie Handlera API Route

**Plik:** `src/pages/api/generations.ts`


### Krok 7: Aktualizacja Typów Środowiskowych

### Krok 8: Dodanie Indeksu Bazy Danych (jeśli brakuje)

**Plik migracji:** `supabase/migrations/[timestamp]_add_generation_rate_limit_index.sql`


### Krok 9: Dokumentacja

1. **Dokumentacja API:**
   - Dodaj endpoint do dokumentacji API
   - Uwzględnij przykłady żądania/odpowiedzi
   - Udokumentuj kody błędów

2. **Zmienne Środowiskowe:**
   - Udokumentuj konfigurację OPENROUTER_API_KEY
   - Udokumentuj opcje OPENROUTER_MODEL

3. **Rate Limits:**
   - Udokumentuj dzienny limit (10/dzień)
   - Wyjaśnij zachowanie retry_after

### Krok 10: Monitorowanie i Logowanie

1. **Dodaj punkty logowania:**
   - Otrzymane żądania generacji
   - Trafienia rate limit
   - Czas trwania wywołania API AI
   - Niepowodzenia operacji bazodanowych

2. **Skonfiguruj monitorowanie:**
   - Śledź tabelę generation_error_logs
   - Alerty przy wysokich wskaźnikach błędów
   - Monitoruj czasy odpowiedzi API AI

### Krok 11: Checklist Wdrożenia

- [ ] Zmienne środowiskowe ustawione w produkcji
- [ ] Migracje bazy danych zastosowane
- [ ] Endpoint API przetestowany na stagingu
- [ ] Rate limiting zweryfikowany
- [ ] Logowanie błędów potwierdzone jako działające
- [ ] Load testing zakończony (jeśli dotyczy)
- [ ] Dokumentacja zaktualizowana
- [ ] Zespół przeszkolony z nowego endpointu

---

## 10. Dodatkowe Uwagi

### Przyszłe Ulepszenia

1. **Cachowanie:**
   - Cachuj odpowiedzi AI na podstawie source_text_hash
   - Sprawdź czy hash istnieje przed wywołaniem API AI
   - Znaczne oszczędności kosztów dla duplikatów żądań

2. **Progresywne Ulepszenia:**
   - Streamuj odpowiedzi AI dla lepszego UX
   - Pokazuj fiszki w miarę ich generowania

3. **Przetwarzanie Wsadowe:**
   - Pozwól na wiele source_texts w jednym żądaniu
   - Generuj fiszki równolegle

4. **Wybór Modelu:**
   - Pozwól użytkownikowi wybrać model AI
   - Balansuj preferencje koszt vs jakość

5. **Ocena Jakości:**
   - Śledź wskaźniki akceptacji użytkowników per model
   - Automatycznie wybieraj najlepiej działający model

### Optymalizacja Kosztów

1. **Wybór Modelu:**
   - Używaj tańszych modeli do testowania
   - Zarezerwuj drogie modele dla produkcji

2. **Rate Limiting:**
   - Obecny limit: 10/dzień
   - Dostosuj na podstawie analizy kosztów

3. **Cachowanie Odpowiedzi:**
   - Przechowuj odpowiedzi AI dla identycznych source_text_hash
   - Pobieraj z cache zamiast wywoływać API

### Najlepsze Praktyki Bezpieczeństwa

1. **Rotacja Klucza API:**
   - Regularnie rotuj OPENROUTER_API_KEY
   - Monitoruj nieautoryzowane użycie

2. **Walidacja Wejścia:**
   - Ścisłe limity znaków zapobiegają nadużyciom
   - Rozważ dodanie filtrowania treści

3. **Walidacja Wyjścia:**
   - Waliduj strukturę odpowiedzi AI
   - Sanityzuj treść fiszek przed przechowywaniem

### Względy Zgodności

1. **RODO:**
   - source_text nie jest przechowywany, tylko hash
   - Użytkownik może usunąć wszystkie generacje przez kaskadę

2. **Retencja Danych:**
   - Rozważ TTL dla generation_error_logs
   - Archiwizuj stare generacje po X miesiącach

3. **Zgodność Dostawcy AI:**
   - Przejrzyj warunki przetwarzania danych Openrouter.ai
   - Zapewnij zgodę użytkownika na przetwarzanie AI
