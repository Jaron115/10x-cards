/**
 * Flashcard API client
 * Provides type-safe methods for flashcard CRUD operations
 * Uses generic callApi for consistent error handling and toast notifications
 */

import { callApi } from "./apiClient";
import type { FlashcardDTO, CreateFlashcardCommand, UpdateFlashcardCommand, ApiResponseDTO } from "@/types";

/**
 * Get a single flashcard by ID
 * On error: shows error toast
 */
export async function getFlashcard(id: number) {
  return callApi<never, ApiResponseDTO<FlashcardDTO>>({
    endpoint: `/api/flashcards/${id}`,
    method: "GET",
  });
}

/**
 * Create a new flashcard
 * On success: shows success toast and redirects to /app/flashcards
 * On error: shows error toast (validation errors shown inline)
 */
export async function createFlashcard(data: CreateFlashcardCommand) {
  return callApi<CreateFlashcardCommand, ApiResponseDTO<FlashcardDTO>>({
    endpoint: "/api/flashcards",
    method: "POST",
    body: data,
    successMessage: "Fiszka została utworzona",
  });
}

/**
 * Update an existing flashcard
 * On success: shows success toast and redirects to /app/flashcards
 * On error: shows error toast (validation errors shown inline)
 */
export async function updateFlashcard(id: number, data: UpdateFlashcardCommand) {
  return callApi<UpdateFlashcardCommand, ApiResponseDTO<FlashcardDTO>>({
    endpoint: `/api/flashcards/${id}`,
    method: "PATCH",
    body: data,
    successMessage: "Fiszka została zaktualizowana",
  });
}

/**
 * Delete a flashcard
 * On success: shows success toast
 * On error: shows error toast
 */
export async function deleteFlashcard(id: number) {
  return callApi({
    endpoint: `/api/flashcards/${id}`,
    method: "DELETE",
    successMessage: "Fiszka została usunięta",
  });
}
