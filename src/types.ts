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

// ============================================================================
// Frontend View Models
// ============================================================================

/**
 * Flashcard proposal view model for the Generator UI
 * Extends FlashcardProposalDTO with client-side state management
 */
export interface FlashcardProposalViewModel extends Omit<FlashcardProposalDTO, "source"> {
  /** Unique client-side identifier (e.g., UUID) */
  id: string;
  /** Proposal status: pending, approved, or rejected */
  status: "pending" | "approved" | "rejected";
  /** Source of the flashcard, updated after editing */
  source: "ai-full" | "ai-edited";
}

/**
 * View Model for flashcard list view
 * Represents the complete state of the list view with flashcards, pagination, and controls
 */
export interface FlashcardListViewModel {
  /** List of flashcards to display */
  flashcards: FlashcardDTO[];
  /** Pagination metadata */
  pagination: PaginationDTO;
  /** Current query parameters (filters, sorting, page) */
  queryParams: GetFlashcardsQueryDTO;
  /** Data loading state */
  isLoading: boolean;
  /** Error message (if any) */
  error: string | null;
  /** Flashcard pending deletion (for confirmation dialog) */
  flashcardToDelete: FlashcardDTO | null;
}

/**
 * View Model for flashcard form (create/edit)
 * Represents the form state with data, errors, and operation status
 */
export interface FlashcardFormViewModel {
  /** Form mode */
  mode: "create" | "edit";
  /** Flashcard data (populated in edit mode, empty in create mode) */
  flashcard: {
    front: string;
    back: string;
  };
  /** Save operation loading state */
  isLoading: boolean;
  /** General error (e.g., network error) */
  error: string | null;
  /** Validation errors for specific fields */
  validationErrors: {
    front?: string;
    back?: string;
  };
  /** Whether the form is valid (can be saved) */
  isValid: boolean;
}

/**
 * Type for flashcard-related actions
 * Used by useFlashcardMutations hook
 */
export interface FlashcardMutations {
  createFlashcard: (data: CreateFlashcardCommand) => Promise<FlashcardDTO>;
  updateFlashcard: (id: number, data: UpdateFlashcardCommand) => Promise<FlashcardDTO>;
  deleteFlashcard: (id: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Type for date formatting function
 */
export type DateFormatter = (date: string) => string;

/**
 * Labels for flashcard sources (for UI display)
 */
export const FLASHCARD_SOURCE_LABELS: Record<FlashcardSource, string> = {
  manual: "Ręczna",
  "ai-full": "AI",
  "ai-edited": "AI (edytowana)",
};

/**
 * Options for source filter
 */
export interface SourceFilterOption {
  value: FlashcardSource | "all";
  label: string;
}

export const SOURCE_FILTER_OPTIONS: SourceFilterOption[] = [
  { value: "all", label: "Wszystkie" },
  { value: "manual", label: "Ręczne" },
  { value: "ai-full", label: "AI" },
  { value: "ai-edited", label: "AI (edytowane)" },
];

/**
 * Options for sorting
 */
export interface SortOption {
  field: "created_at" | "updated_at";
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { field: "created_at", label: "Data utworzenia" },
  { field: "updated_at", label: "Data modyfikacji" },
];

// ============================================================================
// User Account Types
// ============================================================================

/**
 * User account DTO - podstawowe informacje o koncie użytkownika
 * Używane w widoku konta
 */
export interface UserAccountDTO {
  id: string; // UUID użytkownika z Supabase Auth
  email: string;
  created_at: string; // ISO 8601
}

/**
 * Response dla DELETE /api/user/account
 */
export interface DeleteAccountResponseDTO {
  success: true;
  message: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for AppLayout (Astro)
 */
export interface AppLayoutProps {
  title?: string;
}

/**
 * Props for Sidebar (React)
 */
export interface SidebarProps {
  currentPath: string;
  userEmail?: string;
}

/**
 * Props for SidebarNav (React)
 */
export interface SidebarNavProps {
  currentPath: string;
}

/**
 * Navigation item definition
 */
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

/**
 * Props for SidebarNavItem (React)
 */
export interface SidebarNavItemProps {
  label: string;
  href: string;
  icon?: React.ReactNode;
  isActive: boolean;
}

/**
 * Props for AccountView (React)
 */
export interface AccountViewProps {
  user: UserAccountDTO;
}

/**
 * Props for AccountInfo (React)
 */
export interface AccountInfoProps {
  user: UserAccountDTO;
}

/**
 * Props for DeleteAccountDialog (React)
 */
export interface DeleteAccountDialogProps {
  onDeleteSuccess: () => void;
}

/**
 * Hook return type for useAccount
 */
export interface UseAccountReturn {
  user: UserAccountDTO | null;
  isLoading: boolean;
  error: string | null;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
}

// ============================================================================
// Auth Form Types
// ============================================================================

/**
 * Dane formularza logowania
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Dane formularza rejestracji
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Błędy walidacji formularza logowania
 */
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

/**
 * Błędy walidacji formularza rejestracji
 */
export interface RegisterFormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

/**
 * Dane formularza żądania resetu hasła
 */
export interface ResetPasswordFormData {
  email: string;
}

/**
 * Błędy walidacji formularza żądania resetu hasła
 */
export interface ResetPasswordFormErrors {
  email?: string;
}

/**
 * Dane formularza aktualizacji hasła
 */
export interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Błędy walidacji formularza aktualizacji hasła
 */
export interface UpdatePasswordFormErrors {
  password?: string;
  confirmPassword?: string;
}

// ============================================================================
// Study Session Types
// ============================================================================

/**
 * Query parameters for GET /api/study/session
 */
export interface GetStudySessionQuery {
  limit?: number; // Default: 20, min: 1, max: 50
  source?: FlashcardSource; // Filter by source (optional)
  shuffle?: boolean; // Default: true
}

/**
 * Response for GET /api/study/session
 */
export interface GetStudySessionResponse {
  session_id: string; // UUID v4 generated on server
  flashcards: FlashcardDTO[]; // Array of flashcards for study
  total_count: number; // Number of flashcards in this session
  user_total_flashcards: number; // Total flashcards user owns
}

/**
 * Client-side study session state
 */
export interface StudySessionState {
  flashcards: FlashcardDTO[];
  currentCardIndex: number;
  isFlipped: boolean;
  reviewResults: {
    flashcard_id: number;
    known: boolean;
  }[];
  sessionStats: {
    total: number;
    reviewed: number;
    known: number;
    unknown: number;
  };
}

// ============================================================================
// Auth API Types
// ============================================================================

/**
 * Request body for user registration
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * Request body for user login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Auth user data returned in API responses
 */
export interface AuthUserDTO {
  id: string; // UUID
  email: string;
}

/**
 * Response for successful registration
 */
export interface RegisterResponseDTO {
  user: AuthUserDTO;
  message: string;
}

/**
 * Response for successful login
 */
export interface LoginResponseDTO {
  user: AuthUserDTO;
}

/**
 * Response for GET /api/auth/me
 */
export interface GetCurrentUserResponseDTO {
  user: AuthUserDTO;
}

/**
 * Response for logout
 */
export interface LogoutResponseDTO {
  success: true;
  message: string;
}

/**
 * Request body for password reset request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Response for successful password reset request
 */
export interface ResetPasswordResponseDTO {
  message: string;
}

/**
 * Request body for updating password
 */
export interface UpdatePasswordRequest {
  password: string;
}

/**
 * Response for successful password update
 */
export interface UpdatePasswordResponseDTO {
  message: string;
}
