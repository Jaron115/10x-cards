/**
 * Generation Capacity Validator
 * Validates if flashcards can be added to a generation based on capacity limits
 */

import { ValidationError } from "@/lib/errors";
import type { GenerationEntity } from "@/types";

/**
 * Validation result with current state information
 */
export interface CapacityValidationResult {
  isValid: boolean;
  currentAccepted: number;
  availableSlots: number;
  requestedCount: number;
  generatedCount: number;
}

/**
 * Validate if flashcards can be added to a generation
 * Checks if total accepted count would exceed generated_count
 *
 * @param generation - Generation entity to validate against
 * @param requestedCount - Number of flashcards trying to add
 * @returns Validation result with capacity information
 */
export function validateGenerationCapacity(
  generation: GenerationEntity,
  requestedCount: number
): CapacityValidationResult {
  const currentAccepted = generation.accepted_unedited_count + generation.accepted_edited_count;
  const totalAfterBulk = currentAccepted + requestedCount;
  const availableSlots = generation.generated_count - currentAccepted;

  return {
    isValid: totalAfterBulk <= generation.generated_count,
    currentAccepted,
    availableSlots,
    requestedCount,
    generatedCount: generation.generated_count,
  };
}

/**
 * Validate and throw error if capacity exceeded
 * Convenience function for common use case
 *
 * @param generation - Generation entity to validate against
 * @param requestedCount - Number of flashcards trying to add
 * @throws ValidationError if capacity would be exceeded
 */
export function validateAndThrowIfCapacityExceeded(generation: GenerationEntity, requestedCount: number): void {
  const result = validateGenerationCapacity(generation, requestedCount);

  if (!result.isValid) {
    throw new ValidationError(
      `Cannot accept more flashcards than generated. Generated: ${result.generatedCount}, Already accepted: ${result.currentAccepted}, Trying to add: ${result.requestedCount}`,
      {
        generated_count: result.generatedCount,
        current_accepted_count: result.currentAccepted,
        requested_count: result.requestedCount,
        available_slots: result.availableSlots,
      }
    );
  }
}
