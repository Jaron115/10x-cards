# Generation Service

Moduł do generowania fiszek przy użyciu AI (OpenRouter.ai) z obsługą wielu strategii generowania.

## 📁 Struktura

```
generation/
├── generation.service.ts       - Główny service (134 LOC)
├── types.ts                    - Typy i interfaces
├── strategies/                 - Strategie generowania
│   ├── mock-generation.strategy      - Mock dla dev/testing
│   └── openrouter-generation.strategy - Produkcyjna AI generacja
├── parsers/                    - Chain of Responsibility parsery
│   ├── ResponseParser          - Abstract base
│   ├── ObjectWithFlashcardsParser - { flashcards: [...] }
│   ├── ArrayParser             - [...]
│   └── StringParser            - "..." (JSON string)
└── classifiers/                - Klasyfikatory
    └── AIErrorClassifier       - Klasyfikacja błędów AI
```

## 🎯 Główne funkcjonalności

### **GenerationService**

```typescript
const service = new GenerationService(supabase, apiKey, model);

// Generate flashcards
const result = await service.generateFlashcards(sourceText);
// Returns: { flashcards_proposals, model, duration_ms }

// Log generation to database
const generationId = await service.logGeneration(userId, result, sourceText, model);

// Log errors
await service.logError(userId, sourceText, model, error);
```

## 🎨 Wzorce projektowe

### **1. Strategy Pattern - GenerationStrategy**

Wybór strategii generowania (Mock vs Real AI):

```typescript
interface GenerationStrategy {
  generateFlashcards(sourceText: string, apiKey: string, model: string): Promise<GenerationResult>;
}

// Mock Strategy - dla development/testing
class MockGenerationStrategy implements GenerationStrategy {
  async generateFlashcards(...) {
    // Zwraca predefiniowane fiszki + delay 2-3s
  }
}

// OpenRouter Strategy - produkcyjna AI generacja
class OpenRouterGenerationStrategy implements GenerationStrategy {
  async generateFlashcards(...) {
    // Wywołuje OpenRouter API + parsuje response
  }
}
```

### **2. Chain of Responsibility - Response Parsers**

Parsowanie różnych formatów AI response:

```typescript
// Setup chain
const parser = new ObjectWithFlashcardsParser();
parser.setNext(new ArrayParser()).setNext(new StringParser());

// Parse (próbuje kolejno)
const { flashcards } = parser.parse(aiResponse);
```

### **3. Dependency Injection**

Service przyjmuje strategię przez konstruktor:

```typescript
// Production
const strategy = new OpenRouterGenerationStrategy(timeoutMs);
const service = new GenerationService(supabase, apiKey, model, strategy);

// Testing
const mockStrategy = new MockGenerationStrategy();
const service = new GenerationService(supabase, apiKey, model, mockStrategy);
```

## 📊 Response Formats

Parser obsługuje 3 formaty:

```typescript
// Format 1: Object with flashcards property (primary)
{
  "flashcards": [
    { "front": "Q1", "back": "A1" },
    { "front": "Q2", "back": "A2" }
  ]
}

// Format 2: Direct array (fallback)
[
  { "front": "Q1", "back": "A1" },
  { "front": "Q2", "back": "A2" }
]

// Format 3: JSON string (fallback)
"{\"flashcards\":[...]}"  // or "[...]"
```

## 🔄 Error Handling

```typescript
try {
  const result = await service.generateFlashcards(text);
} catch (error) {
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case "TIMEOUT_ERROR": // Request timed out
      case "NETWORK_ERROR": // Connection failed
      case "AI_SERVICE_ERROR": // OpenRouter API error
      case "PARSE_ERROR": // Invalid response format
      case "VALIDATION_ERROR": // Validation failed
      case "UNKNOWN_ERROR": // Other error
    }
  }
}
```

## 📊 Metryki

- **Linie kodu:** 431 LOC (z 329 LOC przed refaktorem)
- **Pliki:** 8 (z 1 przed refaktorem)
- **Główny service:** 134 LOC (tylko orchestration)
- **Testowalne komponenty:** 8
- **Obsługiwane formaty:** 3

## 🧪 Testing

```bash
# Mock strategy (dev/test)
OPENROUTER_USE_MOCK=true npm test

# Real AI (production)
OPENROUTER_USE_MOCK=false npm test
```

## 📚 Dependency Graph

```
GenerationService
  ├─ GenerationStrategy (interface)
  │   ├─ MockGenerationStrategy
  │   └─ OpenRouterGenerationStrategy
  │       ├─ OpenRouterService
  │       ├─ ResponseParser (chain)
  │       │   ├─ ObjectWithFlashcardsParser
  │       │   ├─ ArrayParser
  │       │   └─ StringParser
  │       └─ AIErrorClassifier
  └─ calculateMD5 (utils)
```

## 🔄 Konwencje

- ✅ **Bez `.ts` extensions** w importach
- ✅ **Bez re-exports** - bezpośrednie importy
- ✅ **Strategy Pattern** - łatwe dodanie nowych AI providers
- ✅ **Chain of Responsibility** - elastyczne parsowanie
- ✅ **Dependency Injection** - testowalne komponenty
- ✅ **Retry Logic** - resilience w OpenRouter
- ✅ **Error Classification** - szczegółowa diagnostyka

## 🚀 Dodawanie nowego AI providera

```typescript
// 1. Implementuj interface
class NewAIProviderStrategy implements GenerationStrategy {
  async generateFlashcards(sourceText, apiKey, model) {
    // Your implementation
  }
}

// 2. Użyj w service
const strategy = new NewAIProviderStrategy();
const service = new GenerationService(supabase, apiKey, model, strategy);
```
