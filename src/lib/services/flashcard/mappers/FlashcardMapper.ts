/**
 * Flashcard Mapper
 * Handles transformations between entities and DTOs
 */

import type { FlashcardEntity, FlashcardDTO } from "@/types";

/**
 * Transform FlashcardEntity to FlashcardDTO
 * Removes user_id from the response for security
 * @param entity - Flashcard entity from database
 * @returns Flashcard DTO without sensitive fields
 */
export function entityToDTO(entity: FlashcardEntity): FlashcardDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...dto } = entity;
  return dto;
}

/**
 * Transform array of FlashcardEntities to FlashcardDTOs
 * @param entities - Array of flashcard entities from database
 * @returns Array of flashcard DTOs
 */
export function entitiesToDTOs(entities: FlashcardEntity[]): FlashcardDTO[] {
  return entities.map(entityToDTO);
}
