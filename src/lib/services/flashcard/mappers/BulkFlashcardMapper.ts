/**
 * Bulk Flashcard Mapper
 * Handles transformations for bulk flashcard operations
 */

import type { InsertFlashcardData } from "@/types";
import type { ValidatedFlashcardBulkItem } from "@/lib/validation/flashcard.schemas";

/**
 * Transform bulk flashcard items to insert data for database
 * @param userId - User ID who owns the flashcards
 * @param generationId - Generation ID to associate with flashcards
 * @param flashcards - Validated flashcard items to transform
 * @returns Array of insert data ready for database
 */
export function mapBulkItemsToInsertData(
  userId: string,
  generationId: number,
  flashcards: ValidatedFlashcardBulkItem[]
): InsertFlashcardData[] {
  return flashcards.map((flashcard) => ({
    user_id: userId,
    front: flashcard.front,
    back: flashcard.back,
    source: flashcard.source,
    generation_id: generationId,
  }));
}
