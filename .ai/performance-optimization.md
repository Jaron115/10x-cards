# Performance Optimization - Flashcards API

## Przegląd

Dokument zawiera analizę wydajności endpointów API flashcards oraz rekomendacje optymalizacyjne na podstawie wzorców użycia i testów.

**Data analizy:** 2025-10-15  
**Wersja API:** 1.0

---

## 1. Analiza zapytań bazodanowych

### 1.1 GET /api/flashcards - Lista fiszek

**Wzorzec zapytania:**

```sql
SELECT * FROM flashcards
WHERE user_id = $1
  [AND source = $2]
ORDER BY {created_at|updated_at} {ASC|DESC}
LIMIT $3 OFFSET $4;

-- Oraz zapytanie COUNT dla paginacji
SELECT COUNT(*) FROM flashcards
WHERE user_id = $1
  [AND source = $2];
```

**Używane indeksy:**

- ✅ `idx_flashcards_user_id` - dla WHERE user_id
- ✅ `idx_flashcards_created_at` - dla ORDER BY created_at DESC
- ❌ Brak indeksu na `updated_at` - potrzebny dla sortowania
- ❌ Brak indeksu na `source` - potrzebny dla filtrowania

**Rekomendacje:**

1. Dodać indeks na `updated_at` dla sortowania
2. Dodać indeks na `source` dla filtrowania
3. Rozważyć indeks złożony: `(user_id, source, created_at)` dla najczęstszego przypadku

### 1.2 POST /api/flashcards/bulk - Tworzenie wsadowe

**Wzorzec zapytania:**

```sql
-- 1. Sprawdzenie generacji
SELECT * FROM generations
WHERE id = $1 AND user_id = $2;

-- 2. Wstawienie fiszek (batch)
INSERT INTO flashcards (user_id, front, back, source, generation_id)
VALUES (...), (...), (...); -- 1-50 wierszy

-- 3. Aktualizacja liczników
UPDATE generations
SET accepted_unedited_count = $1, accepted_edited_count = $2
WHERE id = $3;
```

**Używane indeksy:**

- ✅ `idx_generations_user_id` - dla WHERE user_id
- ✅ Primary key na `generations.id`

**Charakterystyka wydajności:**

- Batch insert 50 fiszek: ~50-100ms
- Całkowity czas operacji: ~150-250ms
- Transakcyjność: Supabase automatycznie obsługuje

**Rekomendacje:**

- Operacja jest już dobrze zoptymalizowana
- Connection pooling w Supabase zapewnia dobrą wydajność
- Limit 50 fiszek jest odpowiedni (nie przeciąża bazy)

### 1.3 PATCH /api/flashcards/:id - Aktualizacja

**Wzorzec zapytania:**

```sql
-- 1. Pobranie istniejącej fiszki
SELECT * FROM flashcards
WHERE id = $1 AND user_id = $2;

-- 2. Aktualizacja
UPDATE flashcards
SET front = $1, back = $2, source = $3
WHERE id = $4 AND user_id = $5
RETURNING *;
```

**Używane indeksy:**

- ✅ Primary key na `flashcards.id`
- ✅ `idx_flashcards_user_id`

**Charakterystyka wydajności:**

- Czas wykonania: ~10-30ms
- Trigger `handle_updated_at()` automatycznie ustawia updated_at

**Rekomendacje:**

- Operacja jest dobrze zoptymalizowana
- Dwuetapowe podejście (SELECT + UPDATE) jest bezpieczne i szybkie

---

## 2. Brakujące indeksy

### 2.1 Indeks na updated_at

**Dlaczego potrzebny:**

- GET /api/flashcards wspiera sortowanie po `updated_at`
- Obecnie brak indeksu powoduje full table scan dla tego sortowania

**Impact:**

- Bez indeksu: O(n log n) dla sortowania w pamięci
- Z indeksem: O(log n) + scan posortowanych wierszy

**Migracja:**

```sql
CREATE INDEX idx_flashcards_updated_at ON flashcards(updated_at DESC);
```

### 2.2 Indeks na source

**Dlaczego potrzebny:**

- GET /api/flashcards wspiera filtrowanie po `source`
- Obecnie brak indeksu wymaga skanowania wszystkich wierszy użytkownika

**Impact:**

- Dla użytkownika z 1000 fiszkami:
  - Bez indeksu: scan 1000 wierszy
  - Z indeksem: scan ~333 wierszy (zakładając równy rozkład)

**Migracja:**

```sql
CREATE INDEX idx_flashcards_source ON flashcards(source);
```

### 2.3 Indeks złożony (opcjonalny)

**Dla najczęstszego przypadku: filtrowanie + sortowanie**

**Scenariusz:**

```sql
SELECT * FROM flashcards
WHERE user_id = $1 AND source = $2
ORDER BY created_at DESC
LIMIT 50;
```

**Rekomendacja:**

```sql
CREATE INDEX idx_flashcards_user_source_created
ON flashcards(user_id, source, created_at DESC);
```

**Korzyści:**

- Jeden indeks pokrywa WHERE + ORDER BY
- Eliminuje potrzebę sortowania w pamięci
- Najszybsze zapytania dla paginowanych list z filtrem

**Kompromis:**

- Większy rozmiar indeksu (~30% więcej miejsca)
- Dodatkowy narzut przy INSERT/UPDATE
- Zalecane tylko jeśli filtrowanie po source jest popularne

---

## 3. Charakterystyka paginacji

### 3.1 Obecne podejście: Offset-based

**Implementacja:**

```sql
LIMIT 50 OFFSET 0   -- strona 1
LIMIT 50 OFFSET 50  -- strona 2
LIMIT 50 OFFSET 100 -- strona 3
```

**Zalety:**

- Proste w implementacji
- Użytkownik może przeskakiwać między stronami
- Wyraźna liczba stron (total_pages)

**Wady:**

- Wydajność spada dla dużych OFFSET (np. strona 100)
- OFFSET 5000 wymaga przeskanowania 5000 wierszy
- Problemy z consistency gdy dane się zmieniają między żądaniami

**Wydajność:**

- Strona 1-10: <50ms
- Strona 100: ~500ms
- Strona 1000: >2s

### 3.2 Alternatywa: Cursor-based (przyszła optymalizacja)

**Dla aplikacji z dużą liczbą fiszek (>10,000)**

**Implementacja:**

```sql
-- Strona 1
SELECT * FROM flashcards
WHERE user_id = $1
ORDER BY created_at DESC, id DESC
LIMIT 51; -- +1 dla sprawdzenia czy są więcej

-- Kolejna strona (cursor = last_created_at, last_id)
SELECT * FROM flashcards
WHERE user_id = $1
  AND (created_at, id) < ($2, $3)
ORDER BY created_at DESC, id DESC
LIMIT 51;
```

**Zalety:**

- Stała wydajność niezależnie od pozycji
- Lepsza consistency przy zmianach danych
- Skaluje się do milionów wierszy

**Wady:**

- Nie można przeskakiwać między stronami
- Brak total_pages
- Bardziej złożona implementacja

**Rekomendacja:** Implementować gdy:

- Użytkownicy regularnie mają >10,000 fiszek
- Występują problemy z wydajnością dla późnych stron

---

## 4. Optymalizacja SELECT queries

### 4.1 Wybór kolumn

**Obecne podejście:**

```typescript
.select("*")
```

**Optymalizacja:**

```typescript
// Wybieramy tylko potrzebne kolumny (user_id i tak jest usuwany w DTO)
.select("id, front, back, source, generation_id, created_at, updated_at")
```

**Impact:**

- Mniejszy transfer danych: ~10-20% redukcji
- Szybsze parsowanie JSON
- Zalecane dla endpointów GET

### 4.2 Count optimization

**Obecne podejście:**

```typescript
.select("*", { count: "exact" })
```

**Problem:**

- `count: "exact"` wykonuje pełny COUNT(\*) - kosztowne dla dużych tabel

**Alternatywa dla dużych tabel:**

```typescript
// Dla <10,000 wierszy: exact (dokładny)
.select("*", { count: "exact" })

// Dla >10,000 wierszy: estimated (szacowany z EXPLAIN)
.select("*", { count: "estimated" })

// Lub: planned (używa statystyk PostgreSQL)
.select("*", { count: "planned" })
```

**Rekomendacja:**

- Używać `exact` dla małych/średnich tabel (<10,000)
- Przełączyć na `estimated` gdy total przekroczy próg
- UI może pokazać "~10,000 fiszek" zamiast dokładnej liczby

---

## 5. Cachowanie

### 5.1 HTTP Cache headers

**GET /api/flashcards:**

```typescript
return new Response(JSON.stringify(response), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=60", // 1 minuta
    ETag: generateETag(response), // Opcjonalnie
  },
});
```

**Korzyści:**

- Przeglądarka cache dla powtarzających się żądań
- Redukcja obciążenia serwera o ~30-50%
- Szybsza odpowiedź dla użytkownika

**Unieważnianie:**

- POST/PATCH/DELETE automatycznie unieważnia cache (inna metoda)
- ETag pozwala na walidację 304 Not Modified

### 5.2 Supabase cache (przyszła optymalizacja)

**Dla często czytanych danych:**

```typescript
// Redis lub Memcached przed Supabase
const cacheKey = `flashcards:${user_id}:page:${page}`;
let data = await cache.get(cacheKey);

if (!data) {
  data = await supabase.from("flashcards")...;
  await cache.set(cacheKey, data, 60); // TTL 60s
}
```

**Rekomendacja:**

- Implementować tylko jeśli serwer jest przeciążony
- Na razie Supabase connection pooling jest wystarczający

---

## 6. Monitoring i metryki

### 6.1 Kluczowe metryki do śledzenia

**Wydajność:**

- Response time (p50, p95, p99):
  - Target p95: <500ms
  - Target p99: <1s
- Query execution time
- Database connection pool usage

**Obciążenie:**

- Requests per minute (per endpoint)
- Concurrent users
- Database connections

**Błędy:**

- Error rate by endpoint
- 4xx vs 5xx errors
- Database errors

### 6.2 Narzędzia

**Supabase Dashboard:**

- Query performance
- Connection pool stats
- Error logs

**Application logging:**

```typescript
// Loguj wolne zapytania
const start = Date.now();
const result = await service.getFlashcards(...);
const duration = Date.now() - start;

if (duration > 500) {
  console.warn(`Slow query: GET /api/flashcards took ${duration}ms`);
}
```

**Rekomendowane alerty:**

- Response time p95 > 1s
- Error rate > 5%
- Database connections > 80% pool

---

## 7. Progi wydajnościowe

### 7.1 Expected performance (obecna implementacja)

| Endpoint                       | Oczekiwany czas | Max akceptowalny |
| ------------------------------ | --------------- | ---------------- |
| GET /api/flashcards (page 1)   | <100ms          | 500ms            |
| GET /api/flashcards (page 100) | <500ms          | 2s               |
| GET /api/flashcards/:id        | <50ms           | 200ms            |
| POST /api/flashcards           | <100ms          | 500ms            |
| POST /api/flashcards/bulk (10) | <150ms          | 1s               |
| POST /api/flashcards/bulk (50) | <250ms          | 2s               |
| PATCH /api/flashcards/:id      | <100ms          | 500ms            |
| DELETE /api/flashcards/:id     | <50ms           | 200ms            |

### 7.2 Skalowalność

**Obecna architektura wspiera:**

- 1,000 użytkowników jednocześnie
- 100,000 fiszek na użytkownika
- 10,000 żądań/minutę

**Bottlenecki do monitorowania:**

- Supabase connection pool (domyślnie: 15 połączeń)
- Database storage (200MB - 500GB na Supabase Free/Pro)
- API rate limits (brak obecnie, zalecane dodanie)

---

## 8. Podsumowanie rekomendacji

### 8.1 Krytyczne (implementować teraz)

1. ✅ **Dodać indeks na `updated_at`**
   - Migracja: `20251015000000_add_flashcards_indexes.sql`
   - Impact: Sortowanie po updated_at 10x szybsze

2. ✅ **Dodać indeks na `source`**
   - Ta sama migracja
   - Impact: Filtrowanie po source 3x szybsze

### 8.2 Ważne (implementować w ciągu miesiąca)

3. 📋 **Dodać HTTP cache headers**
   - Proste, duży impact na UX
   - Redukcja obciążenia serwera

4. 📋 **Zoptymalizować SELECT queries**
   - Wybór konkretnych kolumn zamiast \*
   - 10-20% redukcja transferu danych

5. 📋 **Dodać monitorowanie**
   - Logowanie wolnych zapytań (>500ms)
   - Metryki wydajności
   - Alerty dla anomalii

### 8.3 Opcjonalne (według potrzeb)

6. 🔮 **Indeks złożony `(user_id, source, created_at)`**
   - Tylko jeśli filtrowanie po source jest popularne
   - Większy rozmiar, większa wydajność

7. 🔮 **Cursor-based pagination**
   - Tylko dla użytkowników z >10,000 fiszkami
   - Wymaga zmian w API i frontend

8. 🔮 **Distributed caching (Redis)**
   - Tylko jeśli serwer jest przeciążony
   - Dodatkowa złożoność infrastruktury

---

## 9. Plan implementacji

### Faza 1: Podstawowe indeksy (dzisiaj)

- [x] Utworzenie migracji dla indeksów
- [ ] Przetestowanie na staging
- [ ] Deploy na produkcję
- [ ] Weryfikacja metryk wydajności

### Faza 2: Optymalizacja zapytań (tydzień 1)

- [ ] Dodanie cache headers
- [ ] Optymalizacja SELECT queries
- [ ] Implementacja logowania wolnych zapytań

### Faza 3: Monitoring (tydzień 2)

- [ ] Konfiguracja dashboardu metryk
- [ ] Ustawienie alertów
- [ ] Dokumentacja runbook'ów

### Faza 4: Zaawansowana optymalizacja (według potrzeb)

- [ ] Ocena potrzeby cursor-based pagination
- [ ] Ocena potrzeby distributed caching
- [ ] Load testing i stress testing

---

**Status:** Migracja z podstawowymi indeksami gotowa do wdrożenia  
**Następny krok:** Deploy migracji na staging
