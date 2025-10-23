# API Endpoints: Flashcard Management

## Przegląd

Endpointy do zarządzania fiszkami umożliwiające pełne operacje CRUD (Create, Read, Update, Delete). Obsługują zarówno ręczne tworzenie fiszek, jak i zapisywanie fiszek wygenerowanych przez AI.

**Kluczowe funkcjonalności:**

- Listowanie fiszek z paginacją i filtrowaniem
- Tworzenie ręcznych fiszek
- Tworzenie wsadowe (bulk) po generacji AI
- Aktualizacja istniejących fiszek
- Usuwanie fiszek
- Automatyczne przejścia źródła (ai-full → ai-edited)

---

## Endpointy

### 1. GET /api/flashcards

Lista wszystkich fiszek użytkownika z paginacją i filtrowaniem.

- **URL:** `/api/flashcards`
- **Metoda:** `GET`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)
- **Content-Type:** `application/json`

#### Query Parameters

| Parametr | Typ    | Wymagany | Domyślna     | Opis                                                    |
| -------- | ------ | -------- | ------------ | ------------------------------------------------------- |
| `page`   | number | Nie      | 1            | Numer strony (min: 1)                                   |
| `limit`  | number | Nie      | 50           | Liczba elementów na stronę (min: 1, max: 100)           |
| `source` | string | Nie      | -            | Filtr po źródle: `"manual"`, `"ai-full"`, `"ai-edited"` |
| `sort`   | string | Nie      | "created_at" | Pole sortowania: `"created_at"`, `"updated_at"`         |
| `order`  | string | Nie      | "desc"       | Kolejność sortowania: `"asc"`, `"desc"`                 |

#### Przykładowe żądanie

```bash
# Lista wszystkich fiszek (domyślne parametry)
GET http://localhost:4321/api/flashcards

# Paginacja - strona 2, 20 elementów
GET http://localhost:4321/api/flashcards?page=2&limit=20

# Filtrowanie po źródle
GET http://localhost:4321/api/flashcards?source=ai-full

# Sortowanie po dacie aktualizacji, rosnąco
GET http://localhost:4321/api/flashcards?sort=updated_at&order=asc

# Kombinacja parametrów
GET http://localhost:4321/api/flashcards?page=1&limit=10&source=manual&sort=created_at&order=desc
```

#### Success Response (200 OK)

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
        "generation_id": 5,
        "created_at": "2025-10-15T10:00:00Z",
        "updated_at": "2025-10-15T10:00:00Z"
      },
      {
        "id": 2,
        "front": "Co to jest TypeScript?",
        "back": "Typowany nadzbiór JavaScript",
        "source": "manual",
        "generation_id": null,
        "created_at": "2025-10-15T09:00:00Z",
        "updated_at": "2025-10-15T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 2,
      "total_pages": 1
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Nieprawidłowe parametry query

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": [
      {
        "field": "page",
        "message": "Number must be greater than or equal to 1"
      }
    ]
  }
}
```

**500 Internal Server Error**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

---

### 2. POST /api/flashcards

Tworzy pojedynczą ręczną fiszkę.

- **URL:** `/api/flashcards`
- **Metoda:** `POST`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)
- **Content-Type:** `application/json`

#### Request Body

```typescript
{
  "front": string,  // Max 200 znaków, wymagany
  "back": string    // Max 500 znaków, wymagany
}
```

#### Przykładowe żądanie

```bash
POST http://localhost:4321/api/flashcards
Content-Type: application/json

{
  "front": "Co to jest Astro?",
  "back": "Framework do budowania szybkich stron internetowych z minimalnym JavaScriptem"
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "id": 3,
    "front": "Co to jest Astro?",
    "back": "Framework do budowania szybkich stron internetowych z minimalnym JavaScriptem",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-10-15T11:00:00Z",
    "updated_at": "2025-10-15T11:00:00Z"
  }
}
```

#### Error Responses

**400 Bad Request** - Błąd walidacji

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

---

### 3. POST /api/flashcards/bulk

Tworzy wiele fiszek jednocześnie po generacji AI. Aktualizuje liczniki zaakceptowanych fiszek w rekordzie generacji.

- **URL:** `/api/flashcards/bulk`
- **Metoda:** `POST`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)
- **Content-Type:** `application/json`

#### Request Body

```typescript
{
  "generation_id": number,      // ID istniejącej generacji
  "flashcards": [               // Min 1, max 50 fiszek
    {
      "front": string,          // Max 200 znaków
      "back": string,           // Max 500 znaków
      "source": "ai-full" | "ai-edited"  // Nie może być "manual"
    }
  ]
}
```

#### Przykładowe żądanie

```bash
POST http://localhost:4321/api/flashcards/bulk
Content-Type: application/json

{
  "generation_id": 5,
  "flashcards": [
    {
      "front": "Co to jest React?",
      "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
      "source": "ai-full"
    },
    {
      "front": "Co to jest JSX?",
      "back": "Rozszerzenie składni JavaScript (edytowane)",
      "source": "ai-edited"
    }
  ]
}
```

#### Success Response (201 Created)

```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 10,
        "front": "Co to jest React?",
        "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
        "source": "ai-full",
        "generation_id": 5,
        "created_at": "2025-10-15T12:00:00Z",
        "updated_at": "2025-10-15T12:00:00Z"
      },
      {
        "id": 11,
        "front": "Co to jest JSX?",
        "back": "Rozszerzenie składni JavaScript (edytowane)",
        "source": "ai-edited",
        "generation_id": 5,
        "created_at": "2025-10-15T12:00:00Z",
        "updated_at": "2025-10-15T12:00:00Z"
      }
    ]
  }
}
```

#### Error Responses

**400 Bad Request** - Przekroczono limit wygenerowanych fiszek

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot accept more flashcards than generated. Generated: 5, Already accepted: 3, Trying to add: 3",
    "details": {
      "generated_count": 5,
      "current_accepted_count": 3,
      "requested_count": 3,
      "available_slots": 2
    }
  }
}
```

**404 Not Found** - Generacja nie istnieje

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Generation not found"
  }
}
```

---

### 4. GET /api/flashcards/:id

Pobiera pojedynczą fiszkę po ID.

- **URL:** `/api/flashcards/:id`
- **Metoda:** `GET`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)

#### URL Parameters

| Parametr | Typ    | Opis      |
| -------- | ------ | --------- |
| `id`     | number | ID fiszki |

#### Przykładowe żądanie

```bash
GET http://localhost:4321/api/flashcards/1
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "Co to jest React?",
    "back": "Biblioteka JavaScript do budowania interfejsów użytkownika",
    "source": "ai-full",
    "generation_id": 5,
    "created_at": "2025-10-15T10:00:00Z",
    "updated_at": "2025-10-15T10:00:00Z"
  }
}
```

#### Error Responses

**400 Bad Request** - Nieprawidłowe ID

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid flashcard ID"
  }
}
```

**404 Not Found** - Fiszka nie istnieje lub nie należy do użytkownika

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

### 5. PATCH /api/flashcards/:id

Aktualizuje istniejącą fiszkę. Automatycznie zmienia źródło z `"ai-full"` na `"ai-edited"` gdy treść się zmienia.

- **URL:** `/api/flashcards/:id`
- **Metoda:** `PATCH`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)
- **Content-Type:** `application/json`

#### URL Parameters

| Parametr | Typ    | Opis      |
| -------- | ------ | --------- |
| `id`     | number | ID fiszki |

#### Request Body

```typescript
{
  "front"?: string,  // Opcjonalny, max 200 znaków
  "back"?: string    // Opcjonalny, max 500 znaków
}
// Przynajmniej jedno pole musi być podane
```

#### Przykładowe żądanie

```bash
PATCH http://localhost:4321/api/flashcards/1
Content-Type: application/json

{
  "back": "Biblioteka JavaScript do budowania interfejsów użytkownika (zaktualizowana)"
}
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "Co to jest React?",
    "back": "Biblioteka JavaScript do budowania interfejsów użytkownika (zaktualizowana)",
    "source": "ai-edited",
    "generation_id": 5,
    "created_at": "2025-10-15T10:00:00Z",
    "updated_at": "2025-10-15T13:00:00Z"
  }
}
```

#### Logika przejść źródła (source)

- `"ai-full"` → `"ai-edited"` - gdy treść się zmienia
- `"manual"` → `"manual"` - pozostaje bez zmian
- `"ai-edited"` → `"ai-edited"` - pozostaje bez zmian

#### Error Responses

**400 Bad Request** - Brak podanych pól

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "_root",
        "message": "At least one field (front or back) must be provided"
      }
    ]
  }
}
```

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

### 6. DELETE /api/flashcards/:id

Trwale usuwa fiszkę.

- **URL:** `/api/flashcards/:id`
- **Metoda:** `DELETE`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)

#### URL Parameters

| Parametr | Typ    | Opis      |
| -------- | ------ | --------- |
| `id`     | number | ID fiszki |

#### Przykładowe żądanie

```bash
DELETE http://localhost:4321/api/flashcards/1
```

#### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Flashcard deleted successfully"
  }
}
```

#### Error Responses

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Flashcard not found"
  }
}
```

---

## Scenariusze użycia

### Scenariusz 1: Tworzenie ręcznej fiszki

1. Użytkownik tworzy fiszkę przez formularz
2. POST `/api/flashcards` z danymi
3. Fiszka zapisana z `source: "manual"`

### Scenariusz 2: Zapisywanie fiszek po generacji AI

1. POST `/api/generations` - generuje 5 fiszek
2. Użytkownik przegląda propozycje
3. Użytkownik edytuje 2 fiszki, akceptuje 3 bez zmian
4. POST `/api/flashcards/bulk` z:
   - 3 fiszki: `source: "ai-full"`
   - 2 fiszki: `source: "ai-edited"`
5. Liczniki w rekordzie generacji aktualizowane:
   - `accepted_unedited_count: 3`
   - `accepted_edited_count: 2`

### Scenariusz 3: Edycja fiszki wygenerowanej przez AI

1. GET `/api/flashcards/1` - pobiera fiszkę (`source: "ai-full"`)
2. Użytkownik edytuje treść
3. PATCH `/api/flashcards/1` z nową treścią
4. Fiszka automatycznie zmienia źródło na `source: "ai-edited"`

### Scenariusz 4: Przeglądanie fiszek z paginacją

1. GET `/api/flashcards?page=1&limit=20` - pierwsze 20 fiszek
2. UI wyświetla "Strona 1 z 5 (100 fiszek łącznie)"
3. GET `/api/flashcards?page=2&limit=20` - następne 20 fiszek

---

## Względy bezpieczeństwa

### Uwierzytelnianie

- Wszystkie endpointy wymagają prawidłowego tokenu Supabase JWT
- W rozwoju: używany DEFAULT_USER_ID
- W produkcji: token weryfikowany przez middleware

### Autoryzacja

- Row-Level Security (RLS) w Supabase wymusza dostęp tylko do własnych fiszek
- Próba dostępu do cudzej fiszki zwraca 404 (nie 403, aby nie ujawniać istnienia)

### Walidacja

- Wszystkie wejścia walidowane schematami Zod
- Limity długości pól (front: 200, back: 500 znaków)
- Walidacja liczników w operacjach wsadowych

### Rate Limiting

- Zalecane limity (do implementacji):
  - GET: 100 req/min
  - POST single: 10 req/min
  - POST bulk: 5 req/min
  - PATCH/DELETE: 20 req/min

---

## Optymalizacja wydajności

### Indeksy bazodanowe

Zalecane indeksy dla optymalnej wydajności:

```sql
-- Istniejące indeksy powinny obejmować:
CREATE INDEX idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX idx_flashcards_generation_id ON flashcards(generation_id);
CREATE INDEX idx_flashcards_source ON flashcards(source);
CREATE INDEX idx_flashcards_created_at ON flashcards(created_at);
CREATE INDEX idx_flashcards_updated_at ON flashcards(updated_at);
```

### Paginacja

- Domyślny limit: 50 elementów
- Maksymalny limit: 100 elementów
- Użycie LIMIT/OFFSET dla prostej paginacji
- Przyszła optymalizacja: cursor-based pagination dla dużych zbiorów

### Cachowanie

- Nagłówki Cache-Control dla żądań GET
- Unieważnianie cache przy mutacjach

---

## Testowanie

### Kluczowe przypadki testowe

**GET /api/flashcards:**

- ✅ Pusta lista dla nowego użytkownika
- ✅ Paginacja z różnymi wartościami page/limit
- ✅ Filtrowanie po source
- ✅ Sortowanie po created_at/updated_at
- ✅ Walidacja parametrów (błędne wartości page, limit > 100)

**POST /api/flashcards:**

- ✅ Tworzenie poprawnej fiszki
- ✅ Walidacja długości pól
- ✅ Walidacja pustych pól

**POST /api/flashcards/bulk:**

- ✅ Tworzenie wielu fiszek
- ✅ Aktualizacja liczników generacji
- ✅ Walidacja limitu (max 50)
- ✅ Błąd gdy generation_id nie istnieje
- ✅ Błąd gdy przekroczono generated_count

**PATCH /api/flashcards/:id:**

- ✅ Aktualizacja pojedynczego pola
- ✅ Aktualizacja obu pól
- ✅ Przejście ai-full → ai-edited
- ✅ Błąd gdy brak pól
- ✅ Błąd gdy fiszka nie istnieje

**DELETE /api/flashcards/:id:**

- ✅ Usuwanie istniejącej fiszki
- ✅ Błąd gdy fiszka nie istnieje
- ✅ Błąd gdy fiszka należy do innego użytkownika

---

## Status implementacji

| Endpoint                   | Status              | Notatki                                 |
| -------------------------- | ------------------- | --------------------------------------- |
| GET /api/flashcards        | ✅ Zaimplementowany | Paginacja, filtrowanie, sortowanie      |
| POST /api/flashcards       | ✅ Zaimplementowany | Tworzenie ręcznych fiszek               |
| POST /api/flashcards/bulk  | ✅ Zaimplementowany | Tworzenie wsadowe z walidacją liczników |
| GET /api/flashcards/:id    | ✅ Zaimplementowany | Pobieranie pojedynczej fiszki           |
| PATCH /api/flashcards/:id  | ✅ Zaimplementowany | Aktualizacja z auto-przejściem source   |
| DELETE /api/flashcards/:id | ✅ Zaimplementowany | Usuwanie z weryfikacją własności        |

**Data implementacji:** 2025-10-15  
**Wersja API:** 1.0  
**Środowisko:** Development (używa DEFAULT_USER_ID)
