# Flashcard Service

Kompleksowy moduł do zarządzania fiszkami (CRUD operations) z zaawansowaną logiką biznesową.

## 📁 Struktura

```
flashcard/
├── flashcard.service.ts        - Główny service (216 LOC)
├── types.ts                    - Typy specyficzne dla modułu
├── builders/                   - Query builders
│   └── FlashcardQueryBuilder   - Fluent API dla Supabase queries
├── mappers/                    - Transformacje danych
│   ├── FlashcardMapper         - Entity ↔ DTO
│   ├── BulkFlashcardMapper     - Bulk operations mapping
│   └── FlashcardUpdateMapper   - Update operations + transitions
├── utils/                      - Narzędzia pomocnicze
│   ├── PaginationCalculator    - Kalkulacje paginacji
│   └── FlashcardCounter        - Liczenie fiszek według źródeł
├── validators/                 - Walidatory biznesowe
│   └── GenerationCapacityValidator - Walidacja limitu generacji
├── orchestrators/              - Orkiestracja złożonych procesów
│   └── BulkFlashcardOrchestrator - Bulk creation workflow
└── strategies/                 - Strategie biznesowe
    └── SourceTransitionStrategy - State machine dla statusów
```

## 🎯 Główne funkcjonalności

### **FlashcardService**

```typescript
const service = new FlashcardService(supabase);

// CRUD Operations
await service.getFlashcards(userId, { page, limit, source, sort, order });
await service.getFlashcardById(id, userId);
await service.createFlashcard(userId, { front, back });
await service.createFlashcardsBulk(userId, generationId, flashcards);
await service.updateFlashcard(id, userId, { front, back });
await service.deleteFlashcard(id, userId);
```

## 🎨 Wzorce projektowe

### **1. Builder Pattern - FlashcardQueryBuilder**

Fluent API dla budowania zapytań Supabase:

```typescript
const builder = new FlashcardQueryBuilder(supabase);
const { data, count } = await builder
  .forUser(userId)
  .withSource("ai-full")
  .orderBy("created_at", "desc")
  .paginate(0, 10)
  .execute();
```

### **2. Orchestrator Pattern - BulkFlashcardOrchestrator**

Koordynuje złożony proces bulk creation:

```typescript
const orchestrator = new BulkFlashcardOrchestrator(supabase);
const result = await orchestrator.execute(userId, generationId, flashcards);
// 1. Weryfikuje generation
// 2. Waliduje capacity
// 3. Liczy flashcards według źródeł
// 4. Wstawia do bazy
// 5. Aktualizuje generation counts
// 6. Zwraca rezultat
```

### **3. State Machine - SourceTransitionStrategy**

Zarządza przejściami statusów fiszek:

```typescript
// Reguły przejść:
"ai-full" + content changed   → "ai-edited"  ✓
"ai-full" + no changes         → "ai-full"   (no transition)
"manual"  + any changes        → "manual"    (no transition)
"ai-edited" + any changes      → "ai-edited" (no transition)

// Użycie:
const newSource = getTransitionedSource(existing, command);
```

## 📊 Metryki

- **Linie kodu:** 823 LOC (z 314 LOC przed refaktorem)
- **Pliki:** 13 (z 1 przed refaktorem)
- **Redukcja głównego service:** 314 → 216 LOC (-31%)
- **Testowalne komponenty:** 13
- **Reusable utilities:** 7

## 🧪 Testowanie

```bash
npm test                # Unit tests
npm run test:e2e        # E2E tests
```

## 📚 Dependency Graph

```
FlashcardService
  ├─ FlashcardQueryBuilder
  │   └─ PaginationCalculator
  ├─ BulkFlashcardOrchestrator
  │   ├─ GenerationCapacityValidator
  │   ├─ FlashcardCounter
  │   ├─ BulkFlashcardMapper
  │   └─ FlashcardMapper
  └─ FlashcardUpdateMapper
      └─ SourceTransitionStrategy
```

## 🔄 Konwencje

- ✅ **Bez `.ts` extensions** w importach
- ✅ **Bez re-exports** - bezpośrednie importy
- ✅ **PascalCase** dla klas i typów
- ✅ **camelCase** dla funkcji
- ✅ **JSDoc** dla wszystkich publicznych API
- ✅ **Single Responsibility** - każdy moduł robi jedną rzecz
