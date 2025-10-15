# Plan Implementacji Endpointów API: Zarządzanie Fiszkami

## 1. Przegląd Endpointów

Ten dokument zawiera kompleksowy plan implementacji endpointów API do zarządzania fiszkami. API umożliwia uwierzytelnionym użytkownikom tworzenie, odczytywanie, aktualizowanie i usuwanie fiszek, obsługując zarówno ręczne tworzenie, jak i fiszki generowane przez AI z operacjami wsadowymi.

**Kluczowe charakterystyki:**

- Pełne operacje CRUD dla fiszek
- Wsparcie paginacji i filtrowania
- Śledzenie źródła (manual, ai-full, ai-edited)
- Integracja z workflow generacji AI
- Dostęp do danych ograniczony do użytkownika z RLS
- Kompleksowa walidacja i obsługa błędów

### Endpointy do Implementacji

1. **GET /api/flashcards** - Listowanie wszystkich fiszek z paginacją i filtrowaniem
2. **GET /api/flashcards/:id** - Pobranie pojedynczej fiszki
3. **POST /api/flashcards** - Utworzenie ręcznej fiszki
4. **POST /api/flashcards/bulk** - Utworzenie wielu fiszek z generacji AI
5. **PATCH /api/flashcards/:id** - Aktualizacja istniejącej fiszki
6. **DELETE /api/flashcards/:id** - Usunięcie fiszki

---

## 2. Szczegóły Żądań

### 2.1 GET /api/flashcards

Pobiera wszystkie fiszki uwierzytelnionego użytkownika.

**Metoda HTTP:** `GET`  
**Struktura URL:** `/api/flashcards`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Parametry Query:**

| Parametr | Typ    | Wymagany | Domyślna     | Walidacja                                   | Opis                         |
| -------- | ------ | -------- | ------------ | ------------------------------------------- | ---------------------------- |
| `page`   | number | Nie      | 1            | Liczba całkowita dodatnia, min: 1           | Numer strony dla paginacji   |
| `limit`  | number | Nie      | 50           | Liczba całkowita dodatnia, min: 1, max: 100 | Liczba elementów na stronę   |
| `source` | string | Nie      | undefined    | Enum: 'manual', 'ai-full', 'ai-edited'      | Filtrowanie po źródle fiszki |
| `sort`   | string | Nie      | 'created_at' | Enum: 'created_at', 'updated_at'            | Pole sortowania              |
| `order`  | string | Nie      | 'desc'       | Enum: 'asc', 'desc'                         | Kolejność sortowania         |

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)

**Przykładowe Żądanie:**

```bash
GET /api/flashcards?page=1&limit=50&source=ai-full&sort=created_at&order=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2.2 GET /api/flashcards/:id

Pobiera konkretną fiszkę po ID.

**Metoda HTTP:** `GET`  
**Struktura URL:** `/api/flashcards/:id`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Parametry URL:**

| Parametr | Typ    | Wymagany | Walidacja                 | Opis      |
| -------- | ------ | -------- | ------------------------- | --------- |
| `id`     | number | Tak      | Liczba całkowita dodatnia | ID fiszki |

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)

**Przykładowe Żądanie:**

```bash
GET /api/flashcards/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 2.3 POST /api/flashcards

Tworzy pojedynczą ręczną fiszkę.

**Metoda HTTP:** `POST`  
**Struktura URL:** `/api/flashcards`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)
- `Content-Type: application/json` (Wymagany)

**Treść Żądania:**

```json
{
  "front": "Co to jest TypeScript?",
  "back": "Typowany nadzbiór JavaScript, który kompiluje się do czystego JavaScript"
}
```

**Reguły Walidacji:**

- `front`: Wymagany, niepusty string po przycięciu, max 200 znaków
- `back`: Wymagany, niepusty string po przycięciu, max 500 znaków

---

### 2.4 POST /api/flashcards/bulk

Tworzy wiele fiszek jednocześnie (używane po generacji AI do zapisania zaakceptowanych fiszek).

**Metoda HTTP:** `POST`  
**Struktura URL:** `/api/flashcards/bulk`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)
- `Content-Type: application/json` (Wymagany)

**Treść Żądania:**

```json
{
  "generation_id": 123,
  "flashcards": [
    {
      "front": "Co to jest React?",
      "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
      "source": "ai-full"
    },
    {
      "front": "Co to jest JSX?",
      "back": "Rozszerzenie składni JavaScript, które wygląda podobnie do XML/HTML",
      "source": "ai-edited"
    }
  ]
}
```

**Reguły Walidacji:**

- `generation_id`: Wymagany, liczba całkowita dodatnia, musi istnieć w bazie i należeć do użytkownika
- `flashcards`: Wymagana tablica, min 1 element, max 50 elementów
- Każda fiszka musi mieć poprawne `front`, `back` i `source`
- `source` musi być "ai-full" lub "ai-edited" (nie "manual")
- Suma zaakceptowanych fiszek nie może przekroczyć `generated_count` z rekordu generacji

---

### 2.5 PATCH /api/flashcards/:id

Aktualizuje istniejącą fiszkę.

**Metoda HTTP:** `PATCH`  
**Struktura URL:** `/api/flashcards/:id`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Parametry URL:**

| Parametr | Typ    | Wymagany | Walidacja                 | Opis      |
| -------- | ------ | -------- | ------------------------- | --------- |
| `id`     | number | Tak      | Liczba całkowita dodatnia | ID fiszki |

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)
- `Content-Type: application/json` (Wymagany)

**Treść Żądania:**

```json
{
  "front": "Co to jest React (zaktualizowane)?",
  "back": "Biblioteka JavaScript do budowania interfejsów użytkownika (zaktualizowane)"
}
```

**Reguły Walidacji:**

- Przynajmniej jedno pole (`front` lub `back`) musi być podane
- Jeśli podano `front`: niepusty string po przycięciu, max 200 znaków
- Jeśli podano `back`: niepusty string po przycięciu, max 500 znaków

---

### 2.6 DELETE /api/flashcards/:id

Trwale usuwa fiszkę.

**Metoda HTTP:** `DELETE`  
**Struktura URL:** `/api/flashcards/:id`  
**Uwierzytelnianie:** Wymagane (token Bearer)

**Parametry URL:**

| Parametr | Typ    | Wymagany | Walidacja                 | Opis      |
| -------- | ------ | -------- | ------------------------- | --------- |
| `id`     | number | Tak      | Liczba całkowita dodatnia | ID fiszki |

**Nagłówki:**

- `Authorization: Bearer <token>` (Wymagany)

**Przykładowe Żądanie:**

```bash
DELETE /api/flashcards/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 3. Szczegóły Odpowiedzi

### 3.1 Odpowiedzi Sukcesu

#### GET /api/flashcards (200 OK)

```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": 1,
        "front": "Co to jest React?",
        "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
        "source": "ai-full",
        "generation_id": 123,
        "created_at": "2025-10-10T10:00:00Z",
        "updated_at": "2025-10-10T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3
    }
  }
}
```

#### GET /api/flashcards/:id (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "Co to jest React?",
    "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
    "source": "ai-full",
    "generation_id": 123,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}
```

#### POST /api/flashcards (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 2,
    "front": "Co to jest TypeScript?",
    "back": "Typowany nadzbiór JavaScript",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-10-10T10:05:00Z",
    "updated_at": "2025-10-10T10:05:00Z"
  }
}
```

#### POST /api/flashcards/bulk (201 Created)

```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 3,
        "front": "Co to jest React?",
        "back": "Biblioteka JavaScript",
        "source": "ai-full",
        "generation_id": 123,
        "created_at": "2025-10-10T10:10:00Z",
        "updated_at": "2025-10-10T10:10:00Z"
      }
    ]
  }
}
```

#### PATCH /api/flashcards/:id (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "Co to jest React (zaktualizowane)?",
    "back": "Biblioteka JavaScript (zaktualizowana)",
    "source": "ai-edited",
    "generation_id": 123,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:15:00Z"
  }
}
```

#### DELETE /api/flashcards/:id (200 OK)

```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```

### 3.2 Odpowiedzi Błędów

#### 401 Unauthorized

Brak lub nieprawidłowy token uwierzytelniający.

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
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front text must not exceed 200 characters"
      }
    ]
  }
}
```

#### 404 Not Found

Fiszka nie została znaleziona.

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
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
    "message": "An unexpected error occurred"
  }
}
```

---

## 4. Wykorzystywane Typy

### Z pliku `src/types.ts`

**DTO Odpowiedzi:**

- `FlashcardDTO` - Pojedyncza fiszka w odpowiedzi (wyklucza user_id)
- `GetFlashcardsResponseDTO` - Odpowiedź listy z paginacją
- `CreateFlashcardsBulkResponseDTO` - Odpowiedź tworzenia wsadowego
- `DeleteResourceResponseDTO` - Odpowiedź pomyślnego usunięcia
- `PaginationDTO` - Metadane paginacji

**Modele Komend:**

- `CreateFlashcardCommand` - Tworzenie pojedynczej fiszki
- `CreateFlashcardsBulkCommand` - Wsadowe tworzenie fiszek
- `FlashcardBulkItemDTO` - Pojedynczy element w tworzeniu wsadowym
- `UpdateFlashcardCommand` - Aktualizacja fiszki

**Modele Query:**

- `GetFlashcardsQueryDTO` - Parametry zapytania listy

**Typy Błędów:**

- `ApiErrorDTO` - Standardowa odpowiedź błędu
- `ValidationErrorDetailDTO` - Szczegóły błędu walidacji

**Typy Bazodanowe:**

- `FlashcardEntity` - Typ wiersza bazy danych
- `InsertFlashcardData` - Typ operacji wstawiania
- `UpdateFlashcardData` - Typ operacji aktualizacji
- `FlashcardSource` - Typ enum

### Schematy Walidacji (do utworzenia)

**Plik:** `src/lib/validation/flashcard.schemas.ts`

```typescript
import { z } from "zod";

// Schemat dla CreateFlashcardCommand
export const CreateFlashcardSchema = z.object({
  front: z.string().trim().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
  back: z.string().trim().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
});

// Schemat dla UpdateFlashcardCommand
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string()
      .trim()
      .min(1, "Front text cannot be empty")
      .max(200, "Front text must not exceed 200 characters")
      .optional(),
    back: z
      .string()
      .trim()
      .min(1, "Back text cannot be empty")
      .max(500, "Back text must not exceed 500 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });

// Schemat dla pojedynczej fiszki w tworzeniu wsadowym
export const FlashcardBulkItemSchema = z.object({
  front: z.string().trim().min(1, "Front text is required").max(200, "Front text must not exceed 200 characters"),
  back: z.string().trim().min(1, "Back text is required").max(500, "Back text must not exceed 500 characters"),
  source: z.enum(["ai-full", "ai-edited"], {
    errorMap: () => ({ message: "Source must be 'ai-full' or 'ai-edited'" }),
  }),
});

// Schemat dla CreateFlashcardsBulkCommand
export const CreateFlashcardsBulkSchema = z.object({
  generation_id: z.number().int("Generation ID must be an integer").positive("Generation ID must be positive"),
  flashcards: z
    .array(FlashcardBulkItemSchema)
    .min(1, "At least one flashcard is required")
    .max(50, "Cannot create more than 50 flashcards at once"),
});

// Schemat dla parametrów query GET /api/flashcards
export const GetFlashcardsQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().min(1).max(100).default(50),
  source: z.enum(["manual", "ai-full", "ai-edited"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Schemat dla parametru ID fiszki
export const FlashcardIdSchema = z
  .number()
  .int("Flashcard ID must be an integer")
  .positive("Flashcard ID must be positive");
```

---

## 5. Przepływ Danych

### Przepływ Wysokiego Poziomu

```
Żądanie Klienta
    ↓
Handler Route'u Astro (src/pages/api/flashcards/...)
    ↓
Sprawdzenie Uwierzytelnienia (middleware - context.locals.supabase)
    ↓
Walidacja Wejścia (schematy Zod)
    ↓
FlashcardService (src/lib/services/flashcard.service.ts)
    ↓
Klient Supabase (operacje bazodanowe z RLS)
    ↓
Transformacja Odpowiedzi (Entity → DTO)
    ↓
Odpowiedź JSON do Klienta
```

### Szczegółowy Przepływ per Endpoint

#### GET /api/flashcards

1. Wyciągnięcie i walidacja parametrów query używając `GetFlashcardsQuerySchema`
2. Pobranie uwierzytelnionego user ID z `context.locals.supabase.auth.getUser()`
3. Wywołanie `flashcardService.getFlashcards(user_id, query_params)`
4. Serwis wykonuje zapytanie Supabase z:
   - Klauzulą WHERE dla user_id (RLS również to wymusza)
   - Opcjonalną klauzulą WHERE dla filtra source
   - Klauzulą ORDER BY opartą na sort i order
   - LIMIT i OFFSET dla paginacji
   - Zapytaniem COUNT dla całkowitej liczby rekordów
5. Transformacja FlashcardEntity[] do FlashcardDTO[]
6. Obliczenie metadanych paginacji
7. Zwrócenie GetFlashcardsResponseDTO opakowanego w ApiResponseDTO

#### GET /api/flashcards/:id

1. Wyciągnięcie i walidacja parametru ID używając `FlashcardIdSchema`
2. Pobranie uwierzytelnionego user ID
3. Wywołanie `flashcardService.getFlashcardById(id, user_id)`
4. Serwis wykonuje zapytanie Supabase z WHERE id = :id AND user_id = :user_id
5. Jeśli nie znaleziono, rzuć błąd NOT_FOUND
6. Transformacja FlashcardEntity do FlashcardDTO
7. Zwrócenie FlashcardDTO opakowanego w ApiResponseDTO

#### POST /api/flashcards

1. Parsowanie i walidacja treści żądania używając `CreateFlashcardSchema`
2. Pobranie uwierzytelnionego user ID
3. Wywołanie `flashcardService.createFlashcard(user_id, command)`
4. Serwis przygotowuje InsertFlashcardData:
   - user_id z kontekstu
   - front i back z komendy
   - source = "manual"
   - generation_id = null
5. Wykonanie wstawienia Supabase i zwrócenie pojedynczego wiersza
6. Transformacja FlashcardEntity do FlashcardDTO
7. Zwrócenie FlashcardDTO opakowanego w ApiResponseDTO ze statusem 201

#### POST /api/flashcards/bulk

1. Parsowanie i walidacja treści żądania używając `CreateFlashcardsBulkSchema`
2. Pobranie uwierzytelnionego user ID
3. Wywołanie `flashcardService.createFlashcardsBulk(user_id, generation_id, flashcards)`
4. Serwis wykonuje operacje transakcyjne:
   a. Weryfikacja, że generacja istnieje i należy do użytkownika
   b. Pobranie rekordu generacji aby uzyskać generated_count
   c. Zliczenie ai-full vs ai-edited w żądaniu
   d. Walidacja: aktualne zaakceptowane liczniki + nowe liczniki ≤ generated_count
   e. Przygotowanie tablicy InsertFlashcardData
   f. Wykonanie wsadowego wstawienia
   g. Aktualizacja rekordu generacji nowymi zaakceptowanymi licznikami
5. Transformacja FlashcardEntity[] do FlashcardDTO[]
6. Zwrócenie CreateFlashcardsBulkResponseDTO opakowanego w ApiResponseDTO ze statusem 201

#### PATCH /api/flashcards/:id

1. Wyciągnięcie i walidacja parametru ID
2. Parsowanie i walidacja treści żądania używając `UpdateFlashcardSchema`
3. Pobranie uwierzytelnionego user ID
4. Wywołanie `flashcardService.updateFlashcard(id, user_id, command)`
5. Serwis wykonuje:
   a. Pobranie istniejącej fiszki aby zweryfikować własność i uzyskać aktualne source
   b. Jeśli nie znaleziono lub niezgodność user_id, rzuć błąd NOT_FOUND
   c. Przygotowanie UpdateFlashcardData z podanymi polami
   d. Zastosowanie logiki przejścia source:
   - Jeśli aktualne source to "ai-full" i treść się zmieniła → ustaw source na "ai-edited"
   - Jeśli aktualne source to "manual" → zostaw jako "manual"
   - Jeśli aktualne source to "ai-edited" → zostaw jako "ai-edited"
     e. Wykonanie aktualizacji Supabase
     f. Trigger bazy danych automatycznie aktualizuje updated_at
6. Transformacja zaktualizowanego FlashcardEntity do FlashcardDTO
7. Zwrócenie FlashcardDTO opakowanego w ApiResponseDTO

#### DELETE /api/flashcards/:id

1. Wyciągnięcie i walidacja parametru ID
2. Pobranie uwierzytelnionego user ID
3. Wywołanie `flashcardService.deleteFlashcard(id, user_id)`
4. Serwis wykonuje:
   a. Wykonanie usunięcia Supabase z WHERE id = :id AND user_id = :user_id
   b. Sprawdzenie liczby zmienionych wierszy
   c. Jeśli 0 zmienionych wierszy, rzuć błąd NOT_FOUND
5. Zwrócenie DeleteResourceResponseDTO z komunikatem sukcesu

### Interakcje z Bazą Danych

**Row-Level Security (RLS):**

- Wszystkie tabele fiszek mają włączony RLS
- Polityki wymuszają: `auth.uid() = user_id`
- Warstwa serwisowa dodaje jawne sprawdzenia user_id dla jasności

**Triggery:**

- Znacznik czasu `updated_at` automatycznie aktualizowany przy operacjach UPDATE

**Ograniczenia Kluczy Obcych:**

- `user_id` → `auth.users(id)` ON DELETE CASCADE
- `generation_id` → `generations(id)` ON DELETE SET NULL

---

## 6. Względy Bezpieczeństwa

### Uwierzytelnianie i Autoryzacja

**Uwierzytelnianie:**

- Wszystkie endpointy wymagają prawidłowego tokenu Bearer w nagłówku Authorization
- Walidacja tokenu obsługiwana przez middleware Astro przez `context.locals.supabase.auth.getUser()`
- Jeśli brak prawidłowej sesji, zwróć 401 Unauthorized

**Autoryzacja:**

- Użytkownik może dostać się tylko do swoich własnych fiszek
- Wymuszane na wielu poziomach:
  1. Polityki RLS Supabase (poziom bazy danych)
  2. Sprawdzenia warstwy serwisowej (poziom aplikacji)
  3. Jawne filtrowanie user_id we wszystkich zapytaniach

**Walidacja User ID:**

- Zawsze używaj user ID z uwierzytelnionej sesji, nigdy z treści żądania
- Weryfikuj, że generation_id należy do użytkownika w tworzeniu wsadowym

### Walidacja i Sanityzacja Wejścia

**Strategia Walidacji:**

- Wszystkie wejścia walidowane używając schematów Zod przed przetwarzaniem
- Walidacja następuje na poziomie handlera route'u API
- Nieudana walidacja zwraca 400 ze szczegółowymi komunikatami błędów

**Sanityzacja:**

- Przycięcie wszystkich wejść string aby usunąć białe znaki początkowe/końcowe
- Wymuszenie maksymalnych długości (front: 200, back: 500 znaków)
- Walidacja wartości enum (source, sort, order)
- Walidacja ograniczeń numerycznych (liczby całkowite dodatnie dla ID, numerów stron)

**Zapobieganie SQL Injection:**

- Użycie zapytań parametryzowanych klienta Supabase (automatyczna ochrona)
- Nigdy nie konkatenuj wejścia użytkownika do stringów zapytania

### Zapobieganie Ekspozycji Danych

**Filtrowanie Odpowiedzi:**

- Zawsze używaj FlashcardDTO (wyklucza user_id) w odpowiedziach
- Nigdy nie ujawniaj wewnętrznych ID lub wrażliwych metadanych
- Użyj widoków bazy danych lub jawnego wyboru kolumn

**Ochrona IDOR:**

- Zawsze weryfikuj własność zasobu przed operacjami
- Użyj połączonych klauzul WHERE: `id = :id AND user_id = :user_id`
- Zwróć 404 (nie 403) aby zapobiec ujawnieniu informacji

### Względy Rate Limiting

**Zalecane Limity:**

- Endpointy GET: 100 żądań na minutę na użytkownika
- POST /api/flashcards: 10 żądań na minutę na użytkownika
- POST /api/flashcards/bulk: 5 żądań na minutę na użytkownika
- PATCH/DELETE: 20 żądań na minutę na użytkownika

**Implementacja:**

- Rozważ użycie istniejącego wzorca RateLimitService
- Śledź po user_id (z uwierzytelnionej sesji)
- Zwróć 429 Too Many Requests z retry_after

---

## 7. Obsługa Błędów

### Kategorie Błędów

#### Błędy Walidacji (400)

**Warunki Wyzwalające:**

- Brak wymaganych pól
- Naruszenia długości pól
- Nieprawidłowe wartości enum
- Nieprawidłowe typy danych
- Brak pól podanych w żądaniu PATCH
- Naruszenia rozmiaru tablicy (tworzenie wsadowe)
- Naruszenia reguł biznesowych (zaakceptowana liczba przekracza generated_count)

**Format Odpowiedzi:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "front",
        "message": "Front text is required"
      }
    ]
  }
}
```

**Strategia Obsługi:**

- Wyłap ZodError w handlerach route'ów
- Przekształć do ValidationErrorDetailDTO[]
- Zwróć strukturalną odpowiedź ze wszystkimi błędami walidacji

#### Błędy Uwierzytelniania (401)

**Warunki Wyzwalające:**

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Wygasły token
- Nieprawidłowy podpis

**Format Odpowiedzi:**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

**Strategia Obsługi:**

- Sprawdź wynik `context.locals.supabase.auth.getUser()`
- Jeśli błąd lub brak użytkownika, zwróć 401
- Dołącz ogólny komunikat (nie ujawniaj szczegółów tokenu)

#### Błędy Not Found (404)

**Warunki Wyzwalające:**

- ID fiszki nie istnieje
- Fiszka istnieje ale należy do innego użytkownika
- ID generacji nie istnieje lub należy do innego użytkownika

**Format Odpowiedzi:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

**Strategia Obsługi:**

- Serwis rzuca niestandardowy NotFoundError
- Handler route'u wyłapuje i zwraca 404
- Użyj tego samego komunikatu czy zasób nie istnieje czy dostęp jest zabroniony (zapobiegaj ujawnianiu informacji)

#### Błędy Bazy Danych (500)

**Warunki Wyzwalające:**

- Niepowodzenia połączenia z bazą danych
- Naruszenia ograniczeń (nieoczekiwane)
- Niepowodzenia wycofania transakcji
- Błędy klienta Supabase

**Format Odpowiedzi:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

**Strategia Obsługi:**

- Zaloguj pełne szczegóły błędu do konsoli/usługi logowania
- Zwróć ogólny komunikat do klienta (nie ujawniaj szczegółów wewnętrznych)
- Rozważ alerty/monitorowanie dla produkcji

### Wzorzec Obsługi Błędów

**Struktura Handlera Route'u:**

```typescript
export const GET = async (context: APIContext) => {
  try {
    // 1. Uwierzytelnianie
    const user = await context.locals.supabase.auth.getUser();
    if (!user.data.user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing authentication token",
          },
        }),
        { status: 401 }
      );
    }

    // 2. Walidacja wejścia
    const validated = schema.parse(input);

    // 3. Wywołanie serwisu
    const result = await service.operation(user.data.user.id, validated);

    // 4. Odpowiedź sukcesu
    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { status: 200 }
    );
  } catch (error) {
    // Obsługa konkretnych typów błędów
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Validation failed",
            details: error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        }),
        { status: 400 }
      );
    }

    if (error instanceof NotFoundError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: error.message,
          },
        }),
        { status: 404 }
      );
    }

    // Loguj nieoczekiwane błędy
    console.error("Unexpected error:", error);

    // Ogólna odpowiedź błędu
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500 }
    );
  }
};
```

### Niestandardowe Klasy Błędów

Utwórz w `src/lib/errors.ts`:

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}
```

---

## 8. Względy Wydajnościowe

### Optymalizacja Bazy Danych

**Indeksy:**

- Upewnij się, że istnieją indeksy na:
  - `flashcards(user_id)` - dla filtrowania użytkowników
  - `flashcards(generation_id)` - dla wyszukiwań generacji
  - `flashcards(source)` - dla filtrowania źródła
  - `flashcards(created_at)` - dla sortowania
  - `flashcards(updated_at)` - dla sortowania

**Optymalizacja Zapytań:**

- Użyj `select()` aby pobrać tylko potrzebne kolumny (unikaj SELECT \*)
- Użyj `single()` dla zapytań o pojedynczy wiersz aby zmniejszyć narzut
- Użyj `limit()` i `range()` dla paginacji
- Użyj `count()` z `exact: true` dla dokładnych sum paginacji

**Connection Pooling:**

- Klient Supabase obsługuje connection pooling automatycznie
- Użyj ponownie instancji klienta z `context.locals.supabase`

### Strategia Paginacji

**Implementacja:**

- Użyj paginacji opartej na offset (prostsze dla tego przypadku użycia)
- Domyślny rozmiar strony: 50, max: 100
- Oblicz offset: `(page - 1) * limit`
- Pobierz `limit + 1` rekordów aby określić czy istnieją więcej stron, lub użyj osobnego zapytania count

**Optymalizacja:**

- Rozważ paginację opartą na kursorze dla dużych zbiorów danych (przyszłe ulepszenie)
- Cachuj całkowitą liczbę na krótkie okresy jeśli potrzebne
- Dodaj `total_pages` aby pomóc klientowi w pre-fetchowaniu

### Optymalizacja Odpowiedzi

**Rozmiar Payload:**

- Wyklucz niepotrzebne pola (user_id już odfiltrowany przez DTO)
- Użyj kompresji (gzip/brotli) na poziomie serwera web
- Rozważ wybór pól w parametrach query (przyszłe ulepszenie)

**Strategia Cachowania:**

- Żądania GET są cachowalne (rozważ ETag/Last-Modified)
- Nagłówki cache: `Cache-Control: private, max-age=60` dla żądań GET
- Unieważnij cache przy mutacjach (POST, PATCH, DELETE)

### Operacje Wsadowe

**Obsługa Transakcji:**

- Użyj transakcji bazy danych dla wsadowego wstawienia + aktualizacji generacji
- Supabase wspiera `rpc()` dla operacji atomowych jeśli potrzebne
- Wycofaj wszystkie zmiany jeśli jakakolwiek operacja się nie powiedzie

**Limity Rozmiaru Batch:**

- Max 50 fiszek na żądanie wsadowe (konfigurowalne)
- Zapobiega problemom z timeoutem i pamięcią
- Większe batche powinny być dzielone przez klienta

**Optymistyczna Współbieżność:**

- Rozważ wersjonowanie dla aktualizacji rekordów generacji (przyszłe ulepszenie)
- Obsłuż race conditions w zaakceptowanych licznikach

### Monitorowanie i Metryki

**Kluczowe Metryki do Śledzenia:**

- Czasy odpowiedzi per endpoint (p50, p95, p99)
- Wskaźniki błędów według typu (400, 401, 404, 500)
- Czasy wykonania zapytań bazodanowych
- Liczba fiszek tworzonych na użytkownika
- Rozmiary operacji wsadowych

**Progi Alertów:**

- Czas odpowiedzi > 1 sekunda (p95)
- Wskaźnik błędów > 5%
- Niepowodzenia połączenia z bazą danych

---

## 9. Kroki Implementacji

### Krok 1: Utworzenie Niestandardowych Klas Błędów

**Plik:** `src/lib/errors.ts`

1. Utwórz klasę `NotFoundError` rozszerzającą Error
2. Utwórz klasę `ValidationError` z opcjonalnym polem details
3. Utwórz klasę `UnauthorizedError`
4. Wyeksportuj wszystkie klasy błędów do użycia w serwisach i route'ach

**Kryteria Akceptacji:**

- Wszystkie klasy błędów poprawnie rozszerzają Error
- Klasy błędów zawierają właściwość name dla identyfikacji
- Typy TypeScript poprawnie zdefiniowane

---

### Krok 2: Utworzenie Schematów Walidacji

**Plik:** `src/lib/validation/flashcard.schemas.ts`

1. Zaimportuj Zod i odpowiednie typy z `src/types.ts`
2. Utwórz `CreateFlashcardSchema` z walidacją front/back
3. Utwórz `UpdateFlashcardSchema` z opcjonalnymi polami i refinement
4. Utwórz `FlashcardBulkItemSchema` z walidacją enum source
5. Utwórz `CreateFlashcardsBulkSchema` z walidacją generation_id i tablicy
6. Utwórz `GetFlashcardsQuerySchema` z walidacją parametrów query i domyślnymi wartościami
7. Utwórz `FlashcardIdSchema` dla walidacji parametru ID
8. Wyeksportuj wszystkie schematy i ich wywnioskowane typy

**Kryteria Akceptacji:**

- Wszystkie schematy odpowiadają ograniczeniom bazy danych
- Komunikaty błędów są jasne i przyjazne dla użytkownika
- Typy TypeScript mogą być wywnioskowane ze schematów
- Schematy zawierają odpowiednie walidatory trim(), min(), max()

---

### Krok 3: Utworzenie FlashcardService

**Plik:** `src/lib/services/flashcard.service.ts`

**Metody do implementacji:**

1. **`getFlashcards(user_id, query_params)`**
   - Zbuduj zapytanie Supabase z filtrami, sortowaniem, paginacją
   - Wykonaj zapytanie count dla całkowitej liczby rekordów
   - Wykonaj zapytanie o dane z limit i offset
   - Oblicz metadane paginacji
   - Przekształć encje do DTO
   - Zwróć GetFlashcardsResponseDTO

2. **`getFlashcardById(id, user_id)`**
   - Zapytaj o pojedynczą fiszkę po id i user_id
   - Rzuć NotFoundError jeśli nie znaleziono
   - Przekształć encję do DTO
   - Zwróć FlashcardDTO

3. **`createFlashcard(user_id, command)`**
   - Przygotuj InsertFlashcardData z source="manual"
   - Wykonaj wstawienie i zwróć pojedynczy wiersz
   - Przekształć encję do DTO
   - Zwróć FlashcardDTO

4. **`createFlashcardsBulk(user_id, generation_id, flashcards)`**
   - Zweryfikuj, że generacja istnieje i należy do użytkownika
   - Pobierz aktualne zaakceptowane liczniki i generated_count
   - Zlicz nowe fiszki ai-full i ai-edited
   - Waliduj: aktualne + nowe ≤ generated_count
   - Przygotuj tablicę InsertFlashcardData
   - Wykonaj wsadowe wstawienie
   - Zaktualizuj rekord generacji nowymi licznikami
   - Przekształć encje do DTO
   - Zwróć CreateFlashcardsBulkResponseDTO

5. **`updateFlashcard(id, user_id, command)`**
   - Pobierz istniejącą fiszkę
   - Rzuć NotFoundError jeśli nie znaleziono lub zły użytkownik
   - Określ nowe source na podstawie reguł przejścia
   - Przygotuj UpdateFlashcardData
   - Wykonaj aktualizację
   - Przekształć encję do DTO
   - Zwróć FlashcardDTO

6. **`deleteFlashcard(id, user_id)`**
   - Wykonaj usunięcie z filtrami id i user_id
   - Sprawdź zmienione wiersze
   - Rzuć NotFoundError jeśli 0 zmienionych wierszy
   - Zwróć void

**Kryteria Akceptacji:**

- Wszystkie metody poprawnie typowane TypeScript
- Odpowiednia obsługa błędów i rzucanie niestandardowych błędów
- Operacje bazodanowe używają klienta Supabase poprawnie
- Logika biznesowa zaimplementowana poprawnie (przejścia source, walidacja liczników)
- Transformacje encji do DTO wykluczają user_id

---

### Krok 4: Utworzenie Route'u API dla GET /api/flashcards

**Plik:** `src/pages/api/flashcards/index.ts`

1. Zaimportuj zależności (Zod, typy, serwis, błędy)
2. Wyeksportuj `prerender = false`
3. Zaimplementuj handler `GET`:
   - Uwierzytelnij użytkownika przez context.locals.supabase.auth.getUser()
   - Parsuj i waliduj parametry query
   - Konwertuj parametry string na liczby/enumy
   - Utwórz instancję FlashcardService
   - Wywołaj service.getFlashcards()
   - Zwróć 200 z ApiResponseDTO<GetFlashcardsResponseDTO>
4. Zaimplementuj obsługę błędów z try/catch
5. Obsłuż ZodError, NotFoundError, błędy ogólne
6. Zwróć odpowiednie kody statusu i odpowiedzi błędów

**Kryteria Akceptacji:**

- Endpoint zwraca 401 dla nieuwierzytelnionych żądań
- Parametry query poprawnie walidowane i zastosowane domyślne wartości
- Odpowiedź sukcesu odpowiada specyfikacji API
- Odpowiedzi błędów odpowiadają standardom obsługi błędów
- Użyte odpowiednie kody statusu HTTP

---

### Krok 5: Utworzenie Route'ów API dla Operacji na Pojedynczych Fiszkach

**Plik:** `src/pages/api/flashcards/[id].ts`

Zaimplementuj handlery dla operacji na pojedynczych fiszkach po ID:

1. **Handler GET:**
   - Uwierzytelnij użytkownika
   - Wyciągnij i waliduj parametr ID
   - Wywołaj service.getFlashcardById()
   - Zwróć 200 z FlashcardDTO

2. **Handler PATCH:**
   - Uwierzytelnij użytkownika
   - Wyciągnij i waliduj parametr ID
   - Parsuj i waliduj treść żądania
   - Wywołaj service.updateFlashcard()
   - Zwróć 200 z zaktualizowanym FlashcardDTO

3. **Handler DELETE:**
   - Uwierzytelnij użytkownika
   - Wyciągnij i waliduj parametr ID
   - Wywołaj service.deleteFlashcard()
   - Zwróć 200 z DeleteResourceResponseDTO

4. Zaimplementuj obsługę błędów dla wszystkich handlerów
5. Zwróć odpowiednie kody statusu

**Kryteria Akceptacji:**

- Wszystkie handlery poprawnie uwierzytelniają
- Walidacja parametru ID działa poprawnie
- Sprawdzenia własności zapobiegają nieautoryzowanemu dostępowi
- PATCH waliduje, że przynajmniej jedno pole podane
- DELETE zwraca komunikat sukcesu
- Odpowiedzi błędów zgodne ze standardami

---

### Krok 6: Utworzenie Route'u API dla POST /api/flashcards

**Plik:** `src/pages/api/flashcards/index.ts` (dodaj handler POST)

1. Zaimportuj CreateFlashcardSchema
2. Zaimplementuj handler `POST`:
   - Uwierzytelnij użytkownika
   - Parsuj treść żądania jako JSON
   - Waliduj używając CreateFlashcardSchema
   - Wywołaj service.createFlashcard()
   - Zwróć 201 z utworzonym FlashcardDTO
3. Zaimplementuj obsługę błędów
4. Zwróć błędy walidacji ze statusem 400

**Kryteria Akceptacji:**

- Endpoint tworzy fiszkę z source="manual"
- Zwraca status 201 dla pomyślnego utworzenia
- Błędy walidacji poprawnie sformatowane
- Utworzona fiszka zawiera wszystkie wymagane pola
- Odpowiedź odpowiada specyfikacji API

---

### Krok 7: Utworzenie Route'u API dla POST /api/flashcards/bulk

**Plik:** `src/pages/api/flashcards/bulk.ts`

1. Zaimportuj CreateFlashcardsBulkSchema
2. Wyeksportuj `prerender = false`
3. Zaimplementuj handler `POST`:
   - Uwierzytelnij użytkownika
   - Parsuj treść żądania jako JSON
   - Waliduj używając CreateFlashcardsBulkSchema
   - Wywołaj service.createFlashcardsBulk()
   - Zwróć 201 z CreateFlashcardsBulkResponseDTO
4. Zaimplementuj obsługę błędów
5. Obsłuż błędy walidacji i błędy nie znalezionej generacji

**Kryteria Akceptacji:**

- Endpoint tworzy wiele fiszek atomowo
- Rekord generacji zaktualizowany zaakceptowanymi licznikami
- Waliduje, że licznik nie przekracza generated_count
- Zwraca 201 z created_count i tablicą flashcards
- Transakcja wycofana przy jakimkolwiek błędzie
- Zwraca odpowiedni błąd dla nieprawidłowego generation_id

---

### Krok 8: Dodanie Testów Integracyjnych

**Utwórz plik testowy:** `tests/flashcards.test.ts`

Scenariusze testowe do zaimplementowania:

1. **GET /api/flashcards:**
   - Zwraca pustą listę dla nowego użytkownika
   - Zwraca paginowane wyniki
   - Filtrowanie po source działa
   - Sortowanie po created_at/updated_at działa
   - Kolejność asc/desc działa
   - Zwraca 401 bez uwierzytelnienia

2. **GET /api/flashcards/:id:**
   - Zwraca pojedynczą fiszkę
   - Zwraca 404 dla nieistniejącego ID
   - Zwraca 404 dla fiszki innego użytkownika
   - Zwraca 401 bez uwierzytelnienia

3. **POST /api/flashcards:**
   - Tworzy ręczną fiszkę
   - Zwraca 400 dla nieprawidłowego wejścia
   - Zwraca 400 dla zbyt długiego tekstu
   - Zwraca 401 bez uwierzytelnienia

4. **POST /api/flashcards/bulk:**
   - Tworzy wiele fiszek
   - Aktualizuje liczniki generacji
   - Zwraca 400 dla przekroczenia generated_count
   - Zwraca 404 dla nieprawidłowego generation_id
   - Zwraca 401 bez uwierzytelnienia

5. **PATCH /api/flashcards/:id:**
   - Aktualizuje treść fiszki
   - Zmienia ai-full na ai-edited gdy treść się zmienia
   - Zostawia manual jako manual
   - Zwraca 400 dla braku podanych pól
   - Zwraca 404 dla nieistniejącego ID
   - Zwraca 401 bez uwierzytelnienia

6. **DELETE /api/flashcards/:id:**
   - Usuwa fiszkę
   - Zwraca 404 dla nieistniejącego ID
   - Zwraca 404 dla fiszki innego użytkownika
   - Zwraca 401 bez uwierzytelnienia

**Kryteria Akceptacji:**

- Wszystkie scenariusze testowe przechodzą
- Testy używają testowej bazy danych
- Testy sprzątają po sobie
- Testy weryfikują strukturę odpowiedzi i kody statusu

---

### Krok 9: Aktualizacja Dokumentacji API

**Plik:** `.ai/api-plan.md` (zweryfikuj kompletność)

1. Przejrzyj dokumentację wszystkich endpointów
2. Upewnij się, że przykłady żądań/odpowiedzi odpowiadają implementacji
3. Udokumentuj wszelkie odstępstwa od oryginalnego planu
4. Dodaj notatki o wzorcach obsługi błędów
5. Zaktualizuj rzeczywistymi czasami odpowiedzi (z testowania)

**Kryteria Akceptacji:**

- Dokumentacja odpowiada implementacji
- Wszystkie endpointy udokumentowane z przykładami
- Odpowiedzi błędów udokumentowane
- Parametry query jasno wyjaśnione

---

### Krok 10: Testowanie Wydajności i Optymalizacja

1. **Testowanie Obciążenia:**
   - Testuj paginację z dużymi zbiorami danych (1000+ fiszek)
   - Testuj tworzenie wsadowe z max elementami (50)
   - Mierz czasy odpowiedzi pod obciążeniem
   - Weryfikuj wydajność zapytań bazodanowych

2. **Optymalizacja:**
   - Dodaj brakujące indeksy bazy danych jeśli zidentyfikowane
   - Optymalizuj zapytania na podstawie wyników EXPLAIN ANALYZE
   - Dodaj nagłówki cachowania gdzie odpowiednie
   - Rozważ ustawienia connection pooling

3. **Konfiguracja Monitorowania:**
   - Dodaj logowanie dla wolnych zapytań (>500ms)
   - Loguj wskaźniki błędów według endpointu
   - Śledź metryki tworzenia

**Kryteria Akceptacji:**

- GET /api/flashcards odpowiada w <500ms dla 1000 fiszek
- Tworzenie wsadowe obsługuje 50 elementów w <2 sekundy
- Wszystkie zapytania bazodanowe używają indeksów odpowiednio
- Logowanie błędów przechwytuje wystarczający kontekst

---

### Krok 11: Przegląd Bezpieczeństwa

1. **Uwierzytelnianie:**
   - Zweryfikuj, że wszystkie endpointy sprawdzają uwierzytelnianie
   - Testuj z wygasłymi/nieprawidłowymi tokenami
   - Upewnij się o odpowiednie odpowiedzi 401

2. **Autoryzacja:**
   - Zweryfikuj, że polityki RLS są włączone
   - Testuj próby dostępu między użytkownikami
   - Upewnij się o odpowiednie odpowiedzi 404 (nie 403)

3. **Walidacja Wejścia:**
   - Testuj ze złośliwym wejściem (próby SQL injection, XSS)
   - Testuj z wartościami granicznymi (max długości, liczby ujemne)
   - Weryfikuj, że wszystkie wejścia walidowane przed przetwarzaniem

4. **Rate Limiting:**
   - Zaimplementuj lub zweryfikuj, że rate limiting jest na miejscu
   - Testuj wymuszanie rate limit
   - Weryfikuj odpowiednie odpowiedzi 429

**Kryteria Akceptacji:**

- Wszystkie testy bezpieczeństwa przechodzą
- Żaden użytkownik nie może uzyskać dostępu do danych innego użytkownika
- Wszystkie wejścia poprawnie walidowane i sanityzowane
- Rate limiting zapobiega nadużyciom

---

### Krok 12: Wdrożenie i Monitorowanie

1. **Przed wdrożeniem:**
   - Uruchom wszystkie testy
   - Zweryfikuj, że zmienne środowiskowe ustawione poprawnie
   - Przejrzyj migracje bazy danych
   - Sprawdź polityki RLS Supabase

2. **Wdrożenie:**
   - Wdroż najpierw na środowisko stagingowe
   - Uruchom testy smoke na stagingu
   - Wdroż na produkcję
   - Uruchom testy smoke na produkcji

3. **Po wdrożeniu:**
   - Monitoruj wskaźniki błędów
   - Monitoruj czasy odpowiedzi
   - Sprawdź logi dla nieoczekiwanych błędów
   - Zweryfikuj, że zbieranie metryk działa

**Kryteria Akceptacji:**

- Wszystkie testy przechodzą we wszystkich środowiskach
- Brak błędów w pierwszej godzinie produkcji
- Metryki i logowanie działają poprawnie
- Plan wycofania przetestowany i gotowy

---

## 10. Podsumowanie

Ten plan implementacji zapewnia kompleksowe wskazówki dla budowania solidnych, bezpiecznych i wydajnych endpointów API zarządzania fiszkami. Architektura wykorzystuje:

- **Astro 5** dla obsługi route'ów API
- **Supabase** dla operacji bazodanowych z RLS
- **Zod** dla walidacji runtime
- **TypeScript** dla bezpieczeństwa typów
- **Warstwę serwisową** dla separacji logiki biznesowej

**Kluczowe zasady projektowe:**

- Bezpieczeństwo na pierwszym miejscu (uwierzytelnianie, autoryzacja, walidacja wejścia)
- Jasna obsługa błędów z odpowiednimi kodami statusu HTTP
- Optymalizacja wydajności (indeksy, paginacja, operacje wsadowe)
- Bezpieczeństwo typów w całym stosie
- Kompleksowe testowanie i monitorowanie

**Implementacja następuje strukturalnego podejścia:**

1. Fundament (błędy, walidacja, serwis)
2. Route'y API (jeden endpoint na raz)
3. Testowanie i optymalizacja
4. Przegląd bezpieczeństwa i wdrożenie

Postępując według tych kroków metodycznie, zespół programistów zbuduje gotowe do produkcji API, które spełnia wszystkie wymagania funkcjonalne i niefunkcjonalne.
