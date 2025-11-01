/**
 * Flashcard service for managing flashcard CRUD operations
 * Handles database interactions for flashcards with proper validation and error handling
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  FlashcardDTO,
  GetFlashcardsResponseDTO,
  InsertFlashcardData,
  CreateFlashcardsBulkResponseDTO,
} from "@/types";
import { NotFoundError } from "../../errors";
import type {
  ValidatedCreateFlashcardCommand,
  ValidatedUpdateFlashcardCommand,
  ValidatedFlashcardBulkItem,
  ValidatedGetFlashcardsQuery,
} from "../../validation/flashcard.schemas";
import { FlashcardQueryBuilder } from "./builders/FlashcardQueryBuilder";
import { calculateOffset, calculatePagination } from "./utils/PaginationCalculator";
import { entityToDTO, entitiesToDTOs } from "./mappers/FlashcardMapper";
import { BulkFlashcardOrchestrator } from "./orchestrators/BulkFlashcardOrchestrator";
import { mapUpdateCommandToUpdateData } from "./mappers/FlashcardUpdateMapper";

/**
 * Flashcard service class
 * Provides methods for flashcard CRUD operations and database interactions
 */
export class FlashcardService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Get all flashcards for a user with pagination and filtering
   * @param user_id - User ID who owns the flashcards
   * @param query_params - Query parameters for pagination and filtering
   * @returns Promise that resolves to paginated flashcards response
   * @throws Error if database operation fails
   */
  async getFlashcards(user_id: string, query_params: ValidatedGetFlashcardsQuery): Promise<GetFlashcardsResponseDTO> {
    const { page, limit, source, sort, order } = query_params;

    // Calculate offset for pagination
    const offset = calculateOffset(page, limit);

    // Build and execute query using Fluent API
    const queryBuilder = new FlashcardQueryBuilder(this.supabase);
    const { data, count } = await queryBuilder.executeWithParams({
      userId: user_id,
      source,
      sort,
      order,
      limit,
      offset,
    });

    // Transform entities to DTOs
    const flashcards = entitiesToDTOs(data);

    // Calculate pagination metadata
    const pagination = calculatePagination(page, limit, count || 0);

    return {
      flashcards,
      pagination,
    };
  }

  /**
   * Get a single flashcard by ID
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @returns Promise that resolves to flashcard DTO
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async getFlashcardById(id: number, user_id: string): Promise<FlashcardDTO> {
    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (error || !data) {
      throw new NotFoundError("Flashcard not found");
    }

    return entityToDTO(data);
  }

  /**
   * Create a single manual flashcard
   * @param user_id - User ID who creates the flashcard
   * @param command - Create flashcard command with front and back text
   * @returns Promise that resolves to created flashcard DTO
   * @throws Error if database operation fails
   */
  async createFlashcard(user_id: string, command: ValidatedCreateFlashcardCommand): Promise<FlashcardDTO> {
    const insert_data: InsertFlashcardData = {
      user_id,
      front: command.front,
      back: command.back,
      source: "manual",
      generation_id: null,
    };

    const { data, error } = await this.supabase.from("flashcards").insert(insert_data).select("*").single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    if (!data) {
      throw new Error("No flashcard data returned from database");
    }

    return entityToDTO(data);
  }

  /**
   * Create multiple flashcards at once (from AI generation)
   * Delegates to BulkFlashcardOrchestrator for complex orchestration
   * @param user_id - User ID who creates the flashcards
   * @param generation_id - ID of the generation session
   * @param flashcards - Array of flashcard data to create
   * @returns Promise that resolves to bulk creation response
   * @throws NotFoundError if generation not found or doesn't belong to user
   * @throws ValidationError if validation fails (e.g., exceeds generated_count)
   * @throws Error if database operation fails
   */
  async createFlashcardsBulk(
    user_id: string,
    generation_id: number,
    flashcards: ValidatedFlashcardBulkItem[]
  ): Promise<CreateFlashcardsBulkResponseDTO> {
    const orchestrator = new BulkFlashcardOrchestrator(this.supabase);
    return orchestrator.execute(user_id, generation_id, flashcards);
  }

  /**
   * Update an existing flashcard
   * Implements source transition logic:
   * - "ai-full" → "ai-edited" when content changes
   * - "manual" stays "manual"
   * - "ai-edited" stays "ai-edited"
   *
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @param command - Update command with optional front/back fields
   * @returns Promise that resolves to updated flashcard DTO
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async updateFlashcard(id: number, user_id: string, command: ValidatedUpdateFlashcardCommand): Promise<FlashcardDTO> {
    // 1. Get existing flashcard to verify ownership and current state
    const { data: existing, error: fetch_error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetch_error || !existing) {
      throw new NotFoundError("Flashcard not found");
    }

    // 2. Prepare update data with automatic source transitions
    const update_data = mapUpdateCommandToUpdateData(existing, command);

    // 3. Execute update
    const { data: updated, error: update_error } = await this.supabase
      .from("flashcards")
      .update(update_data)
      .eq("id", id)
      .eq("user_id", user_id)
      .select("*")
      .single();

    if (update_error || !updated) {
      throw new Error(`Failed to update flashcard: ${update_error?.message || "Unknown error"}`);
    }

    return entityToDTO(updated);
  }

  /**
   * Delete a flashcard
   * @param id - Flashcard ID
   * @param user_id - User ID who owns the flashcard
   * @returns Promise that resolves when flashcard is deleted
   * @throws NotFoundError if flashcard not found or doesn't belong to user
   * @throws Error if database operation fails
   */
  async deleteFlashcard(id: number, user_id: string): Promise<void> {
    // First, verify the flashcard exists and belongs to user
    const { data: existing } = await this.supabase
      .from("flashcards")
      .select("id")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (!existing) {
      throw new NotFoundError("Flashcard not found");
    }

    // Delete the flashcard
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id).eq("user_id", user_id);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }
}
