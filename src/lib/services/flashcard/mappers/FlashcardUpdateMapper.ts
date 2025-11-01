/**
 * Flashcard Update Mapper
 * Handles mapping update commands to database update data
 */

import type { UpdateFlashcardData, FlashcardEntity } from "@/types";
import type { ValidatedUpdateFlashcardCommand } from "@/lib/validation/flashcard.schemas";
import { getTransitionedSource } from "../strategies/SourceTransitionStrategy";

/**
 * Map update command to database update data
 * Includes content updates and automatic source transitions
 *
 * @param existing - Current flashcard entity
 * @param command - Validated update command
 * @returns Update data ready for database
 */
export function mapUpdateCommandToUpdateData(
  existing: FlashcardEntity,
  command: ValidatedUpdateFlashcardCommand
): UpdateFlashcardData {
  const updateData: UpdateFlashcardData = {};

  // Map content changes
  if (command.front !== undefined) {
    updateData.front = command.front;
  }

  if (command.back !== undefined) {
    updateData.back = command.back;
  }

  // Apply source transition logic
  const newSource = getTransitionedSource(existing, command);
  if (newSource) {
    updateData.source = newSource;
  }

  return updateData;
}
