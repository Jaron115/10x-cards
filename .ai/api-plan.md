# REST API Plan for 10x-cards

## 1. Resources

The API is organized around the following main resources:

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Authentication | `auth.users` | User registration, login, and account management (handled by Supabase Auth) |
| Flashcards | `flashcards` | User's flashcards (manual and AI-generated) |
| Generations | `generations` | AI flashcard generation sessions and metadata |
| Study | `flashcards` | Study session management with spaced repetition |

**Note**: The `generation_error_logs` table is used internally for logging and monitoring, not exposed via public API endpoints.

## 2. Endpoints

### 2.1 Authentication

Authentication is handled by Supabase Auth SDK on the client side. All API endpoints require a valid Supabase session token passed in the `Authorization` header:

```
Authorization: Bearer <supabase_jwt_token>
```

**Client-side operations (Supabase SDK):**
- Sign up: `supabase.auth.signUp({ email, password })`
- Sign in: `supabase.auth.signInWithPassword({ email, password })`
- Sign out: `supabase.auth.signOut()`
- Get session: `supabase.auth.getSession()`

**Account Deletion Endpoint:**

#### DELETE /api/user/account

Permanently deletes the user's account and all associated data (GDPR compliance).

**Request:**
- Headers: `Authorization: Bearer <token>`
- Body: None

**Success Response:**
```json
{
  "success": true,
  "message": "Account and all associated data permanently deleted"
}
```
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 500 Internal Server Error: Database error during deletion

---

### 2.2 Flashcards

#### GET /api/flashcards

Retrieves all flashcards for the authenticated user.

**Request:**
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `page` (optional, default: 1): Page number for pagination
  - `limit` (optional, default: 50, max: 100): Number of flashcards per page
  - `source` (optional): Filter by source ('manual', 'ai-full', 'ai-edited')
  - `sort` (optional, default: 'created_at'): Sort field ('created_at', 'updated_at')
  - `order` (optional, default: 'desc'): Sort order ('asc', 'desc')

**Success Response:**
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": 1,
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces",
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
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 400 Bad Request: Invalid query parameters

---

#### GET /api/flashcards/:id

Retrieves a specific flashcard by ID.

**Request:**
- Headers: `Authorization: Bearer <token>`
- URL Parameters: `id` (flashcard ID)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "What is React?",
    "back": "A JavaScript library for building user interfaces",
    "source": "ai-full",
    "generation_id": 123,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:00:00Z"
  }
}
```
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 404 Not Found: Flashcard not found or doesn't belong to user
- 400 Bad Request: Invalid flashcard ID format

---

#### POST /api/flashcards

Creates a single manual flashcard.

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```json
{
  "front": "What is TypeScript?",
  "back": "A typed superset of JavaScript that compiles to plain JavaScript"
}
```

**Validation Rules:**
- `front`: Required, string, max 200 characters
- `back`: Required, string, max 500 characters

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "front": "What is TypeScript?",
    "back": "A typed superset of JavaScript that compiles to plain JavaScript",
    "source": "manual",
    "generation_id": null,
    "created_at": "2025-10-10T10:05:00Z",
    "updated_at": "2025-10-10T10:05:00Z"
  }
}
```
**HTTP Status**: 201 Created

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 400 Bad Request: Validation errors
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": [
        {
          "field": "front",
          "message": "Front text is required and must be max 200 characters"
        }
      ]
    }
  }
  ```
- 500 Internal Server Error: Database error

---

#### POST /api/flashcards/bulk

Creates multiple flashcards at once (used after AI generation to save approved flashcards).

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```json
{
  "generation_id": 123,
  "flashcards": [
    {
      "front": "What is React?",
      "back": "A JavaScript library for building user interfaces",
      "source": "ai-full"
    },
    {
      "front": "What is JSX?",
      "back": "A syntax extension for JavaScript that looks similar to XML/HTML",
      "source": "ai-edited"
    }
  ]
}
```

**Validation Rules:**
- `generation_id`: Required, must be a valid generation ID belonging to the user
- `flashcards`: Required, array with at least 1 item, max 50 items
- Each flashcard: Same validation as single flashcard creation
- `source`: Must be 'ai-full' or 'ai-edited' (not 'manual')

**Success Response:**
```json
{
  "success": true,
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 3,
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces",
        "source": "ai-full",
        "generation_id": 123,
        "created_at": "2025-10-10T10:10:00Z",
        "updated_at": "2025-10-10T10:10:00Z"
      },
      {
        "id": 4,
        "front": "What is JSX?",
        "back": "A syntax extension for JavaScript that looks similar to XML/HTML",
        "source": "ai-edited",
        "generation_id": 123,
        "created_at": "2025-10-10T10:10:00Z",
        "updated_at": "2025-10-10T10:10:00Z"
      }
    ]
  }
}
```
**HTTP Status**: 201 Created

**Business Logic:**
- Updates the `generations` table with `accepted_unedited_count` and `accepted_edited_count`
- Validates that the sum doesn't exceed `generated_count`

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 400 Bad Request: Validation errors or invalid generation_id
- 500 Internal Server Error: Database error

---

#### PATCH /api/flashcards/:id

Updates an existing flashcard.

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- URL Parameters: `id` (flashcard ID)
- Body:
```json
{
  "front": "What is React (updated)?",
  "back": "A JavaScript library for building user interfaces (updated)"
}
```

**Validation Rules:**
- At least one field must be provided
- `front`: Optional, string, max 200 characters
- `back`: Optional, string, max 500 characters

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "front": "What is React (updated)?",
    "back": "A JavaScript library for building user interfaces (updated)",
    "source": "ai-edited",
    "generation_id": 123,
    "created_at": "2025-10-10T10:00:00Z",
    "updated_at": "2025-10-10T10:15:00Z"
  }
}
```
**HTTP Status**: 200 OK

**Business Logic:**
- If the flashcard source was 'ai-full' and content is modified, change source to 'ai-edited'
- If source was 'manual', it remains 'manual'
- Automatically updates `updated_at` timestamp via database trigger

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 404 Not Found: Flashcard not found or doesn't belong to user
- 400 Bad Request: Validation errors or no fields provided
- 500 Internal Server Error: Database error

---

#### DELETE /api/flashcards/:id

Permanently deletes a flashcard.

**Request:**
- Headers: `Authorization: Bearer <token>`
- URL Parameters: `id` (flashcard ID)

**Success Response:**
```json
{
  "success": true,
  "message": "Flashcard deleted successfully"
}
```
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 404 Not Found: Flashcard not found or doesn't belong to user
- 400 Bad Request: Invalid flashcard ID format
- 500 Internal Server Error: Database error

---

### 2.3 Generations

#### POST /api/generations

Generates flashcard suggestions from provided text using AI.

**Request:**
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body:
```json
{
  "source_text": "React is a JavaScript library for building user interfaces. It was developed by Facebook and is now maintained by Meta and a community of individual developers. React allows developers to create reusable UI components...",
}
```

**Validation Rules:**
- `source_text`: Required, string, min 1000 characters, max 10000 characters

**Success Response:**
```json
{
  "success": true,
  "data": {
    "generation_id": 123,
    "model": "openai/gpt-4",
    "duration_ms": 3500,
    "generated_count": 5,
    "flashcards_proposals": [
      {
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces"
      },
      {
        "front": "Who developed React?",
        "back": "React was developed by Facebook and is now maintained by Meta"
      },
      {
        "front": "What is a key feature of React?",
        "back": "React allows developers to create reusable UI components"
      }
    ]
  }
}
```
**HTTP Status**: 201 Created

**Business Logic:**
- Validate that `source_text` length is between 1000 and 10000 characters
- Call the AI service to generate flashcards proposals
- Store the generation metadata and return flashcards proposals to the user
- Calculates SHA-256 hash of source_text for deduplication tracking
- Stores generation metadata in `generations` table
- Communicates with Openrouter.ai API
- If AI API call fails, logs error to `generation_error_logs` table
- Initial values: `accepted_unedited_count = 0`, `accepted_edited_count = 0`

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 400 Bad Request: Validation errors
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
- 429 Too Many Requests: Rate limit exceeded
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
- 503 Service Unavailable: AI API error
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
- 500 Internal Server Error: Database or server error

---

#### GET /api/generations

Retrieves generation history for the authenticated user.

**Request:**
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `page` (optional, default: 1): Page number
  - `limit` (optional, default: 20, max: 50): Items per page
  - `sort` (optional, default: 'generation_time'): Sort field
  - `order` (optional, default: 'desc'): Sort order

**Success Response:**
```json
{
  "success": true,
  "data": {
    "generations": [
      {
        "id": 123,
        "generation_time": "2025-10-10T10:00:00Z",
        "duration_ms": 3500,
        "model": "openai/gpt-4",
        "generated_count": 5,
        "accepted_unedited_count": 3,
        "accepted_edited_count": 1,
        "source_text_length": 2500
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  }
}
```
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 400 Bad Request: Invalid query parameters

---

#### GET /api/generations/:id

Retrieves details of a specific generation, including the flashcards proposals created from it.

**Request:**
- Headers: `Authorization: Bearer <token>`
- URL Parameters: `id` (generation ID)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "generation_time": "2025-10-10T10:00:00Z",
    "duration_ms": 3500,
    "model": "openai/gpt-4",
    "generated_count": 5,
    "accepted_unedited_count": 3,
    "accepted_edited_count": 1,
    "source_text_length": 2500,
    "flashcards_proposals": [
      {
        "id": 1,
        "front": "What is React?",
        "back": "A JavaScript library for building user interfaces",
        "source": "ai-full"
      }
    ]
  }
}
```
**HTTP Status**: 200 OK

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 404 Not Found: Generation not found or doesn't belong to user

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Supabase Auth** is used for authentication, providing:
- JWT-based session tokens
- Secure password hashing
- Email verification
- Password reset functionality

**Implementation Details:**

1. **Client-side**: 
   - Use Supabase JavaScript SDK for authentication operations
   - Store session tokens in HTTP-only cookies or localStorage
   - Include token in `Authorization: Bearer <token>` header for all API requests

2. **Server-side**:
   - Astro middleware validates JWT tokens using Supabase client
   - Extracts `user_id` from validated token
   - Injects user context into request for use in API routes

### 3.2 Authorization

**Row-Level Security (RLS)** in PostgreSQL ensures data isolation:

1. **Supabase RLS Policies**:
   - All tables have RLS enabled
   - Policies ensure `auth.uid()` matches `user_id` column
   - Database automatically filters queries to user's own data

2. **Middleware Authorization**:
   ```typescript
   // Simplified middleware flow
   export async function onRequest({ request, locals }, next) {
     const token = request.headers.get('Authorization')?.replace('Bearer ', '');
     const { data: { user }, error } = await supabase.auth.getUser(token);
     
     if (error || !user) {
       return new Response(JSON.stringify({ 
         success: false, 
         error: { code: 'UNAUTHORIZED', message: 'Invalid or missing authentication token' }
       }), { status: 401 });
     }
     
     locals.user = user;
     return next();
   }
   ```

3. **API Route Protection**:
   - All `/api/*` routes (except health checks) require authentication
   - User ID from session is used for all database queries
   - No user can access another user's resources

### 3.3 GDPR Compliance

- **Right to Access**: Users can retrieve all their data via GET endpoints
- **Right to Deletion**: `DELETE /api/user/account` removes all user data
- **Data Minimization**: Only necessary data is collected
- **Cascade Deletion**: `ON DELETE CASCADE` ensures complete data removal

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Flashcards
- **front**: 
  - Required for creation
  - String type
  - Maximum 200 characters
  - Cannot be empty or only whitespace
  
- **back**: 
  - Required for creation
  - String type
  - Maximum 500 characters
  - Cannot be empty or only whitespace
  
- **source**: 
  - Required for creation
  - Must be one of: 'manual', 'ai-full', 'ai-edited'
  - Set automatically based on creation context:
    - 'manual': User creates via POST /api/flashcards
    - 'ai-full': Accepted from AI without edits
    - 'ai-edited': Accepted from AI with modifications

#### Generations
- **source_text**: 
  - Required
  - String type
  - Minimum 1000 characters
  - Maximum 10000 characters
  - Enforced to balance quality of AI generation with token costs
  
- **generated_count**: 
  - Automatically set by system
  - Non-negative integer
  - Represents number of flashcards suggested by AI
  
- **accepted_unedited_count**: 
  - Automatically calculated
  - Non-negative integer
  - Must not exceed generated_count
  
- **accepted_edited_count**: 
  - Automatically calculated
  - Non-negative integer
  - Must not exceed generated_count

### 4.2 Business Logic Implementation

#### 1. AI Flashcard Generation Flow
```
1. User submits source text (POST /api/generations)
2. System validates text length (1000-10000 chars)
3. System calculates SHA-256 hash of source text
4. System calls Openrouter AI API with source text
5. If API call fails:
   - Log error to generation_error_logs table
   - Return 503 error to user
6. If API call succeeds:
   - Parse AI response into flashcard suggestions
   - Store generation metadata in generations table
   - Return suggestions to user (not saved as flashcards yet)
7. User reviews suggestions and selects which to keep
8. User submits approved flashcards (POST /api/flashcards/bulk)
9. System updates generation record with acceptance counts
```

#### 2. Flashcard Source Tracking
```
Manual Creation:
- User creates via POST /api/flashcards
- source = 'manual'
- generation_id = NULL

AI Creation (Unedited):
- User accepts AI suggestion without changes via POST /api/flashcards/bulk
- source = 'ai-full'
- generation_id = <generation_id>

AI Creation (Edited):
- User accepts AI suggestion with changes via POST /api/flashcards/bulk
- source = 'ai-edited'
- generation_id = <generation_id>

AI Flashcard Later Edited:
- User updates existing flashcard with source 'ai-full' via PATCH /api/flashcards/:id
- source changes to 'ai-edited'
- generation_id remains unchanged
```

#### 3. Generation Statistics Tracking
```
When flashcards are saved via POST /api/flashcards/bulk:
1. Count flashcards where source = 'ai-full' → accepted_unedited_count
2. Count flashcards where source = 'ai-edited' → accepted_edited_count
3. Update generations table with these counts
4. Provided by count of AI-suggested flashcards generated_count
```

#### 4. User Data Deletion (GDPR)
```
When DELETE /api/user/account is called:
1. Validate user authentication
2. Delete user record from auth.users
3. PostgreSQL CASCADE automatically deletes:
   - All flashcards (via FK constraint)
   - All generations (via FK constraint)
   - All generation_error_logs (via FK constraint)
4. Supabase Auth removes authentication data
5. Return success response
```

### 4.3 Error Handling

All error responses follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional context
  }
}
```

**Standard Error Codes:**
- `UNAUTHORIZED`: Missing or invalid authentication token (401)
- `FORBIDDEN`: User doesn't have permission for this resource (403)
- `NOT_FOUND`: Resource not found (404)
- `VALIDATION_ERROR`: Input validation failed (400)
- `RATE_LIMIT_EXCEEDED`: Too many requests (429)
- `AI_SERVICE_ERROR`: AI API unavailable or error (503)
- `INTERNAL_ERROR`: Unexpected server error (500)

### 4.4 Rate Limiting

**AI Generation Endpoint** (`POST /api/generations`):
- Limit: 10 requests per user per day (configurable)
- Purpose: Control costs and prevent abuse
- Response when exceeded: 429 Too Many Requests with retry_after timestamp

**Other Endpoints**:
- Global rate limit: 100 requests per user per minute
- Purpose: Prevent abuse and ensure fair resource distribution

### 4.5 Pagination

List endpoints support pagination with consistent parameters:
- `page`: Page number (1-indexed)
- `limit`: Items per page
- Responses include pagination metadata:
  ```json
  {
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "total_pages": 3
    }
  }
  ```

---

## 5. Additional Notes

### 5.1 Schema Limitations for MVP

The current database schema supports core functionality but lacks some features for a complete spaced repetition system:

**Missing for Full Spaced Repetition:**
- Flashcard review history table
- Spaced repetition metadata (next_review_date, interval, ease_factor)
- Study session tracking table

**Recommendation**: For MVP, implement basic study session functionality. Plan schema migration for full spaced repetition in next iteration.

### 5.2 Future API Enhancements

**Post-MVP Considerations:**
1. **Flashcard Search**: Add search endpoint with full-text search
2. **Bulk Operations**: Add bulk update/delete endpoints
3. **Export/Import**: Endpoints to export flashcards to formats like Anki, CSV
4. **Statistics Dashboard**: Aggregate endpoints for user progress metrics
5. **Collaboration**: Share flashcard sets between users (requires schema changes)
6. **Tagging System**: Add tags/categories to flashcards for organization

### 5.3 Performance Optimizations

1. **Database Indexes**: Already defined in schema for all foreign keys
2. **Caching**: Consider Redis for frequently accessed data (user flashcard counts, etc.)
3. **Query Optimization**: Use database connection pooling via Supabase
4. **API Response Size**: Implement field selection (`?fields=id,front,back`) for large collections

### 5.4 Monitoring and Logging

**Recommended Metrics to Track:**
1. AI generation success/failure rates (use generation_error_logs table)
2. API endpoint response times
3. Rate limit hits per user
4. Flashcard acceptance rates (generated_count vs accepted counts)
5. User engagement (study sessions per user, flashcards reviewed)

**Logging Strategy:**
- API errors: Log to application logs with request context
- AI API errors: Automatically logged to generation_error_logs table
- Authentication failures: Log for security monitoring
- Performance issues: Log slow queries (> 1 second)

