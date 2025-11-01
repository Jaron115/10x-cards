/**
 * Bulk Flashcard Orchestrator
 * Orchestrates the complex process of creating multiple flashcards from AI generation
 * Implements Orchestrator Pattern to coordinate multiple operations
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateFlashcardsBulkResponseDTO, FlashcardEntity, GenerationEntity } from "@/types";
import type { ValidatedFlashcardBulkItem } from "@/lib/validation/flashcard.schemas";
import { NotFoundError } from "@/lib/errors";
import { validateAndThrowIfCapacityExceeded } from "../validators/GenerationCapacityValidator";
import { countFlashcardsBySource, calculateUpdatedGenerationCounts } from "../utils/FlashcardCounter";
import { mapBulkItemsToInsertData } from "../mappers/BulkFlashcardMapper";
import { entitiesToDTOs } from "../mappers/FlashcardMapper";

/**
 * Orchestrates bulk flashcard creation process
 * Coordinates validation, insertion, and generation updates
 */
export class BulkFlashcardOrchestrator {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Execute bulk flashcard creation
   * @param userId - User ID who creates the flashcards
   * @param generationId - ID of the generation session
   * @param flashcards - Array of flashcard data to create
   * @returns Promise that resolves to bulk creation response
   * @throws NotFoundError if generation not found or doesn't belong to user
   * @throws ValidationError if validation fails (e.g., exceeds generated_count)
   * @throws Error if database operation fails
   */
  async execute(
    userId: string,
    generationId: number,
    flashcards: ValidatedFlashcardBulkItem[]
  ): Promise<CreateFlashcardsBulkResponseDTO> {
    // Step 1: Verify generation exists and belongs to user
    const generation = await this.verifyGeneration(generationId, userId);

    // Step 2: Validate capacity (throws if exceeded)
    validateAndThrowIfCapacityExceeded(generation, flashcards.length);

    // Step 3: Count flashcards by source for generation update
    const counts = countFlashcardsBySource(flashcards);

    // Step 4: Insert flashcards
    const createdEntities = await this.insertFlashcards(userId, generationId, flashcards);

    // Step 5: Update generation counts
    await this.updateGenerationCounts(generationId, generation, counts.aiFull, counts.aiEdited);

    // Step 6: Transform and return response
    return {
      created_count: createdEntities.length,
      flashcards: entitiesToDTOs(createdEntities),
    };
  }

  /**
   * Verify generation exists and belongs to user
   * @param generationId - Generation ID to verify
   * @param userId - User ID to check ownership
   * @returns Promise that resolves to generation entity
   * @throws NotFoundError if generation not found or doesn't belong to user
   */
  private async verifyGeneration(generationId: number, userId: string): Promise<GenerationEntity> {
    const { data: generation, error } = await this.supabase
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", userId)
      .single();

    if (error || !generation) {
      throw new NotFoundError("Generation not found");
    }

    return generation;
  }

  /**
   * Insert flashcards into database
   * @param userId - User ID who owns the flashcards
   * @param generationId - Generation ID to associate with
   * @param flashcards - Flashcard items to insert
   * @returns Promise that resolves to created flashcard entities
   * @throws Error if insert fails or no data returned
   */
  private async insertFlashcards(
    userId: string,
    generationId: number,
    flashcards: ValidatedFlashcardBulkItem[]
  ): Promise<FlashcardEntity[]> {
    const insertData = mapBulkItemsToInsertData(userId, generationId, flashcards);

    const { data, error } = await this.supabase.from("flashcards").insert(insertData).select("*");

    if (error) {
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error("No flashcards were created");
    }

    return data;
  }

  /**
   * Update generation record with new accepted counts
   * @param generationId - Generation ID to update
   * @param generation - Current generation entity
   * @param newAiFullCount - Number of new ai-full flashcards
   * @param newAiEditedCount - Number of new ai-edited flashcards
   * @throws Error if update fails (critical error)
   */
  private async updateGenerationCounts(
    generationId: number,
    generation: GenerationEntity,
    newAiFullCount: number,
    newAiEditedCount: number
  ): Promise<void> {
    const { updatedUneditedCount, updatedEditedCount } = calculateUpdatedGenerationCounts(
      generation.accepted_unedited_count,
      generation.accepted_edited_count,
      newAiFullCount,
      newAiEditedCount
    );

    const { error } = await this.supabase
      .from("generations")
      .update({
        accepted_unedited_count: updatedUneditedCount,
        accepted_edited_count: updatedEditedCount,
      })
      .eq("id", generationId);

    if (error) {
      // This is a critical error - flashcards were created but generation wasn't updated
      console.error("Failed to update generation counts:", error);
      throw new Error(`Failed to update generation counts: ${error.message}`);
    }
  }
}
