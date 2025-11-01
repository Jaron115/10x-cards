/**
 * Flashcard Counter Utilities
 * Helper functions for counting flashcards by various criteria
 */

import type { ValidatedFlashcardBulkItem } from "@/lib/validation/flashcard.schemas";

/**
 * Count result with breakdown by source (bulk items only support AI sources)
 */
export interface FlashcardCountBySource {
  aiFull: number;
  aiEdited: number;
  total: number;
}

/**
 * Count flashcards by source type
 * @param flashcards - Array of flashcard items to count
 * @returns Count breakdown by source type
 */
export function countFlashcardsBySource(flashcards: ValidatedFlashcardBulkItem[]): FlashcardCountBySource {
  const aiFull = flashcards.filter((f) => f.source === "ai-full").length;
  const aiEdited = flashcards.filter((f) => f.source === "ai-edited").length;

  return {
    aiFull,
    aiEdited,
    total: flashcards.length,
  };
}

/**
 * Calculate updated generation counts after bulk creation
 * @param currentUneditedCount - Current accepted_unedited_count
 * @param currentEditedCount - Current accepted_edited_count
 * @param newAiFullCount - Number of new ai-full flashcards
 * @param newAiEditedCount - Number of new ai-edited flashcards
 * @returns Updated counts for generation
 */
export function calculateUpdatedGenerationCounts(
  currentUneditedCount: number,
  currentEditedCount: number,
  newAiFullCount: number,
  newAiEditedCount: number
): { updatedUneditedCount: number; updatedEditedCount: number } {
  return {
    updatedUneditedCount: currentUneditedCount + newAiFullCount,
    updatedEditedCount: currentEditedCount + newAiEditedCount,
  };
}
