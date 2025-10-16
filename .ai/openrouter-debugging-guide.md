# OpenRouter Integration - Debugging Guide

## Problem Report

**Error received:**

```json
{
  "error": {
    "code": "AI_SERVICE_ERROR",
    "details": "OpenRouter API error: Provider returned error",
    "message": "Unable to generate flashcards at this time. Please try again later."
  },
  "success": false
}
```

**HTTP Status:** 503

## Root Cause Analysis

The error "Provider returned error" from OpenRouter typically indicates one of the following issues:

### 1. JSON Schema Support Issue (Most Likely)

**Problem:** Not all models via OpenRouter support `response_format` with `json_schema` mode. The model `openai/gpt-4o-mini` may not support this feature through OpenRouter's API.

**Solution Applied:**

- Removed `response_format` with JSON Schema from the request
- Enhanced system prompt with explicit JSON format instructions
- Relying on prompt engineering instead of API-enforced schema

### 2. Model Availability

**Problem:** The specified model might be temporarily unavailable or not accessible with your API key.

**Check:** Verify model availability at https://openrouter.ai/models

### 3. API Key Configuration

**Problem:** API key might be invalid, expired, or have insufficient credits.

**Check:** Verify your OpenRouter API key and account status.

## Changes Made

### 1. Enhanced Error Logging

**File:** `src/lib/services/openrouter.service.ts`

Added detailed error logging in `assertOk()` method:

```typescript
// Log detailed error for debugging
console.error("OpenRouter API Error Details:", {
  status: response.status,
  statusText: response.statusText,
  details: errorDetails,
});
```

### 2. Removed JSON Schema from Request

**File:** `src/lib/services/generation.service.ts`

**Before:**

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

**After:**

```typescript
// Note: Some models via OpenRouter don't support response_format with json_schema
// We'll rely on prompt engineering instead
```

### 3. Enhanced System Prompt

Added explicit JSON format instructions to the system prompt:

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

### 4. Improved Response Parsing

**File:** `src/lib/services/generation.service.ts`

Enhanced `parseAIResponse()` to handle multiple response formats:

- Object with `flashcards` property
- Direct array of flashcards
- String that needs JSON parsing
- Better error logging for debugging

## Testing Instructions

### 1. Check Environment Variables

Ensure these are set:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_USE_MOCK=false
OPENROUTER_TIMEOUT_MS=60000
```

### 2. Start Development Server

```bash
npm run dev
```

### 3. Test with Sample Request

Use the test file `.ai/api-test-requests.http` or curl:

```bash
curl -X POST http://localhost:4321/api/generations \
  -H "Content-Type: application/json" \
  -d '{
    "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components and manage the state of their applications efficiently. The library uses a virtual DOM to optimize rendering performance, which means that instead of updating the entire page, React only updates the parts that have changed. This approach significantly improves the speed and efficiency of web applications. React components can be either functional or class-based, with modern React development heavily favoring functional components combined with Hooks. Hooks, introduced in React 16.8, allow developers to use state and other React features without writing a class. The most commonly used Hooks are useState for managing component state and useEffect for handling side effects like data fetching or subscriptions."
  }'
```

### 4. Check Server Logs

Monitor the console output for:

- "Parsing AI response:" - Shows the raw response from OpenRouter
- "OpenRouter API Error Details:" - Shows detailed error information
- "AI Response parsing failed:" - Shows parsing errors

### 5. Verify Response

**Expected Success Response:**

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
        "back": "A JavaScript library for building user interfaces",
        "source": "ai-full"
      }
      // ... more flashcards
    ]
  }
}
```

## Alternative Models to Try

If `gpt-4o-mini` continues to have issues, try these models:

### Models with Good JSON Support

1. **openai/gpt-4o** (more expensive but reliable)

   ```bash
   OPENROUTER_MODEL=openai/gpt-4o
   ```

2. **anthropic/claude-3-5-sonnet** (excellent at following instructions)

   ```bash
   OPENROUTER_MODEL=anthropic/claude-3-5-sonnet
   ```

3. **google/gemini-pro-1.5** (good balance of cost and quality)

   ```bash
   OPENROUTER_MODEL=google/gemini-pro-1.5
   ```

4. **meta-llama/llama-3.1-70b-instruct** (open source, good quality)
   ```bash
   OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
   ```

## Debugging Checklist

- [ ] Verify OpenRouter API key is valid
- [ ] Check OpenRouter account has sufficient credits
- [ ] Confirm model name is correct and available
- [ ] Check server logs for detailed error messages
- [ ] Try with mock mode first (`OPENROUTER_USE_MOCK=true`)
- [ ] Test with alternative model
- [ ] Verify network connectivity to OpenRouter API
- [ ] Check if OpenRouter service status is normal

## Common Issues and Solutions

### Issue: "Provider returned error"

**Solutions:**

1. ✅ Remove `response_format` (already done)
2. Try different model
3. Check API key and credits
4. Verify model availability

### Issue: "Invalid JSON in response"

**Solutions:**

1. Enhanced prompt with explicit format (already done)
2. Increase `max_tokens` if response is truncated
3. Try model with better instruction following

### Issue: "Validation error"

**Solutions:**

1. Check Zod schema matches expected format
2. Review AI response in logs
3. Adjust min/max flashcard counts if needed

### Issue: Timeout

**Solutions:**

1. Increase `OPENROUTER_TIMEOUT_MS`
2. Reduce `source_text` length
3. Try faster model

## Monitoring Recommendations

### 1. Error Logging

All errors are logged to `generation_error_logs` table:

```sql
SELECT * FROM generation_error_logs
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Success Rate

Monitor generation success rate:

```sql
SELECT
  COUNT(*) as total_attempts,
  (SELECT COUNT(*) FROM generations) as successful,
  (SELECT COUNT(*) FROM generation_error_logs) as failed
FROM (
  SELECT 1 FROM generations
  UNION ALL
  SELECT 1 FROM generation_error_logs
) as all_attempts;
```

### 3. Model Performance

Track which models work best:

```sql
SELECT
  model,
  COUNT(*) as count,
  AVG(duration_ms) as avg_duration,
  AVG(generated_count) as avg_flashcards
FROM generations
GROUP BY model
ORDER BY count DESC;
```

## Next Steps

1. **Test the changes** with your OpenRouter API key
2. **Monitor logs** to see actual error details
3. **Try alternative models** if issue persists
4. **Report findings** - share console logs if errors continue

## Support Resources

- OpenRouter Documentation: https://openrouter.ai/docs
- OpenRouter Discord: https://discord.gg/openrouter
- Model List: https://openrouter.ai/models
- API Status: https://status.openrouter.ai/
