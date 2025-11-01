/**
 * Source Transition Strategy
 * Handles state transitions for flashcard sources based on content changes
 *
 * Transition rules:
 * - "ai-full" → "ai-edited" when content changes
 * - "manual" → stays "manual" (no transition)
 * - "ai-edited" → stays "ai-edited" (no transition)
 */

import type { FlashcardEntity } from "@/types";
import type { ValidatedUpdateFlashcardCommand } from "@/lib/validation/flashcard.schemas";

/**
 * Result of source transition evaluation
 */
export interface SourceTransitionResult {
  shouldTransition: boolean;
  newSource?: "ai-edited";
  reason?: string;
}

/**
 * Evaluate if flashcard source should transition based on update
 *
 * @param existing - Current flashcard entity
 * @param command - Update command with new values
 * @returns Transition result indicating if source should change
 */
export function evaluateSourceTransition(
  existing: FlashcardEntity,
  command: ValidatedUpdateFlashcardCommand
): SourceTransitionResult {
  // Only ai-full can transition to ai-edited
  if (existing.source !== "ai-full") {
    return {
      shouldTransition: false,
      reason: `Source "${existing.source}" does not support transitions`,
    };
  }

  // Check if content has changed
  const contentChanged = hasContentChanged(existing, command);

  if (!contentChanged) {
    return {
      shouldTransition: false,
      reason: "Content has not changed",
    };
  }

  // Transition ai-full → ai-edited
  return {
    shouldTransition: true,
    newSource: "ai-edited",
    reason: "AI-generated content was edited by user",
  };
}

/**
 * Check if flashcard content has changed
 *
 * @param existing - Current flashcard entity
 * @param command - Update command with new values
 * @returns true if front or back content has changed
 */
function hasContentChanged(existing: FlashcardEntity, command: ValidatedUpdateFlashcardCommand): boolean {
  const frontChanged = command.front !== undefined && command.front !== existing.front;
  const backChanged = command.back !== undefined && command.back !== existing.back;

  return frontChanged || backChanged;
}

/**
 * Get the new source after applying transition
 * Convenience function for direct use in update operations
 *
 * @param existing - Current flashcard entity
 * @param command - Update command with new values
 * @returns New source value or undefined if no transition
 */
export function getTransitionedSource(
  existing: FlashcardEntity,
  command: ValidatedUpdateFlashcardCommand
): "ai-edited" | undefined {
  const result = evaluateSourceTransition(existing, command);
  return result.shouldTransition ? result.newSource : undefined;
}
