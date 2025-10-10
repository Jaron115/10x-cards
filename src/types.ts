import type { Database, Tables, TablesInsert, TablesUpdate } from "./db/database.types";

// ============================================================================
// Database Entity Types (Re-exports for convenience)
// ============================================================================

/**
 * Flashcard entity from database (Row type)
 */
export type FlashcardEntity = Tables<"flashcards">;

/**
 * Generation entity from database (Row type)
 */
export type GenerationEntity = Tables<"generations">;

/**
 * Generation error log entity from database (Row type)
 */
export type GenerationErrorLogEntity = Tables<"generation_error_logs">;

/**
 * Flashcard source enum type
 */
export type FlashcardSource = Database["public"]["Enums"]["flashcard_source"];

// ============================================================================
// Flashcard DTOs
// ============================================================================

/**
 * Flashcard DTO - representation of a flashcard in API responses
 * Derived from FlashcardEntity, excluding user_id for security
 */
export type FlashcardDTO = Omit<FlashcardEntity, "user_id">;

/**
 * Command to create a single manual flashcard
 * Used in: POST /api/flashcards
 */
export interface CreateFlashcardCommand {
  front: string; // Max 200 characters
  back: string; // Max 500 characters
}

/**
 * Single flashcard item for bulk creation
 * Used within CreateFlashcardsBulkCommand
 */
export interface FlashcardBulkItemDTO {
  front: string; // Max 200 characters
  back: string; // Max 500 characters
  source: "ai-full" | "ai-edited"; // Cannot be 'manual' in bulk operations
}

/**
 * Command to create multiple flashcards at once (after AI generation)
 * Used in: POST /api/flashcards/bulk
 */
export interface CreateFlashcardsBulkCommand {
  generation_id: number;
  flashcards: FlashcardBulkItemDTO[]; // Min 1, max 50 items
}

/**
 * Command to update an existing flashcard
 * Used in: PATCH /api/flashcards/:id
 * At least one field must be provided
 */
export interface UpdateFlashcardCommand {
  front?: string; // Optional, max 200 characters
  back?: string; // Optional, max 500 characters
  source?: "ai-edited" | "manual"; // Optional, default is "ai-edited"
}

// ============================================================================
// Generation DTOs
// ============================================================================

/**
 * Generation DTO - representation of a generation session in API responses
 * Derived from GenerationEntity, excluding user_id for security
 */
export type GenerationDTO = Omit<GenerationEntity, "user_id" | "source_text_hash">;

/**
 * Flashcard proposal from AI (not yet saved to database)
 * Used in generation responses before user approval
 */
export interface FlashcardProposalDTO {
  front: string;
  back: string;
  source: "ai-full";
}

/**
 * Command to generate flashcard suggestions from text using AI
 * Used in: POST /api/generations
 */
export interface GenerateFlashcardsCommand {
  source_text: string; // Min 1000, max 10000 characters
}

// ============================================================================
// API Response Wrappers
// ============================================================================

/**
 * Generic successful API response wrapper
 */
export interface ApiResponseDTO<T> {
  success: true;
  data: T;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Response for GET /api/flashcards
 */
export interface GetFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationDTO;
}

/**
 * Response for POST /api/flashcards/bulk
 */
export interface CreateFlashcardsBulkResponseDTO {
  created_count: number;
  flashcards: FlashcardDTO[];
}

/**
 * Response for POST /api/generations
 */
export interface GenerateFlashcardsResponseDTO {
  generation_id: number;
  model: string | null;
  duration_ms: number;
  generated_count: number;
  flashcards_proposals: FlashcardProposalDTO[];
}

/**
 * Response for GET /api/generations
 */
export interface GetGenerationsResponseDTO {
  generations: GenerationDTO[];
  pagination: PaginationDTO;
}

/**
 * Response for GET /api/generations/:id (includes associated flashcards)
 */
export interface GetGenerationResponseDTO extends GenerationDTO {
  flashcards_proposals: (FlashcardDTO & { source: "ai-full" })[];
}

/**
 * Response for DELETE operations (flashcards, account)
 */
export interface DeleteResourceResponseDTO {
  success: true;
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Validation error detail for a specific field
 */
export interface ValidationErrorDetailDTO {
  field: string;
  message: string;
}

/**
 * API error structure
 */
export interface ApiErrorDTO {
  success: false;
  error: {
    code:
      | "UNAUTHORIZED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "RATE_LIMIT_EXCEEDED"
      | "AI_SERVICE_ERROR"
      | "INTERNAL_ERROR";
    message: string;
    details?: unknown; // Can be ValidationErrorDetailDTO[], object, or string
  };
}

/**
 * Rate limit error with retry information
 */
export interface RateLimitErrorDTO extends Omit<ApiErrorDTO, "error"> {
  error: {
    code: "RATE_LIMIT_EXCEEDED";
    message: string;
    retry_after: string; // ISO 8601 timestamp
  };
}

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Query parameters for GET /api/flashcards
 */
export interface GetFlashcardsQueryDTO {
  page?: number; // Default: 1
  limit?: number; // Default: 50, max: 100
  source?: FlashcardSource; // Filter by source
  sort?: "created_at" | "updated_at"; // Default: 'created_at'
  order?: "asc" | "desc"; // Default: 'desc'
}

/**
 * Query parameters for GET /api/generations
 */
export interface GetGenerationsQueryDTO {
  page?: number; // Default: 1
  limit?: number; // Default: 20, max: 50
  sort?: "generation_time"; // Default: 'generation_time'
  order?: "asc" | "desc"; // Default: 'desc'
}

// ============================================================================
// Internal Database Insert/Update Types (for service layer)
// ============================================================================

/**
 * Type for inserting a new flashcard into the database
 * Derived from database Insert type
 */
export type InsertFlashcardData = TablesInsert<"flashcards">;

/**
 * Type for updating an existing flashcard in the database
 * Derived from database Update type
 */
export type UpdateFlashcardData = TablesUpdate<"flashcards">;

/**
 * Type for inserting a new generation into the database
 * Derived from database Insert type
 */
export type InsertGenerationData = TablesInsert<"generations">;

/**
 * Type for updating an existing generation in the database
 * Derived from database Update type
 */
export type UpdateGenerationData = TablesUpdate<"generations">;

/**
 * Type for inserting a generation error log into the database
 * Derived from database Insert type
 */
export type InsertGenerationErrorLogData = TablesInsert<"generation_error_logs">;
