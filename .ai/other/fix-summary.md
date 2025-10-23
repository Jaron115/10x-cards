# OpenRouter Integration - Bug Fix Summary

## Problem

Otrzymano błąd 503 z OpenRouter API:

```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "details": "OpenRouter API error: Provider returned error",
    "message": "Unable to generate flashcards at this time. Please try again later."
  }
}
```

## Root Cause

Model `openai/gpt-4o-mini` przez OpenRouter API **nie wspiera** parametru `response_format` z `json_schema`. To jest ograniczenie po stronie OpenRouter, nie wszystkie modele mają tę funkcjonalność.

## Solution

### 1. Usunięto JSON Schema z żądania

**Przed:**

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "FlashcardProposals",
    strict: true,
    schema: FLASHCARD_PROPOSALS_JSON_SCHEMA
  }
}
```

**Po:**

```typescript
// Removed - not all models support this via OpenRouter
// Relying on prompt engineering instead
```

### 2. Wzmocniono System Prompt

Dodano explicit JSON format instructions:

```typescript
const enhancedSystemPrompt = `${FLASHCARD_GENERATION_SYSTEM_PROMPT}

IMPORTANT: You MUST respond with valid JSON in this exact format:
{
  "flashcards": [
    {"front": "question text", "back": "answer text"},
    {"front": "question text", "back": "answer text"}
  ]
}

Generate between 5 and 8 flashcards. Do not include any text before or after the JSON.`;
```

### 3. Ulepszone Parsowanie Odpowiedzi

Dodano wsparcie dla różnych formatów:

- Object z property `flashcards`
- Bezpośrednia tablica
- String wymagający JSON.parse()
- Lepsze logowanie błędów

```typescript
// Log parsed response for debugging
console.log("Parsing AI response:", JSON.stringify(parsed).substring(0, 500));

if (typeof parsed === "object" && parsed !== null && "flashcards" in parsed) {
  flashcardsArray = (parsed as { flashcards: unknown }).flashcards;
} else if (Array.isArray(parsed)) {
  flashcardsArray = parsed;
} else if (typeof parsed === "string") {
  // Try to parse string as JSON
  const jsonParsed = JSON.parse(parsed);
  // ... handle parsed result
}
```

### 4. Dodano Szczegółowe Logowanie Błędów

W `openrouter.service.ts`:

```typescript
// Log detailed error for debugging
console.error("OpenRouter API Error Details:", {
  status: response.status,
  statusText: response.statusText,
  details: errorDetails,
});
```

## Files Changed

1. **`src/lib/services/generation.service.ts`**
   - Usunięto `response_format` z żądania
   - Dodano enhanced system prompt
   - Ulepszone `parseAIResponse()` z lepszym error handling
   - Dodano debug logging

2. **`src/lib/services/openrouter.service.ts`**
   - Dodano szczegółowe logowanie błędów w `assertOk()`
   - Dodano error code do komunikatu błędu

3. **`.ai/openrouter-debugging-guide.md`** (nowy)
   - Kompletny przewodnik debugowania
   - Lista rekomendowanych modeli
   - Instrukcje testowania

4. **`.ai/test-openrouter.http`** (nowy)
   - Szybkie testy HTTP
   - Przykładowe żądania

5. **`.ai/openrouter-implementation-summary.md`** (zaktualizowany)
   - Dodano sekcję "Known Issues & Fixes"

## Testing Instructions

### 1. Uruchom serwer deweloperski

```bash
npm run dev
```

### 2. Sprawdź zmienne środowiskowe

Upewnij się że masz:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_USE_MOCK=false
```

### 3. Testuj z przykładowym tekstem

Użyj pliku `.ai/test-openrouter.http` lub:

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance, which means that instead of updating the entire page, React only updates the parts that have changed. This approach significantly improves the speed and efficiency of web applications. React components can be either functional or class-based, with modern React development heavily favoring functional components combined with Hooks. Hooks, introduced in React 16.8, allow developers to use state and other React features without writing a class."
}
EOF
```

### 4. Monitoruj logi konsoli

Szukaj:

- ✅ "Parsing AI response:" - pokazuje surową odpowiedź
- ❌ "OpenRouter API Error Details:" - szczegóły błędu
- ❌ "AI Response parsing failed:" - błędy parsowania

## Expected Behavior

### Success Response

```json
{
  "success": true,
  "data": {
    "generation_id": 1,
    "model": "openai/gpt-4o-mini",
    "duration_ms": 2500,
    "generated_count": 5,
    "flashcards_proposals": [
      {
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces developed by Facebook",
        "source": "ai-full"
      },
      {
        "front": "What is the Virtual DOM?",
        "back": "A programming concept where a virtual representation of the UI is kept in memory and synced with the real DOM",
        "source": "ai-full"
      }
      // ... 3-6 more flashcards
    ]
  }
}
```

### Console Output (Success)

```
Parsing AI response: {"flashcards":[{"front":"What is React?","back":"A JavaScript library..."}]}
```

### Console Output (Error)

```
OpenRouter API Error Details: {
  status: 400,
  statusText: "Bad Request",
  details: { error: { message: "...", code: "..." } }
}
```

## Alternative Models (if issues persist)

Jeśli `gpt-4o-mini` nadal nie działa, spróbuj:

### 1. OpenAI GPT-4o (najlepszy dla JSON)

```bash
OPENROUTER_MODEL=openai/gpt-4o
```

### 2. Anthropic Claude 3.5 Sonnet (doskonały w następowaniu instrukcji)

```bash
OPENROUTER_MODEL=anthropic/claude-3-5-sonnet
```

### 3. Google Gemini Pro 1.5 (dobry balans)

```bash
OPENROUTER_MODEL=google/gemini-pro-1.5
```

### 4. Meta Llama 3.1 70B (open source)

```bash
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

## Verification Checklist

- [x] Build passes (`npm run build`)
- [x] No TypeScript errors
- [x] No linter errors
- [x] Enhanced error logging added
- [x] JSON Schema removed from requests
- [x] System prompt enhanced
- [x] Response parsing improved
- [ ] Manual testing with real API key (requires user)
- [ ] Verify with alternative models (requires user)

## Next Actions for User

1. **Test z prawdziwym API key** - uruchom serwer i przetestuj endpoint
2. **Sprawdź logi konsoli** - zobacz szczegóły błędów jeśli występują
3. **Spróbuj alternatywnych modeli** - jeśli problem się powtarza
4. **Zgłoś wyniki** - podziel się logami konsoli jeśli błędy nadal występują

## Documentation

- **Debugging Guide:** `.ai/openrouter-debugging-guide.md`
- **Test Requests:** `.ai/test-openrouter.http`
- **Implementation Summary:** `.ai/openrouter-implementation-summary.md`

## Build Status

✅ **Build: PASSED**

```
npm run build
✓ Completed in 5.06s
```

✅ **TypeScript: PASSED**
✅ **Linter: PASSED**
