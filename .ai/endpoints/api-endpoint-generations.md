# API Endpoint: POST /api/generations

## Przegląd

Endpoint do generowania propozycji fiszek z tekstu źródłowego przy użyciu AI. Umożliwia uwierzytelnionym użytkownikom automatyczne tworzenie fiszek edukacyjnych na podstawie dostarczonego materiału.

- **URL:** `/api/generations`
- **Metoda:** `POST`
- **Uwierzytelnianie:** Wymagane (Supabase JWT)
- **Rate Limit:** 10 generacji na użytkownika dziennie (wyłączone w dev)
- **Content-Type:** `application/json`

---

## Request

### Headers

| Nagłówek | Typ | Wymagany | Opis |
|----------|-----|----------|------|
| `Authorization` | string | Tak (produkcja) | Bearer token z Supabase Auth |
| `Content-Type` | string | Tak | Musi być `application/json` |

### Body

```typescript
{
  "source_text": string  // 1000-10000 znaków
}
```

#### Parametry

| Pole | Typ | Wymagany | Ograniczenia | Opis |
|------|-----|----------|--------------|------|
| `source_text` | string | Tak | Min: 1000 znaków<br>Max: 10000 znaków | Tekst źródłowy do analizy AI |

### Przykładowe żądanie

#### cURL

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance, which means that instead of updating the entire page, React only updates the parts that have changed. This approach significantly improves the speed and efficiency of web applications. React components can be either functional or class-based, with modern React development heavily favoring functional components combined with Hooks. Hooks, introduced in React 16.8, allow developers to use state and other React features without writing a class. The most commonly used Hooks are useState for managing component state and useEffect for handling side effects like data fetching or subscriptions."
  }'
```

#### JavaScript (Fetch API)

```javascript
const response = await fetch('http://localhost:4321/api/generations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer YOUR_SUPABASE_JWT_TOKEN', // W produkcji
  },
  body: JSON.stringify({
    source_text: 'React is a JavaScript library for building user interfaces...' // 1000+ znaków
  })
});

const result = await response.json();
console.log(result);
```

---

## Response

### Success Response (201 Created)

```typescript
{
  "success": true,
  "data": {
    "generation_id": number,           // ID wygenerowanej sesji
    "model": string | null,            // Użyty model AI (np. "openai/gpt-4 (mock)")
    "duration_ms": number,             // Czas trwania generacji w ms
    "generated_count": number,         // Liczba wygenerowanych fiszek (3-10)
    "flashcards_proposals": [          // Tablica propozycji fiszek
      {
        "front": string,               // Pytanie/przód fiszki
        "back": string,                // Odpowiedź/tył fiszki
        "source": "ai-full"            // Źródło: zawsze "ai-full"
      }
    ]
  }
}
```

#### Przykładowa odpowiedź sukcesu

```json
{
  "success": true,
  "data": {
    "generation_id": 1,
    "model": "openai/gpt-4 (mock)",
    "duration_ms": 2347,
    "generated_count": 5,
    "flashcards_proposals": [
      {
        "front": "What is the main topic covered in this text?",
        "back": "The text discusses various concepts related to the subject matter (React is a JavaScript library for building user in...).",
        "source": "ai-full"
      },
      {
        "front": "What are the key points mentioned?",
        "back": "The key points include fundamental concepts, practical applications, and important considerations for implementation.",
        "source": "ai-full"
      },
      {
        "front": "How can this information be applied?",
        "back": "This information can be applied in real-world scenarios by following the guidelines and best practices outlined in the content.",
        "source": "ai-full"
      },
      {
        "front": "What is the significance of this topic?",
        "back": "This topic is significant because it addresses fundamental aspects that are essential for understanding the broader context.",
        "source": "ai-full"
      },
      {
        "front": "What are the benefits of understanding this material?",
        "back": "Understanding this material provides a solid foundation for further learning and enables practical application of the concepts.",
        "source": "ai-full"
      }
    ]
  }
}
```

### Error Responses

#### 400 Bad Request - Błąd walidacji

**Przyczyny:**
- Brak pola `source_text`
- `source_text` nie jest stringiem
- Długość poza zakresem 1000-10000 znaków
- Pusty tekst lub tylko białe znaki

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Source text must be at least 1000 characters long",
    "details": {
      "field": "source_text",
      "current_length": 500,
      "min_length": 1000,
      "max_length": 10000
    }
  }
}
```

#### 401 Unauthorized - Brak uwierzytelnienia

**Przyczyny:**
- Brak tokenu Authorization (tylko w produkcji)
- Nieprawidłowy lub wygasły token JWT

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing authentication token"
  }
}
```

#### 429 Too Many Requests - Przekroczony rate limit

**Przyczyny:**
- Użytkownik wykonał 10 generacji dzisiaj

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have reached your daily generation limit. Please try again tomorrow.",
    "retry_after": "2025-10-11T00:00:00.000Z"
  }
}
```

#### 500 Internal Server Error - Błąd serwera

**Przyczyny:**
- Błąd bazy danych
- Nieoczekiwany błąd aplikacji

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

#### 503 Service Unavailable - Błąd usługi AI

**Przyczyny:**
- API Openrouter.ai niedostępne
- Timeout połączenia
- Błąd parsowania odpowiedzi AI

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

---

## Kody statusu HTTP

| Kod | Znaczenie | Opis |
|-----|-----------|------|
| 201 | Created | Fiszki wygenerowane pomyślnie |
| 400 | Bad Request | Błąd walidacji danych wejściowych |
| 401 | Unauthorized | Brak lub nieprawidłowy token uwierzytelnienia |
| 429 | Too Many Requests | Przekroczony dzienny limit generacji |
| 500 | Internal Server Error | Błąd serwera lub bazy danych |
| 503 | Service Unavailable | Usługa AI niedostępna |

---

## Rate Limiting

### Limity

- **Dzienny limit:** 10 generacji na użytkownika
- **Reset:** O północy UTC każdego dnia
- **W developmencie:** Wyłączony (flaga `SKIP_RATE_LIMIT: true`)

### Nagłówek Retry-After

Przy przekroczeniu limitu (429), nagłówek `Retry-After` zawiera timestamp ISO 8601 kiedy użytkownik może ponownie spróbować.

```http
Retry-After: 2025-10-11T00:00:00.000Z
```

---

## Zmienne środowiskowe

### Wymagane (w produkcji)

```bash
# Openrouter.ai API
OPENROUTER_API_KEY=sk-or-v1-...

# Model AI (opcjonalny, domyślnie: openai/gpt-4)
OPENROUTER_MODEL=openai/gpt-4
```

### Development

W trybie development (gdy `DEV_CONFIG.USE_MOCK_AI = true`):
- `OPENROUTER_API_KEY` nie jest wymagany
- Zwracane są mockowane dane testowe
- Rate limiting jest wyłączony

---

## Przepływ danych

```
┌─────────────────┐
│   Client        │
└────────┬────────┘
         │ POST /api/generations
         │ { source_text: "..." }
         ↓
┌─────────────────────────────┐
│   Middleware                │
│   - Inject Supabase client  │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│   Validation (Zod)          │
│   - Check length 1000-10000 │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│   Rate Limit Check          │
│   - Count today's gens      │
│   - Max: 10/day             │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│   AI Generation             │
│   - Openrouter.ai API       │
│   - Generate 5-8 cards      │
│   - Timeout: 60s            │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│   Save Metadata             │
│   - generations table       │
│   - Track duration, count   │
└────────┬────────────────────┘
         ↓
┌─────────────────────────────┐
│   Return Response (201)     │
│   - generation_id           │
│   - flashcards_proposals    │
└─────────────────────────────┘
```

---

## Baza danych

### Tabela: generations

Przechowuje metadane każdej generacji:

```sql
- id (SERIAL PRIMARY KEY)
- user_id (UUID, FK to auth.users)
- generation_time (TIMESTAMP, default: now())
- duration_ms (INTEGER)
- model (TEXT)
- generated_count (INTEGER)
- accepted_unedited_count (INTEGER, default: 0)
- accepted_edited_count (INTEGER, default: 0)
- source_text_hash (TEXT) -- MD5 hash
- source_text_length (INTEGER)
```

### Tabela: generation_error_logs

Loguje błędy AI API:

```sql
- id (UUID PRIMARY KEY)
- user_id (UUID, FK to auth.users)
- created_at (TIMESTAMP, default: now())
- model (TEXT)
- source_text_hash (TEXT)
- source_text_length (INTEGER)
- error_code (TEXT)
- error_message (TEXT)
```

---

## Bezpieczeństwo

### Uwierzytelnianie

- **Development:** Używa `DEFAULT_USER_ID` z bazy
- **Produkcja:** Wymagany Bearer token JWT z Supabase Auth

### Rate Limiting

- Zapobiega nadużyciom i kontroluje koszty API
- Per-użytkownik: 10 generacji dziennie
- Licznik resetuje się o północy UTC

### Prywatność danych

- `source_text` **nie jest przechowywany** w bazie
- Tylko hash MD5 i długość tekstu
- Zgodność z RODO

### Row-Level Security (RLS)

PostgreSQL RLS zapewnia izolację danych między użytkownikami:

```sql
CREATE POLICY "Users can only see their own generations"
ON generations FOR SELECT
USING (auth.uid() = user_id);
```

---

## Uwagi techniczne

### Mock Data (Development)

Gdy `USE_MOCK_AI = true`, endpoint zwraca 5 predefiniowanych fiszek testowych:
- Czas symulowany: 2-3 sekundy
- Model: `"openai/gpt-4 (mock)"`
- Zawsze 5 fiszek

### Timeout

- Timeout wywołania AI API: **60 sekund**
- Po przekroczeniu: błąd `AI_SERVICE_ERROR` z kodem `TIMEOUT_ERROR`

### Indeksy bazy danych

Dla wydajności rate limitingu:

```sql
CREATE INDEX idx_generations_user_time 
ON generations(user_id, generation_time DESC);
```

---

## Przykłady użycia

### Podstawowe wywołanie

```typescript
const generateFlashcards = async (text: string) => {
  try {
    const response = await fetch('/api/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ source_text: text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error.message);
    }

    const data = await response.json();
    return data.data.flashcards_proposals;
  } catch (error) {
    console.error('Failed to generate flashcards:', error);
    throw error;
  }
};
```

### Z obsługą rate limiting

```typescript
const generateWithRetry = async (text: string) => {
  try {
    return await generateFlashcards(text);
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = new Date(error.retry_after);
      console.log(`Rate limit exceeded. Retry after: ${retryAfter}`);
      // Pokaż użytkownikowi komunikat z czasem retry
    }
    throw error;
  }
};
```

---

## FAQ

**Q: Czy mogę zmienić liczbę generowanych fiszek?**  
A: Obecnie AI generuje 5-8 fiszek automatycznie. Ten parametr nie jest konfigurowalny przez API.

**Q: Co się stanie z moimi propozycjami fiszek?**  
A: Propozycje nie są automatycznie zapisywane. Musisz je zaakceptować używając endpointu `POST /api/flashcards/bulk`.

**Q: Czy mogę przekroczyć limit 10000 znaków?**  
A: Nie, jest to twarde ograniczenie w celu kontroli kosztów i jakości generacji.

**Q: Jak zresetować dzienny licznik rate limit?**  
A: Licznik resetuje się automatycznie o północy UTC. Nie można go zresetować ręcznie.

**Q: Czy tekst źródłowy jest przechowywany?**  
A: Nie, przechowywany jest tylko hash MD5 i długość tekstu dla celów analitycznych.

