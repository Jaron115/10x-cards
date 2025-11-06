# API Endpoint Implementation Plan: Study Session

## 1. Przegląd punktu końcowego

### Cel biznesowy

Umożliwienie użytkownikom przeprowadzenia sesji nauki z wykorzystaniem utworzonych fiszek w prostym, intuicyjnym interfejsie.

### Zakres funkcjonalności MVP

- Pobieranie fiszek użytkownika do sesji nauki
- Losowa kolejność prezentacji fiszek
- Filtrowanie po źródle fiszki (manual, ai-full, ai-edited)
- Limit liczby fiszek w jednej sesji
- Client-side zarządzanie stanem sesji (flip karty, tracking postępów)

### Ograniczenia MVP

Implementacja **nie obejmuje** pełnego algorytmu spaced repetition, który wymagałby:

- Dodatkowej tabeli `flashcard_reviews` w bazie danych
- Endpoint do zapisywania wyników powtórek (`POST /api/study/review`)
- Algorytmu SM-2 lub Leitner system
- Historii powtórek i statystyk długoterminowych

Te funkcjonalności są zaplanowane jako rozszerzenia post-MVP.

---

## 2. Szczegóły żądania

### Endpoint

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/study/session`
- **Autentykacja:** Wymagana (Bearer token w header `Authorization`)

### Parametry Query

#### Wymagane:

Brak (wszystkie parametry są opcjonalne)

#### Opcjonalne:

| Parametr  | Typ               | Wartość domyślna | Walidacja                              | Opis                                  |
| --------- | ----------------- | ---------------- | -------------------------------------- | ------------------------------------- |
| `limit`   | `number`          | `20`             | Min: 1, Max: 50                        | Liczba fiszek w sesji                 |
| `source`  | `FlashcardSource` | brak             | Enum: "manual", "ai-full", "ai-edited" | Filtrowanie po źródle fiszki          |
| `shuffle` | `boolean`         | `true`           | boolean                                | Czy tasować fiszki (losowa kolejność) |

### Przykładowe żądania

**Podstawowe (domyślne parametry):**

```http
GET /api/study/session
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Z parametrami:**

```http
GET /api/study/session?limit=30&source=ai-full&shuffle=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body

Brak (metoda GET)

---

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

```typescript
// Dodać do src/types.ts

/**
 * Query parameters for GET /api/study/session
 */
export interface GetStudySessionQuery {
  limit?: number; // Default: 20, min: 1, max: 50
  source?: FlashcardSource; // Filter by source (optional)
  shuffle?: boolean; // Default: true
}

/**
 * Response for GET /api/study/session
 */
export interface GetStudySessionResponse {
  session_id: string; // UUID v4 generated on server
  flashcards: FlashcardDTO[]; // Array of flashcards for study
  total_count: number; // Number of flashcards in this session
  user_total_flashcards: number; // Total flashcards user owns
}

/**
 * Client-side study session state
 */
export interface StudySessionState {
  flashcards: FlashcardDTO[];
  currentCardIndex: number;
  isFlipped: boolean;
  reviewResults: Array<{
    flashcard_id: number;
    known: boolean;
  }>;
  sessionStats: {
    total: number;
    reviewed: number;
    known: number;
    unknown: number;
  };
}
```

### Validation Schema (Zod)

```typescript
// Utworzyć: src/lib/schemas/study.schemas.ts

import { z } from "zod";

export const getStudySessionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),
  source: z.enum(["manual", "ai-full", "ai-edited"]).optional(),
  shuffle: z
    .string()
    .optional()
    .transform((val) => val !== "false") // Default true
    .pipe(z.boolean()),
});

export type GetStudySessionQuerySchema = z.infer<typeof getStudySessionQuerySchema>;
```

### Istniejące typy do wykorzystania

- `FlashcardDTO` - z `src/types.ts`
- `FlashcardSource` - z `src/types.ts`
- `ApiResponseDTO<T>` - z `src/types.ts`
- `ApiErrorDTO` - z `src/types.ts`

---

## 4. Szczegóły odpowiedzi

### Success Response

**HTTP Status:** `200 OK`

**Content-Type:** `application/json`

**Body:**

```json
{
  "success": true,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "flashcards": [
      {
        "id": 1,
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces",
        "source": "ai-full",
        "generation_id": 123,
        "created_at": "2025-10-10T10:00:00Z",
        "updated_at": "2025-10-10T10:00:00Z"
      },
      {
        "id": 5,
        "front": "What is TypeScript?",
        "back": "A typed superset of JavaScript",
        "source": "manual",
        "generation_id": null,
        "created_at": "2025-10-11T14:30:00Z",
        "updated_at": "2025-10-11T14:30:00Z"
      }
    ],
    "total_count": 2,
    "user_total_flashcards": 150
  }
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authentication token"
  }
}
```

#### 400 Bad Request (Invalid parameters)

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "limit": ["Limit must be between 1 and 50"]
    }
  }
}
```

#### 404 Not Found (No flashcards - user has none)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No flashcards available for study. Please create some flashcards first.",
    "details": {
      "user_total_flashcards": 0
    }
  }
}
```

#### 404 Not Found (No flashcards matching filters)

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "No flashcards match the selected filters.",
    "details": {
      "user_total_flashcards": 150
    }
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to load study session. Please try again later."
  }
}
```

---

## 5. Przepływ danych

### Backend Data Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ GET /api/study/session?limit=20&shuffle=true
       ↓
┌──────────────────────────────────────────────────┐
│  Astro Middleware (src/middleware/index.ts)      │
│  - Validate JWT token from Authorization header  │
│  - Extract user_id from token                    │
│  - Inject user & supabase to context.locals      │
└──────┬───────────────────────────────────────────┘
       │ Context with authenticated user
       ↓
┌──────────────────────────────────────────────────┐
│  API Route (src/pages/api/study/session.ts)     │
│  - Route to GetStudySessionHandler               │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Handler (GetStudySessionHandler)                │
│  1. Parse & validate query parameters (Zod)      │
│  2. Call StudyService.getFlashcardsForStudy()    │
│  3. Check if flashcards exist                    │
│  4. Generate session_id (UUID v4)                │
│  5. Format response (DTO)                        │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Service (StudyService)                          │
│  1. Build Supabase query:                        │
│     - SELECT id, front, back, source, ...        │
│     - WHERE user_id = $userId (automatic RLS)    │
│     - AND source = $source (if filter provided)  │
│     - ORDER BY created_at DESC                   │
│     - LIMIT $limit                               │
│  2. Execute query via Supabase client            │
│  3. Shuffle array client-side (Fisher-Yates)     │
│  4. Get total user flashcards count              │
│  5. Return flashcards + metadata                 │
└──────┬───────────────────────────────────────────┘
       │
       ↓
┌──────────────────────────────────────────────────┐
│  Supabase / PostgreSQL                           │
│  - Row-Level Security ensures user isolation     │
│  - Use index: idx_flashcards_user_id             │
│  - Return matching flashcards                    │
└──────┬───────────────────────────────────────────┘
       │ Flashcards data
       ↓
┌──────────────────────────────────────────────────┐
│  Response to Client                              │
│  - 200 OK with flashcards array                  │
│  - or appropriate error (401, 404, 500)          │
└──────────────────────────────────────────────────┘
```

### Frontend Data Flow

```
┌─────────────────────────────────────────────┐
│  StudyView Component (React)                │
│  - Mount → useStudySession() hook           │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  useStudySession Hook                       │
│  1. useEffect → fetchSession()              │
│  2. Call apiClient.get('/api/study/session')│
│  3. Handle response                         │
└──────┬──────────────────────────────────────┘
       │
       ↓ Success
┌─────────────────────────────────────────────┐
│  Initialize Session State                   │
│  {                                          │
│    flashcards: [...],                       │
│    currentCardIndex: 0,                     │
│    isFlipped: false,                        │
│    reviewResults: [],                       │
│    sessionStats: {                          │
│      total: 20,                             │
│      reviewed: 0,                           │
│      known: 0,                              │
│      unknown: 0                             │
│    }                                        │
│  }                                          │
└──────┬──────────────────────────────────────┘
       │
       ↓
┌─────────────────────────────────────────────┐
│  Render UI                                  │
│  - FlashcardDisplay (current card)          │
│  - Progress bar                             │
│  - Action buttons                           │
└──────┬──────────────────────────────────────┘
       │
       ↓ User interactions
┌─────────────────────────────────────────────┐
│  User Actions (Client-side only)            │
│  - flipCard() → toggle isFlipped            │
│  - markAsKnown() → save result, next card   │
│  - markAsUnknown() → save result, next card │
│  - All state changes in React state         │
│  - No API calls during session              │
└──────┬──────────────────────────────────────┘
       │
       ↓ Session complete
┌─────────────────────────────────────────────┐
│  SessionSummary Component                   │
│  - Display stats (total, known, unknown)    │
│  - Accuracy percentage                      │
│  - Actions: restart / back to flashcards    │
└─────────────────────────────────────────────┘
```

### Baza danych

**Wykorzystywane tabele:**

- `flashcards` - źródło danych dla sesji nauki

**Wykorzystywane indeksy:**

- `idx_flashcards_user_id` - dla szybkiego filtrowania po user_id

**RLS Policies:**

- Automatyczne filtrowanie: `WHERE auth.uid() = user_id`

---

## 6. Względy bezpieczeństwa

### Autentykacja i Autoryzacja

1. **JWT Token Validation:**
   - Token Bearer wymagany w każdym żądaniu
   - Walidacja w middleware przed przetworzeniem żądania
   - Token zawiera `user_id` używany do filtrowania danych

2. **Row-Level Security (RLS):**
   - Wszystkie zapytania do tabeli `flashcards` chronione RLS
   - Policy: `auth.uid() = user_id`
   - Użytkownik nie może pobrać fiszek innych użytkowników
   - Dodatkowa warstwa ochrony poza aplikacyjną autoryzacją

3. **Authorization Checks:**
   - Middleware `requireAuth()` weryfikuje sesję przed dostępem do endpointu
   - Brak możliwości obejścia autoryzacji na poziomie API

### Walidacja danych wejściowych

1. **Query Parameters Validation:**
   - Zod schema zapewnia type-safe walidację
   - Limit: wymuszony zakres 1-50 (zapobieganie over-fetching)
   - Source: tylko dozwolone wartości z enum
   - Shuffle: konwersja string → boolean z domyślną wartością

2. **SQL Injection Prevention:**
   - Wykorzystanie Supabase client z parametryzowanymi zapytaniami
   - Brak bezpośredniego SQL, wszystko przez ORM
   - Automatyczne escapowanie wartości

3. **XSS Prevention:**
   - Dane wyjściowe (front, back) są już sanityzowane przy zapisie
   - React automatycznie escapuje content w JSX
   - Brak użycia `dangerouslySetInnerHTML`

### Rate Limiting

- Wykorzystanie istniejącego rate limiting middleware
- Limit: 100 requests/minute per user
- Endpoint read-only, niskie ryzyko abuse
- Brak specjalnego rate limiting dla tego endpointu (nie jest resource-intensive)

### CORS i Headers

- Endpoint dostępny tylko z tej samej domeny (same-origin policy)
- Brak publicznego CORS
- Headers: `Content-Type: application/json`

---

## 7. Obsługa błędów

### Backend Error Handling

#### 1. Validation Errors (400 Bad Request)

**Przypadek:** Nieprawidłowe query parameters

```typescript
// Handler
const validationResult = getStudySessionQuerySchema.safeParse(queryParams);

if (!validationResult.success) {
  return createErrorResponse(
    400,
    "VALIDATION_ERROR",
    "Invalid query parameters",
    validationResult.error.flatten().fieldErrors
  );
}
```

**Przykłady błędów:**

- `limit=100` (przekracza max 50)
- `limit=-5` (mniejsze niż min 1)
- `source=invalid` (nie jest wartością enum)

#### 2. Not Found Errors (404)

**Przypadek A:** Użytkownik nie ma żadnych fiszek

```typescript
if (flashcards.length === 0) {
  const userTotalCount = await studyService.getUserFlashcardsCount(userId);

  if (userTotalCount === 0) {
    return createErrorResponse(
      404,
      "NOT_FOUND",
      "No flashcards available for study. Please create some flashcards first.",
      { user_total_flashcards: 0 }
    );
  }
}
```

**Przypadek B:** Żadna fiszka nie pasuje do filtrów

```typescript
return createErrorResponse(404, "NOT_FOUND", "No flashcards match the selected filters.", {
  user_total_flashcards: userTotalCount,
});
```

#### 3. Authentication Errors (401)

**Przypadek:** Brak lub nieprawidłowy token

- Obsługa w middleware, zanim żądanie dotrze do handlera
- Standardowa odpowiedź: `UNAUTHORIZED`

#### 4. Database Errors (500)

**Przypadek:** Błąd Supabase/PostgreSQL

```typescript
try {
  const { data, error } = await supabase.from("flashcards").select(...);

  if (error) {
    console.error("Failed to fetch flashcards for study:", error);
    throw new Error("Failed to fetch flashcards for study");
  }
} catch (error) {
  console.error("Study session error:", error);
  return createErrorResponse(
    500,
    "INTERNAL_ERROR",
    "Unable to load study session. Please try again later."
  );
}
```

**Logowanie:**

- Błędy logowane do console.error z kontekstem
- Szczegóły błędu nie ujawniane użytkownikowi (bezpieczeństwo)

### Frontend Error Handling

#### 1. Network Errors

```typescript
try {
  const response = await apiClient.get(`/api/study/session?${params}`);

  if (!response.ok) {
    if (response.status === 404) {
      setError("Nie masz jeszcze żadnych fiszek. Utwórz je w Generatorze AI!");
    } else if (response.status === 401) {
      // Redirect to login (handled by apiClient)
    } else {
      setError("Nie udało się załadować sesji nauki. Spróbuj ponownie.");
    }
    return;
  }
} catch (err) {
  setError("Wystąpił błąd podczas ładowania sesji nauki.");
  console.error("Study session fetch error:", err);
}
```

#### 2. Empty State

```typescript
// Gdy data.flashcards.length === 0
// Pokaż UI z informacją i CTA do /app/generator
```

#### 3. Loading States

```typescript
// Skeleton UI podczas ładowania
// Zapobieganie race conditions przy ponownym fetchowaniu
```

### Error Recovery Strategies

1. **Retry Logic (opcjonalne):**
   - Frontend może zaimplementować automatyczny retry dla błędów 5xx
   - Exponential backoff: 1s, 2s, 4s
   - Max 3 próby

2. **Graceful Degradation:**
   - Jeśli shuffle nie działa → zwróć w kolejności chronologicznej
   - Jeśli nie można pobrać total_count → zwróć 0 (nie blokuje sesji)

3. **User Feedback:**
   - Wszystkie błędy wyświetlane jako toast notifications lub error states
   - Jasne komunikaty po polsku
   - Akcje pomocnicze (np. link do generatora fiszek)

---

## 8. Rozważania dotyczące wydajności

### Optymalizacje zapytań bazy danych

1. **Indeksy:**
   - Wykorzystanie `idx_flashcards_user_id` dla szybkiego filtrowania
   - Query optimizer PostgreSQL automatycznie używa indeksu
   - Oczekiwany czas: < 50ms dla 10k fiszek użytkownika

2. **Limit wyników:**
   - Max 50 fiszek na sesję zapobiega over-fetching
   - Typowa sesja: 20 fiszek (default)
   - Reducja transferu danych i czasu przetwarzania

3. **SELECT tylko potrzebnych kolumn:**
   - Brak SELECT \* - tylko: id, front, back, source, generation_id, timestamps
   - Wykluczenie `user_id` (niepotrzebne w response)

4. **Connection Pooling:**
   - Supabase zapewnia connection pooling
   - Brak potrzeby ręcznego zarządzania połączeniami

### Frontend Performance

1. **Single API Call:**
   - Fiszki pobierane raz na początku sesji
   - Cała logika sesji zarządzana client-side
   - Brak dodatkowych roundtrips do API podczas nauki

2. **Lazy Loading:**
   - Komponent `StudyView` ładowany z `client:load`
   - Minimalizacja initial bundle size

3. **React Optimization:**
   - useState dla lokalnego stanu sesji
   - Brak nadmiernych re-renders
   - Memoization dla drogich obliczeń (jeśli potrzebne)

4. **Animation Performance:**
   - Framer Motion dla płynnych animacji flip
   - GPU-accelerated transforms
   - Brak layout thrashing

### Caching Strategy

#### MVP (bez cache'owania):

- Każda sesja pobiera świeże dane z API
- Proste, przewidywalne zachowanie

#### Post-MVP (opcjonalne):

```typescript
// SessionStorage dla cache'owania sesji
const CACHE_KEY = "study_session";
const CACHE_TTL = 15 * 60 * 1000; // 15 minut

// Save to cache
sessionStorage.setItem(
  CACHE_KEY,
  JSON.stringify({
    data: flashcards,
    timestamp: Date.now(),
  })
);

// Load from cache
const cached = sessionStorage.getItem(CACHE_KEY);
if (cached) {
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp < CACHE_TTL) {
    return data; // Use cached data
  }
}
```

**Korzyści:**

- Szybsze wznawianie sesji
- Mniejsze obciążenie API

**Komplikacje:**

- Invalidacja cache przy aktualizacji/usunięciu fiszki
- Synchronizacja między kartami przeglądarki

### Wąskie gardła i monitoring

**Potencjalne bottlenecks:**

1. **Duża liczba fiszek użytkownika (>10k):**
   - Mitigacja: Limit 50 + paginacja w przyszłości
   - Rozwiązanie: Indexy + PostgreSQL LIMIT clause

2. **Shuffle client-side:**
   - Fisher-Yates: O(n) - bardzo szybkie dla n≤50
   - Alternative: PostgreSQL ORDER BY RANDOM() (wolniejsze, ale możliwe)

3. **Concurrent users:**
   - Read-only endpoint, wysoka skalowalność
   - Supabase pooling radzi sobie z tysiącami równoczesnych połączeń

**Metryki do monitorowania:**

- Response time (target: p95 < 200ms)
- Error rate (target: < 1%)
- Throughput (requests/second)
- Database query time

---

## 9. Etapy wdrożenia

### Faza 1: Backend Foundation (Szacowany czas: 2-3h)

#### Krok 1.1: Definicje typów TypeScript

**Plik:** `src/types.ts`

```typescript
// Dodać na końcu pliku:

// ============================================================================
// Study Session Types
// ============================================================================

/**
 * Query parameters for GET /api/study/session
 */
export interface GetStudySessionQuery {
  limit?: number;
  source?: FlashcardSource;
  shuffle?: boolean;
}

/**
 * Response for GET /api/study/session
 */
export interface GetStudySessionResponse {
  session_id: string;
  flashcards: FlashcardDTO[];
  total_count: number;
  user_total_flashcards: number;
}

/**
 * Client-side study session state
 */
export interface StudySessionState {
  flashcards: FlashcardDTO[];
  currentCardIndex: number;
  isFlipped: boolean;
  reviewResults: Array<{
    flashcard_id: number;
    known: boolean;
  }>;
  sessionStats: {
    total: number;
    reviewed: number;
    known: number;
    unknown: number;
  };
}
```

**Weryfikacja:**

- TypeScript kompiluje się bez błędów
- Typy dostępne w innych plikach

---

#### Krok 1.2: Zod validation schema

**Plik:** `src/lib/schemas/study.schemas.ts` (nowy plik)

```typescript
import { z } from "zod";

export const getStudySessionQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .refine((val) => val >= 1 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),
  source: z.enum(["manual", "ai-full", "ai-edited"]).optional(),
  shuffle: z
    .string()
    .optional()
    .transform((val) => val !== "false")
    .pipe(z.boolean()),
});

export type GetStudySessionQuerySchema = z.infer<typeof getStudySessionQuerySchema>;
```

**Weryfikacja:**

- Import działa poprawnie
- Schema parsuje przykładowe dane

---

#### Krok 1.3: Service Layer

**Plik:** `src/lib/services/study/study.service.ts` (nowy plik)

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDTO, GetStudySessionQuery } from "@/types";

export class StudyService {
  constructor(private supabase: SupabaseClient) {}

  async getFlashcardsForStudy(
    userId: string,
    params: GetStudySessionQuery
  ): Promise<{ flashcards: FlashcardDTO[]; totalCount: number }> {
    const { limit = 20, source, shuffle = true } = params;

    let query = this.supabase
      .from("flashcards")
      .select("id, front, back, source, generation_id, created_at, updated_at", {
        count: "exact",
      });

    if (source) {
      query = query.eq("source", source);
    }

    query = query.order("created_at", { ascending: false }).limit(limit);

    const { data, error, count } = await query;

    if (error) {
      console.error("Failed to fetch flashcards for study:", error);
      throw new Error("Failed to fetch flashcards for study");
    }

    const flashcards = shuffle && data ? this.shuffleArray([...data]) : data || [];

    return {
      flashcards: flashcards as FlashcardDTO[],
      totalCount: count || 0,
    };
  }

  async getUserFlashcardsCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase.from("flashcards").select("*", { count: "exact", head: true });

    if (error) {
      console.error("Failed to get user flashcards count:", error);
      return 0;
    }

    return count || 0;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}
```

**Weryfikacja:**

- Service kompiluje się
- Metody mają poprawne sygnatury

---

#### Krok 1.4: Export service

**Plik:** `src/lib/services/study/index.ts` (nowy plik)

```typescript
export * from "./study.service";
```

---

#### Krok 1.5: API Handler

**Plik:** `src/lib/api-handlers/study/GetStudySessionHandler.ts` (nowy plik)

```typescript
import { AuthenticatedHandler } from "@/lib/api-handlers/AuthenticatedHandler";
import { createErrorResponse, createSuccessResponse } from "@/lib/errors";
import { StudyService } from "@/lib/services/study/study.service";
import { getStudySessionQuerySchema } from "@/lib/schemas/study.schemas";
import type { APIContext } from "astro";
import type { GetStudySessionResponse } from "@/types";
import { v4 as uuidv4 } from "uuid";

export class GetStudySessionHandler extends AuthenticatedHandler {
  async GET(context: APIContext): Promise<Response> {
    try {
      const url = new URL(context.request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());

      const validationResult = getStudySessionQuerySchema.safeParse(queryParams);

      if (!validationResult.success) {
        return createErrorResponse(
          400,
          "VALIDATION_ERROR",
          "Invalid query parameters",
          validationResult.error.flatten().fieldErrors
        );
      }

      const params = validationResult.data;
      const studyService = new StudyService(context.locals.supabase);

      const { flashcards, totalCount } = await studyService.getFlashcardsForStudy(context.locals.user!.id, params);

      if (flashcards.length === 0) {
        const userTotalCount = await studyService.getUserFlashcardsCount(context.locals.user!.id);

        if (userTotalCount === 0) {
          return createErrorResponse(
            404,
            "NOT_FOUND",
            "No flashcards available for study. Please create some flashcards first.",
            { user_total_flashcards: 0 }
          );
        }

        return createErrorResponse(404, "NOT_FOUND", "No flashcards match the selected filters.", {
          user_total_flashcards: userTotalCount,
        });
      }

      const sessionId = uuidv4();

      const responseData: GetStudySessionResponse = {
        session_id: sessionId,
        flashcards,
        total_count: flashcards.length,
        user_total_flashcards: totalCount,
      };

      return createSuccessResponse(responseData);
    } catch (error) {
      console.error("Get study session error:", error);
      return createErrorResponse(500, "INTERNAL_ERROR", "Unable to load study session. Please try again later.");
    }
  }
}
```

**Weryfikacja:**

- Handler dziedziczy po `AuthenticatedHandler`
- Wszystkie importy dostępne

---

#### Krok 1.6: API Endpoint

**Katalog:** `src/pages/api/study/` (nowy katalog)  
**Plik:** `src/pages/api/study/session.ts` (nowy plik)

```typescript
import type { APIRoute } from "astro";
import { GetStudySessionHandler } from "@/lib/api-handlers/study/GetStudySessionHandler";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const handler = new GetStudySessionHandler();
  return handler.handle(context);
};
```

**Weryfikacja:**

- Endpoint dostępny pod `/api/study/session`
- Zwraca 401 bez tokena
- Zwraca 404 dla użytkownika bez fiszek

---

### Faza 2: Frontend Components (Szacowany czas: 2-3h)

#### Krok 2.1: Custom Hook - useStudySession

**Plik:** `src/components/study/useStudySession.ts` (nowy plik)

```typescript
import { useState, useEffect } from "react";
import type { FlashcardDTO, StudySessionState, GetStudySessionQuery } from "@/types";
import { apiClient } from "@/lib/api/apiClient";

interface UseStudySessionReturn {
  session: StudySessionState | null;
  isLoading: boolean;
  error: string | null;
  flipCard: () => void;
  markAsKnown: () => void;
  markAsUnknown: () => void;
  restartSession: () => void;
  isSessionComplete: boolean;
}

export function useStudySession(queryParams: GetStudySessionQuery = {}): UseStudySessionReturn {
  const [session, setSession] = useState<StudySessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (queryParams.limit) params.append("limit", queryParams.limit.toString());
      if (queryParams.source) params.append("source", queryParams.source);
      if (queryParams.shuffle !== undefined) params.append("shuffle", queryParams.shuffle.toString());

      const response = await apiClient.get(`/api/study/session?${params.toString()}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Nie masz jeszcze żadnych fiszek. Utwórz je w Generatorze AI!");
        } else {
          setError("Nie udało się załadować sesji nauki. Spróbuj ponownie.");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      setSession({
        flashcards: data.data.flashcards,
        currentCardIndex: 0,
        isFlipped: false,
        reviewResults: [],
        sessionStats: {
          total: data.data.flashcards.length,
          reviewed: 0,
          known: 0,
          unknown: 0,
        },
      });
    } catch (err) {
      setError("Wystąpił błąd podczas ładowania sesji nauki.");
      console.error("Study session fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  function flipCard() {
    if (!session) return;
    setSession({ ...session, isFlipped: !session.isFlipped });
  }

  function markAsKnown() {
    moveToNextCard(true);
  }

  function markAsUnknown() {
    moveToNextCard(false);
  }

  function moveToNextCard(known: boolean) {
    if (!session) return;

    const currentFlashcard = session.flashcards[session.currentCardIndex];

    setSession({
      ...session,
      currentCardIndex: session.currentCardIndex + 1,
      isFlipped: false,
      reviewResults: [...session.reviewResults, { flashcard_id: currentFlashcard.id, known }],
      sessionStats: {
        ...session.sessionStats,
        reviewed: session.sessionStats.reviewed + 1,
        known: known ? session.sessionStats.known + 1 : session.sessionStats.known,
        unknown: !known ? session.sessionStats.unknown + 1 : session.sessionStats.unknown,
      },
    });
  }

  function restartSession() {
    fetchSession();
  }

  const isSessionComplete = session !== null && session.currentCardIndex >= session.flashcards.length;

  return {
    session,
    isLoading,
    error,
    flipCard,
    markAsKnown,
    markAsUnknown,
    restartSession,
    isSessionComplete,
  };
}
```

**Weryfikacja:**

- Hook kompiluje się bez błędów
- Typy poprawne

---

#### Krok 2.2: FlashcardDisplay Component

**Plik:** `src/components/study/FlashcardDisplay.tsx` (nowy plik)

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FlashcardDisplayProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlashcardDisplay({
  front,
  back,
  isFlipped,
  onFlip,
}: FlashcardDisplayProps) {
  return (
    <div
      className="relative w-full min-h-64 cursor-pointer"
      onClick={onFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onFlip();
        }
      }}
      aria-label={isFlipped ? "Pokaż przód fiszki" : "Pokaż tył fiszki"}
    >
      <Card
        className={cn(
          "w-full min-h-64 flex items-center justify-center p-8 transition-opacity duration-300",
          isFlipped && "opacity-0 absolute"
        )}
      >
        <CardContent className="text-center p-0">
          <p className="text-sm text-muted-foreground mb-2">Przód</p>
          <p className="text-xl font-medium">{front}</p>
        </CardContent>
      </Card>

      <Card
        className={cn(
          "w-full min-h-64 flex items-center justify-center p-8 transition-opacity duration-300 bg-primary/5",
          !isFlipped && "opacity-0 absolute"
        )}
      >
        <CardContent className="text-center p-0">
          <p className="text-sm text-muted-foreground mb-2">Tył</p>
          <p className="text-lg">{back}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Uwaga:** Uproszczona wersja bez framer-motion (łatwiejsza implementacja MVP). Można dodać animacje później.

**Weryfikacja:**

- Komponent renderuje się
- Kliknięcie przełącza widok
- Dostępność klawiatury działa

---

#### Krok 2.3: SessionSummary Component

**Plik:** `src/components/study/SessionSummary.tsx` (nowy plik)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import type { StudySessionState } from "@/types";

interface SessionSummaryProps {
  sessionStats: StudySessionState["sessionStats"];
  onRestart: () => void;
  onBackToFlashcards: () => void;
}

export function SessionSummary({
  sessionStats,
  onRestart,
  onBackToFlashcards,
}: SessionSummaryProps) {
  const accuracy =
    sessionStats.total > 0
      ? Math.round((sessionStats.known / sessionStats.total) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Podsumowanie sesji
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{sessionStats.total}</p>
            <p className="text-sm text-muted-foreground">Razem</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-3xl font-bold">{sessionStats.known}</p>
            </div>
            <p className="text-sm text-muted-foreground">Znam</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-red-600">
              <XCircle className="h-5 w-5" />
              <p className="text-3xl font-bold">{sessionStats.unknown}</p>
            </div>
            <p className="text-sm text-muted-foreground">Nie znam</p>
          </div>
        </div>

        <div className="text-center p-4 bg-muted rounded-lg">
          <p className="text-4xl font-bold text-primary">{accuracy}%</p>
          <p className="text-sm text-muted-foreground">Skuteczność</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={onRestart} size="lg" className="w-full">
            Rozpocznij ponownie
          </Button>
          <Button
            onClick={onBackToFlashcards}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Wróć do fiszek
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Weryfikacja:**

- Statystyki wyświetlają się poprawnie
- Przyciski działają
- Procentowa skuteczność oblicza się poprawnie

---

#### Krok 2.4: StudyView Component (replacement)

**Plik:** `src/components/study/StudyView.tsx` (nadpisać istniejący)

```typescript
import { useStudySession } from "./useStudySession";
import { FlashcardDisplay } from "./FlashcardDisplay";
import { SessionSummary } from "./SessionSummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Eye } from "lucide-react";

export function StudyView() {
  const {
    session,
    isLoading,
    error,
    flipCard,
    markAsKnown,
    markAsUnknown,
    restartSession,
    isSessionComplete,
  } = useStudySession({ limit: 20, shuffle: true });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <Skeleton className="h-64 w-full mb-6" />
        <div className="flex gap-4">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <a href="/app/generator">Wygeneruj fiszki</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/app/flashcards">Dodaj ręcznie</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isSessionComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Sesja nauki</h1>
        <SessionSummary
          sessionStats={session.sessionStats}
          onRestart={restartSession}
          onBackToFlashcards={() => (window.location.href = "/app/flashcards")}
        />
      </div>
    );
  }

  const currentFlashcard = session.flashcards[session.currentCardIndex];
  const progress = (session.currentCardIndex / session.flashcards.length) * 100;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sesja nauki</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>
            Fiszka {session.currentCardIndex + 1} z {session.flashcards.length}
          </span>
          <span>•</span>
          <span>
            Znam: {session.sessionStats.known} | Nie znam: {session.sessionStats.unknown}
          </span>
        </div>
      </div>

      <Progress value={progress} className="mb-6" />

      <FlashcardDisplay
        front={currentFlashcard.front}
        back={currentFlashcard.back}
        isFlipped={session.isFlipped}
        onFlip={flipCard}
      />

      <div className="mt-6 space-y-4">
        {!session.isFlipped ? (
          <Button onClick={flipCard} size="lg" className="w-full" variant="outline">
            <Eye className="mr-2 h-5 w-5" />
            Pokaż odpowiedź
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={markAsUnknown}
              size="lg"
              variant="destructive"
              className="w-full"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Nie znam
            </Button>
            <Button onClick={markAsKnown} size="lg" className="w-full">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Znam
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          💡 Kliknij na fiszkę, aby ją przewrócić
        </p>
      </div>
    </div>
  );
}
```

**Weryfikacja:**

- Wszystkie stany renderują się poprawnie
- Interakcje działają
- Nawigacja między kartami płynna

---

### Faza 3: Testing & Documentation (Szacowany czas: 1-2h)

#### Krok 3.1: Manualne testowanie

**Checklist:**

- [ ] Backend endpoint `/api/study/session` zwraca 200 z fiszkami
- [ ] Backend zwraca 401 bez autentykacji
- [ ] Backend zwraca 404 gdy brak fiszek
- [ ] Query params (limit, source, shuffle) działają poprawnie
- [ ] Frontend ładuje się bez błędów
- [ ] Flip karty działa (klik + keyboard)
- [ ] Przycisk "Pokaż odpowiedź" działa
- [ ] Przyciski "Znam"/"Nie znam" przechodzą do następnej karty
- [ ] Statystyki aktualizują się poprawnie
- [ ] Podsumowanie sesji wyświetla się po zakończeniu
- [ ] "Rozpocznij ponownie" resetuje sesję
- [ ] Loading states wyświetlają się
- [ ] Error states wyświetlają się
- [ ] Empty state (brak fiszek) działa
- [ ] Responsywność na mobile

#### Krok 3.2: Testy jednostkowe (opcjonalne dla MVP)

**Test service:**

```bash
# src/lib/services/study/__tests__/study.service.test.ts
```

**Test handler:**

```bash
# src/lib/api-handlers/study/__tests__/GetStudySessionHandler.test.ts
```

**Test components:**

```bash
# src/components/study/__tests__/StudyView.test.tsx
# src/components/study/__tests__/useStudySession.test.ts
```

#### Krok 3.3: E2E testy (opcjonalne dla MVP)

**Test przepływu:**

```bash
# tests/e2e/study-session.spec.ts
```

Scenariusze:

1. Użytkownik rozpoczyna sesję nauki
2. Przegląda wszystkie fiszki
3. Ocenia fiszki (znam/nie znam)
4. Widzi podsumowanie
5. Rozpoczyna ponownie

#### Krok 3.4: Aktualizacja dokumentacji

**Plik:** `.ai/api-plan.md`

Dodać sekcję:

```markdown
### 2.4 Study Session

#### GET /api/study/session

Retrieves flashcards for study session.

[... szczegóły z tego planu ...]
```

---

### Faza 4: Deployment & Monitoring (Szacowany czas: 30min)

#### Krok 4.1: Linting i formatting

```bash
npm run lint
npm run format
```

#### Krok 4.2: Build check

```bash
npm run build
```

#### Krok 4.3: Deploy do staging

```bash
git checkout -b feature/study-session
git add .
git commit -m "feat: implement study session MVP"
git push origin feature/study-session
# Utwórz PR
```

#### Krok 4.4: Monitoring po deploy

- Sprawdź CloudFlare analytics
- Monitoruj błędy w Supabase logs
- Zbieraj feedback użytkowników

---

## 10. Post-MVP Enhancements

### Priorytet 1: Keyboard Shortcuts

- `Space` - flip card
- `1` lub `Arrow Left` - nie znam
- `2` lub `Arrow Right` - znam
- `Escape` - zakończ sesję

### Priorytet 2: Spaced Repetition Algorithm

- Nowa tabela: `flashcard_reviews`
- Endpoint: `POST /api/study/review`
- Algorytm SM-2

### Priorytet 3: Statystyki

- Dashboard z wykresami
- Heatmap aktywności
- Streak counter

### Priorytet 4: Tryby nauki

- "Tylko trudne"
- "Tylko AI" / "Tylko ręczne"
- "Quiz mode"

### Priorytet 5: Animacje

- Framer Motion dla flip
- Smooth transitions między kartami
- Confetti po zakończeniu sesji (100% accuracy)

---

## 11. Checklist wdrożenia

### Backend

- [ ] Typy TypeScript (`src/types.ts`)
- [ ] Zod schema (`src/lib/schemas/study.schemas.ts`)
- [ ] Service (`src/lib/services/study/study.service.ts`)
- [ ] Handler (`src/lib/api-handlers/study/GetStudySessionHandler.ts`)
- [ ] Endpoint (`src/pages/api/study/session.ts`)

### Frontend

- [ ] Hook (`src/components/study/useStudySession.ts`)
- [ ] FlashcardDisplay (`src/components/study/FlashcardDisplay.tsx`)
- [ ] SessionSummary (`src/components/study/SessionSummary.tsx`)
- [ ] StudyView (`src/components/study/StudyView.tsx`)

### Testing

- [ ] Manualne testowanie (checklist powyżej)
- [ ] Unit tests (opcjonalne)
- [ ] E2E tests (opcjonalne)

### Documentation

- [ ] Aktualizacja `.ai/api-plan.md`
- [ ] Komentarze w kodzie
- [ ] README (jeśli potrzebne)

### Deployment

- [ ] Linting pass
- [ ] Build successful
- [ ] PR review
- [ ] Merge to main
- [ ] Deploy to production

---

## 12. Szacowany czas implementacji

| Faza               | Czas | Kumulatywnie |
| ------------------ | ---- | ------------ |
| Faza 1: Backend    | 2-3h | 2-3h         |
| Faza 2: Frontend   | 2-3h | 4-6h         |
| Faza 3: Testing    | 1-2h | 5-8h         |
| Faza 4: Deployment | 0.5h | 5.5-8.5h     |

**Całkowity czas:** 5.5-8.5 godzin (zależnie od poziomu doświadczenia i potrzeby testów)

**Optymistyczny (bez testów):** 4-5 godzin  
**Realistyczny (z testami manualnymi):** 6-7 godzin  
**Konserwatywny (pełne testy + dokumentacja):** 8-9 godzin

---

## 13. Kontakt i wsparcie

W razie pytań lub problemów podczas implementacji:

1. Sprawdź istniejące implementacje w projekcie (flashcards, generations)
2. Przejrzyj dokumentację Supabase
3. Skontaktuj się z tech lead projektu

---

**Dokument przygotowany:** 2025-11-06  
**Wersja:** 1.0  
**Status:** Ready for Implementation
